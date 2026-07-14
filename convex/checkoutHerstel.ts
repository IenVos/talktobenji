/**
 * Afgehaakte checkouts terughalen.
 *
 * Op de checkout vult iemand eerst naam + e-mail in (dan pas kennen we hem) en
 * gaat daarna naar de bank. Haakt hij daar af, dan blijft de betaling in Stripe
 * staan als "onvolledig" en horen wij niets meer. We leggen die poging hier vast
 * en sturen na een tijdje één (of twee) herinneringsmail(s). Zodra de betaling
 * alsnog slaagt, markeert de Stripe-webhook de poging als betaald.
 *
 * De mails staan standaard UIT: aanzetten kan in de admin.
 */
import { v } from "convex/values";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { checkAdmin } from "./adminAuth";
import {
  appBase,
  ehFooter,
  mailAlinea,
  mailHandtekeningIen,
  mailWrapper,
  nietAlleenUrlVoorType,
} from "./ehMailFooter";

const FROM = "Ien van Talk To Benji <contactmetien@talktobenji.com>";

const STANDAARD_UREN = 3;    // mail 1: uren na het afhaken
const STANDAARD_TWEEDE = 48; // mail 2: uren na mail 1
const STANDAARD_MAX = 1;
const STANDAARD_VENSTER_VAN = 8;  // niet mailen vóór 08:00 (Nederlandse tijd)
const STANDAARD_VENSTER_TOT = 21; // en niet meer ná 21:00

// HMAC-token voor de afmeldlink (gelijk berekend in /api/afmelden, Node-kant).
async function afmeldToken(email: string): Promise<string> {
  const secret = process.env.ADMIN_SESSION_SECRET || "";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(email.toLowerCase()));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 24);
}

async function afmeldUrl(email: string): Promise<string> {
  const token = await afmeldToken(email);
  return `${appBase()}/api/afmelden?e=${encodeURIComponent(email.toLowerCase())}&t=${token}&bron=checkout`;
}

// Terug naar de checkout, met naam en e-mail erin zodat ze die niet opnieuw
// hoeven te typen, plus de herkomst voor de analytics.
function checkoutUrl(slug: string, email: string, naam?: string): string {
  const params = new URLSearchParams({ bron: "checkout-mail", e: email });
  if (naam && naam.trim()) params.set("n", naam.trim());
  return `${appBase()}/betalen/${slug}?${params.toString()}`;
}

function secretOk(secret: string): boolean {
  return secret === (process.env.STRIPE_INTERNAL_SECRET ?? process.env.KENNISSHOP_WEBHOOK_SECRET);
}

// ── Vastleggen (vanuit de checkout) ───────────────────────────────────────────

/**
 * Vastleggen dat iemand zijn gegevens heeft ingevuld en naar de betaalstap gaat.
 * Wordt aangeroepen door /api/stripe/create-payment-intent op het moment dat we
 * e-mail en naam aan de PaymentIntent hangen. Dezelfde poging (paymentIntentId)
 * kan meerdere keren binnenkomen; die werken we bij in plaats van te dubbelen.
 */
export const registreerPoging = mutation({
  args: {
    webhookSecret: v.string(),
    paymentIntentId: v.string(),
    email: v.string(),
    naam: v.optional(v.string()),
    slug: v.string(),
    productNaam: v.optional(v.string()),
    bedragCenten: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!secretOk(args.webhookSecret)) throw new Error("Geen toegang");
    const email = args.email.trim().toLowerCase();
    if (!email) return;

    const bestaand = await ctx.db
      .query("checkoutPogingen")
      .withIndex("by_paymentIntent", (q) => q.eq("paymentIntentId", args.paymentIntentId))
      .unique();

    if (bestaand) {
      await ctx.db.patch(bestaand._id, {
        email,
        naam: args.naam ?? bestaand.naam,
        productNaam: args.productNaam ?? bestaand.productNaam,
        bedragCenten: args.bedragCenten ?? bestaand.bedragCenten,
      });
      return;
    }

    await ctx.db.insert("checkoutPogingen", {
      email,
      naam: args.naam,
      slug: args.slug,
      productNaam: args.productNaam,
      bedragCenten: args.bedragCenten,
      paymentIntentId: args.paymentIntentId,
      createdAt: Date.now(),
      herinneringen: 0,
    });
  },
});

/** Betaling geslaagd: poging afsluiten zodat er geen herinnering meer uitgaat. */
export const markeerBetaald = mutation({
  args: { webhookSecret: v.string(), paymentIntentId: v.string() },
  handler: async (ctx, args) => {
    if (!secretOk(args.webhookSecret)) throw new Error("Geen toegang");
    const poging = await ctx.db
      .query("checkoutPogingen")
      .withIndex("by_paymentIntent", (q) => q.eq("paymentIntentId", args.paymentIntentId))
      .unique();
    if (poging && !poging.betaaldAt) {
      await ctx.db.patch(poging._id, { betaaldAt: Date.now() });
    }
  },
});

/** Afmelden via de link in de herinneringsmail (aangeroepen door /api/afmelden). */
export const afmelden = mutation({
  args: { email: v.string(), secret: v.string() },
  handler: async (ctx, args) => {
    if (!process.env.ADMIN_SESSION_SECRET || args.secret !== process.env.ADMIN_SESSION_SECRET) {
      throw new Error("Niet geautoriseerd");
    }
    const email = args.email.trim().toLowerCase();
    const pogingen = await ctx.db
      .query("checkoutPogingen")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();
    for (const p of pogingen) {
      if (!p.afgemeld) await ctx.db.patch(p._id, { afgemeld: true });
    }
  },
});

// ── Instellingen ──────────────────────────────────────────────────────────────

async function leesConfig(ctx: { db: any }) {
  const rij = await ctx.db.query("checkoutHerstelConfig").first();
  return {
    actief: rij?.actief ?? false,
    urenWachten: rij?.urenWachten ?? STANDAARD_UREN,
    urenTweede: rij?.urenTweede ?? STANDAARD_TWEEDE,
    maxHerinneringen: rij?.maxHerinneringen ?? STANDAARD_MAX,
    vensterVan: rij?.vensterVan ?? STANDAARD_VENSTER_VAN,
    vensterTot: rij?.vensterTot ?? STANDAARD_VENSTER_TOT,
  };
}

// Het huidige uur in Nederland (Convex draait op UTC, dus zelf omrekenen).
function uurInNederland(nu: number): number {
  const tekst = new Intl.DateTimeFormat("nl-NL", {
    timeZone: "Europe/Amsterdam",
    hour: "numeric",
    hour12: false,
  }).format(new Date(nu));
  return Number(tekst);
}

export const config = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    return await leesConfig(ctx);
  },
});

export const setConfig = mutation({
  args: {
    adminToken: v.string(),
    actief: v.boolean(),
    urenWachten: v.number(),
    urenTweede: v.optional(v.number()),
    maxHerinneringen: v.number(),
    vensterVan: v.optional(v.number()),
    vensterTot: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const uur = (waarde: number | undefined, standaard: number) =>
      Math.min(23, Math.max(0, Math.round(waarde ?? standaard)));

    const rij = await ctx.db.query("checkoutHerstelConfig").first();
    const velden = {
      actief: args.actief,
      urenWachten: Math.min(72, Math.max(1, Math.round(args.urenWachten))),
      urenTweede: Math.min(336, Math.max(1, Math.round(args.urenTweede ?? STANDAARD_TWEEDE))),
      maxHerinneringen: Math.min(2, Math.max(1, Math.round(args.maxHerinneringen))),
      vensterVan: uur(args.vensterVan, STANDAARD_VENSTER_VAN),
      vensterTot: uur(args.vensterTot, STANDAARD_VENSTER_TOT),
      updatedAt: Date.now(),
    };
    if (rij) await ctx.db.patch(rij._id, velden);
    else await ctx.db.insert("checkoutHerstelConfig", velden);
  },
});

// ── Overzicht voor de admin ───────────────────────────────────────────────────

export const overzicht = query({
  args: { adminToken: v.string(), sinceDays: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const dagen = args.sinceDays && args.sinceDays > 0 ? args.sinceDays : 30;
    const cutoff = Date.now() - dagen * 24 * 60 * 60 * 1000;

    const pogingen = await ctx.db
      .query("checkoutPogingen")
      .withIndex("by_createdAt", (q) => q.gte("createdAt", cutoff))
      .collect();

    const betaald = pogingen.filter((p) => p.betaaldAt).length;
    const open = pogingen.filter((p) => !p.betaaldAt);

    return {
      dagen,
      totaal: pogingen.length,
      betaald,
      afgehaakt: open.length,
      // Nieuwste eerst; dit is de lijst waar de herinneringen naartoe gaan.
      pogingen: open
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 200)
        .map((p) => ({
          id: p._id,
          email: p.email,
          naam: p.naam,
          slug: p.slug,
          productNaam: p.productNaam,
          bedragCenten: p.bedragCenten,
          createdAt: p.createdAt,
          herinneringen: p.herinneringen,
          herinneringAt: p.herinneringAt,
          afgemeld: p.afgemeld ?? false,
        })),
      config: await leesConfig(ctx),
    };
  },
});

// ── Herinneringsmail ──────────────────────────────────────────────────────────

export const _teHerinneren = internalQuery({
  args: {},
  handler: async (ctx) => {
    const cfg = await leesConfig(ctx);
    if (!cfg.actief) return { cfg, pogingen: [] };

    const nu = Date.now();
    // Buiten het verzendvenster wachten we: een mail die om 3 uur 's nachts rijp
    // wordt, gaat gewoon 's ochtends alsnog uit (de cron draait elk uur).
    const uur = uurInNederland(nu);
    if (uur < cfg.vensterVan || uur >= cfg.vensterTot) return { cfg, pogingen: [] };

    const uurMs = 60 * 60 * 1000;
    // Kijk maximaal een week terug: ouder dan dat is een herinnering niet meer zinvol.
    const cutoff = nu - 7 * 24 * 60 * 60 * 1000;

    const pogingen = await ctx.db
      .query("checkoutPogingen")
      .withIndex("by_createdAt", (q) => q.gte("createdAt", cutoff))
      .collect();

    const rijp = pogingen.filter((p) => {
      if (p.betaaldAt || p.afgemeld) return false;
      if (p.herinneringen >= cfg.maxHerinneringen) return false;
      // Mail 1: urenWachten ná het afhaken. Mail 2: urenTweede ná mail 1.
      const basis =
        p.herinneringen === 0
          ? p.createdAt + cfg.urenWachten * uurMs
          : (p.herinneringAt ?? 0) + cfg.urenTweede * uurMs;
      return nu >= basis;
    });

    return {
      cfg,
      pogingen: rijp.map((p) => ({
        id: p._id,
        email: p.email,
        naam: p.naam,
        slug: p.slug,
        productNaam: p.productNaam,
        herinneringen: p.herinneringen,
      })),
    };
  },
});

export const _logHerinnering = internalMutation({
  args: { id: v.id("checkoutPogingen") },
  handler: async (ctx, args) => {
    const p = await ctx.db.get(args.id);
    if (!p) return;
    await ctx.db.patch(args.id, {
      herinneringen: p.herinneringen + 1,
      herinneringAt: Date.now(),
    });
  },
});

// Zelfde opmaak als de andere mails van Ien: dezelfde romp, knop, handtekening
// en footer (uit ehMailFooter), zodat deze mail er niet uit springt.
function herinneringHtml(args: {
  naam?: string;
  productNaam?: string;
  verliestype?: string;
  checkoutUrl: string;
  afmeldUrl: string;
  tweede: boolean;
}): string {
  const voornaam = (args.naam || "").trim().split(" ")[0];
  const aanhef = voornaam ? `Hi ${voornaam},` : "Hi,";
  const product = args.productNaam || "Niet Alleen";
  // De link staat in de tekst, niet als losse knop: dat leest als een berichtje
  // van Ien in plaats van als een verkoopmail.
  const link = `<a href="${args.checkoutUrl}" style="color: #6d84a8; font-weight: 600;">👉 Ik wil starten met Niet Alleen</a>`;

  const alineas = args.tweede
    ? [
        `Ik wilde je nog één keer laten weten dat je plek in ${product} voor je klaarstaat. Daarna laat ik je met rust.`,
        `Wil je het alsnog afronden, dan kan dat hier: ${link}`,
        "En als er iets niet klopte met de betaling, of als je een vraag hebt, stuur me dan gerust een berichtje. Ik help je er graag bij!",
      ]
    : [
        `Ik zag dat je bezig was met ${product}, maar dat de bestelling nog niet helemaal is afgerond. Misschien liep je ergens tegenaan, of wilde je er nog even over nadenken, dat snap ik helemaal.`,
        "Mocht je het alsnog willen afronden, dan kun je dat eenvoudig doen via de link hieronder:",
        link,
        "En als er iets niet klopte met de betaling, of als je een vraag hebt, stuur me dan gerust een berichtje. Ik help je er graag bij!",
      ];

  return mailWrapper(`
    ${mailAlinea(aanhef)}
    ${alineas.map(mailAlinea).join("\n")}
    ${mailHandtekeningIen()}
    ${ehFooter(nietAlleenUrlVoorType(args.verliestype ?? "algemeen"), args.afmeldUrl)}
  `);
}

async function verstuurMail(args: { to: string; subject: string; html: string; apiKey: string }) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${args.apiKey}` },
    body: JSON.stringify({
      from: FROM,
      to: [args.to],
      subject: args.subject,
      html: args.html,
      tags: [
        { name: "programma", value: "checkout" },
        { name: "mail", value: "herinnering" },
      ],
    }),
  });
  if (!response.ok) {
    throw new Error(`E-mail verzenden mislukt (${response.status}): ${await response.text()}`);
  }
}

/** Draait elk uur: stuurt herinneringen voor checkouts die zijn blijven liggen. */
export const processHerinneringen = internalAction({
  args: {},
  handler: async (ctx) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return;

    const { pogingen } = await ctx.runQuery(internal.checkoutHerstel._teHerinneren, {});
    for (const p of pogingen) {
      const tweede = p.herinneringen >= 1;
      const html = herinneringHtml({
        naam: p.naam,
        productNaam: p.productNaam,
        checkoutUrl: checkoutUrl(p.slug, p.email, p.naam),
        afmeldUrl: await afmeldUrl(p.email),
        tweede,
      });
      try {
        await verstuurMail({
          to: p.email,
          subject: tweede ? "Je plek staat nog voor je klaar" : "Je bestelling is niet afgerond",
          html,
          apiKey,
        });
        await ctx.runMutation(internal.checkoutHerstel._logHerinnering, { id: p.id });
      } catch (err) {
        console.error("[checkout-herstel] mail mislukt:", (err as Error).message);
      }
    }
  },
});

/** Testmail naar jezelf, om de tekst te bekijken zonder te wachten. */
export const stuurTestHerinnering = action({
  args: { adminToken: v.string(), email: v.string() },
  handler: async (ctx, args): Promise<{ ok: boolean }> => {
    await ctx.runQuery(internal.checkoutHerstel._checkAdminVoorTest, {
      adminToken: args.adminToken,
    });
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY ontbreekt");

    await verstuurMail({
      to: args.email,
      subject: "[TEST] Je bestelling is niet afgerond",
      html: herinneringHtml({
        naam: "Ien",
        productNaam: "Niet Alleen",
        checkoutUrl: checkoutUrl("niet-alleen-huisdier", args.email, "Ien"),
        afmeldUrl: await afmeldUrl(args.email),
        tweede: false,
      }),
      apiKey,
    });
    return { ok: true };
  },
});

export const _checkAdminVoorTest = internalQuery({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    return true;
  },
});
