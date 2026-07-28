/**
 * Evergreen funnel-bouwer — Convex-kant (stap 3).
 *
 * Blokken (thema's) met daarin mails op een dagoffset. Elke lead heeft een eigen
 * dag 1 (zie funnelLeads); de reeks staat stil, de mensen bewegen erdoorheen.
 * Dit bestand beheert alleen de opbouw. Er verstuurt nog niets: de dagelijkse
 * cron en de verzending komen in stap 4. Zie PLAN_EVERGREEN_FUNNEL.md.
 */
import {
  query,
  mutation,
  action,
  internalQuery,
  internalMutation,
  internalAction,
} from "./_generated/server";
import { v } from "convex/values";
import { internal, api } from "./_generated/api";
import { checkAdmin } from "./adminAuth";
import {
  appBase,
  mailAlinea,
  mailKnop,
  mailWrapper,
  mailHandtekeningIen,
  ehAfmeldUrl,
  ehAfmeldToken,
  nietAlleenUrlVoorType,
  persoonlijkOnderwerp,
} from "./ehMailFooter";
import { BENJI_BLOK_MARKER } from "./ehConcepten";

const DAG_MS = 24 * 60 * 60 * 1000;

// ── Lezen ────────────────────────────────────────────────────────────────────

/** Alle blokken op volgorde, elk met hun mails (op dagoffset). Voor de admin. */
export const blokkenMetMails = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const [blokken, mails] = await Promise.all([
      ctx.db.query("funnelBlokken").withIndex("by_volgorde").collect(),
      ctx.db.query("funnelMails").collect(),
    ]);
    blokken.sort((a, b) => a.volgorde - b.volgorde);
    return blokken.map((b) => ({
      ...b,
      mails: mails
        .filter((m) => m.blokId === b._id)
        .sort((x, y) => x.dagOffset - y.dagOffset),
    }));
  },
});

/**
 * Tijdlijn: alle actieve mails (in actieve blokken) op dagvolgorde, zodat je ziet
 * wat een lead in welke volgorde krijgt. Varianten per verliestype worden samen
 * op hun dag getoond.
 */
export const tijdlijn = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const [blokken, mails] = await Promise.all([
      ctx.db.query("funnelBlokken").collect(),
      ctx.db.query("funnelMails").collect(),
    ]);
    const blokById = new Map(blokken.map((b) => [b._id, b]));
    return mails
      .filter((m) => {
        const b = blokById.get(m.blokId);
        return m.actief && b && b.actief;
      })
      .map((m) => {
        const b = blokById.get(m.blokId)!;
        return {
          dagOffset: m.dagOffset,
          subject: m.subject,
          blokNaam: b.naam,
          verliesType: m.verliesType ?? null,
        };
      })
      .sort((a, b) => a.dagOffset - b.dagOffset || a.blokNaam.localeCompare(b.blokNaam));
  },
});

// ── Blokken ──────────────────────────────────────────────────────────────────

export const blokToevoegen = mutation({
  args: {
    adminToken: v.string(),
    naam: v.string(),
    fase: v.optional(v.string()),
    vanDag: v.number(),
    totDag: v.number(),
    actief: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const bestaande = await ctx.db.query("funnelBlokken").collect();
    const volgorde = bestaande.reduce((m, b) => Math.max(m, b.volgorde), -1) + 1;
    await ctx.db.insert("funnelBlokken", {
      naam: args.naam.trim() || "Naamloos blok",
      fase: args.fase?.trim() || undefined,
      volgorde,
      vanDag: args.vanDag,
      totDag: args.totDag,
      actief: args.actief ?? true,
      updatedAt: Date.now(),
    });
    return { ok: true };
  },
});

export const blokBijwerken = mutation({
  args: {
    adminToken: v.string(),
    id: v.id("funnelBlokken"),
    naam: v.string(),
    fase: v.optional(v.string()),
    vanDag: v.number(),
    totDag: v.number(),
    actief: v.boolean(),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    await ctx.db.patch(args.id, {
      naam: args.naam.trim() || "Naamloos blok",
      fase: args.fase?.trim() || undefined,
      vanDag: args.vanDag,
      totDag: args.totDag,
      actief: args.actief,
      updatedAt: Date.now(),
    });
    return { ok: true };
  },
});

/** Verwijder een blok én de mails erin. */
export const blokVerwijderen = mutation({
  args: { adminToken: v.string(), id: v.id("funnelBlokken") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const mails = await ctx.db
      .query("funnelMails")
      .withIndex("by_blok", (q) => q.eq("blokId", args.id))
      .collect();
    for (const m of mails) await ctx.db.delete(m._id);
    await ctx.db.delete(args.id);
    return { ok: true, verwijderdeMails: mails.length };
  },
});

/** Verplaats een blok omhoog of omlaag (wissel volgnummer met de buur). */
export const blokVerplaatsen = mutation({
  args: {
    adminToken: v.string(),
    id: v.id("funnelBlokken"),
    richting: v.union(v.literal("omhoog"), v.literal("omlaag")),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const blokken = (await ctx.db.query("funnelBlokken").collect()).sort(
      (a, b) => a.volgorde - b.volgorde
    );
    const i = blokken.findIndex((b) => b._id === args.id);
    if (i === -1) return { ok: false };
    const j = args.richting === "omhoog" ? i - 1 : i + 1;
    if (j < 0 || j >= blokken.length) return { ok: false };
    const a = blokken[i];
    const b = blokken[j];
    await ctx.db.patch(a._id, { volgorde: b.volgorde, updatedAt: Date.now() });
    await ctx.db.patch(b._id, { volgorde: a.volgorde, updatedAt: Date.now() });
    return { ok: true };
  },
});

// ── Mails ────────────────────────────────────────────────────────────────────

export const mailToevoegen = mutation({
  args: {
    adminToken: v.string(),
    blokId: v.id("funnelBlokken"),
    dagOffset: v.number(),
    subject: v.string(),
    bodyText: v.string(),
    buttonText: v.optional(v.string()),
    buttonUrl: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    imageCaption: v.optional(v.string()),
    verliesType: v.optional(v.string()),
    actief: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    await ctx.db.insert("funnelMails", {
      blokId: args.blokId,
      dagOffset: args.dagOffset,
      subject: args.subject,
      bodyText: args.bodyText,
      buttonText: args.buttonText?.trim() || undefined,
      buttonUrl: args.buttonUrl?.trim() || undefined,
      imageUrl: args.imageUrl?.trim() || undefined,
      imageCaption: args.imageCaption?.trim() || undefined,
      verliesType: args.verliesType?.trim() || undefined,
      actief: args.actief ?? true,
      updatedAt: Date.now(),
    });
    return { ok: true };
  },
});

export const mailBijwerken = mutation({
  args: {
    adminToken: v.string(),
    id: v.id("funnelMails"),
    dagOffset: v.number(),
    subject: v.string(),
    bodyText: v.string(),
    buttonText: v.optional(v.string()),
    buttonUrl: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    imageCaption: v.optional(v.string()),
    verliesType: v.optional(v.string()),
    actief: v.boolean(),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    await ctx.db.patch(args.id, {
      dagOffset: args.dagOffset,
      subject: args.subject,
      bodyText: args.bodyText,
      buttonText: args.buttonText?.trim() || undefined,
      buttonUrl: args.buttonUrl?.trim() || undefined,
      imageUrl: args.imageUrl?.trim() || undefined,
      imageCaption: args.imageCaption?.trim() || undefined,
      verliesType: args.verliesType?.trim() || undefined,
      actief: args.actief,
      updatedAt: Date.now(),
    });
    return { ok: true };
  },
});

export const mailVerwijderen = mutation({
  args: { adminToken: v.string(), id: v.id("funnelMails") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    await ctx.db.delete(args.id);
    return { ok: true };
  },
});

// ── Verzending (stap 4): renderer + dagelijkse motor ─────────────────────────
// Elke lead heeft een eigen dag 1 (funnelLeads.ingestroomdOp). De cron kijkt per
// lead welke mail nu aan de beurt is, hoogstens één per dag, en plant die gespreid
// in. Draait alleen als env EVERGREEN_ACTIEF === "true". De evergreen mails hebben
// een EIGEN voettekst: de Niet Alleen-brug alleen in de laatste mail van een blok,
// plus een rustoptie ("liever alleen maandelijks").

const EH_TYPES = ["persoon", "huisdier", "scheiding", "eenzaamheid", "kinderloos"];
const ALGEMEEN = "algemeen";
function normType(t?: string | null): string {
  return t && EH_TYPES.includes(t) ? t : ALGEMEEN;
}

// Afsluitgroeten die de foto-handtekening eronder krijgen (zoals bij de EH-mails).
const AFSLUITINGEN = [
  "lieve groet", "lieve groetjes", "veel liefs", "liefs", "met liefs",
  "warme groet", "een warme groet", "met warme groet", "groetjes",
  "warme groetjes", "veel sterkte", "sterkte",
];
const isAfsluiting = (p: string) =>
  AFSLUITINGEN.includes(p.toLowerCase().replace(/[.,!\s]+$/g, "").trim());

const AFBEELDING_MARKER = /^\[afbeelding\]$/i;
const KNOP_MARKER = /^\[knop\]$/i;

function inlineAfbeelding(url: string, caption?: string): string {
  const img = `<img src="${url}" alt="" style="width:100%;max-width:480px;height:auto;border-radius:12px;display:block;margin:0 auto;" />`;
  const cap = caption ? `<p style="font-size:13px;color:#6b6460;text-align:center;margin:10px 0 0 0;">${caption}</p>` : "";
  return `<div style="margin:24px 0;">${img}${cap}</div>`;
}
function coverBlok(url: string, linkUrl?: string, caption?: string): string {
  const img = `<img src="${url}" alt="" style="max-width:240px;width:100%;height:auto;border-radius:10px;display:block;margin:0 auto;box-shadow:0 4px 18px rgba(0,0,0,0.12);" />`;
  const inner = linkUrl ? `<a href="${linkUrl}" style="text-decoration:none;display:inline-block;">${img}</a>` : img;
  const cap = caption ? `<p style="font-size:13px;color:#6b6460;margin:12px 0 0 0;">${caption}</p>` : "";
  return `<div style="margin:26px 0;text-align:center;">${inner}${cap}</div>`;
}
function benjiBlokHtml(benjiUrl: string): string {
  return `<div style="margin:26px 0 6px;background:#ffffff;border:1px solid #e7ded1;border-radius:16px;padding:24px 22px;text-align:center;"><p style="font-size:16px;font-weight:700;color:#3d3530;margin:0 0 8px;">7 dagen gratis met Benji</p><p style="font-size:14px;line-height:1.6;color:#6b6460;margin:0 0 18px;">Een plek om je verhaal kwijt te kunnen, wanneer jij wilt. Ook midden in de nacht.</p><a href="${benjiUrl}" style="display:inline-block;background:#fdf9f4;color:#9a8168;border:1.5px solid #9a8168;padding:11px 24px;border-radius:12px;font-weight:600;font-size:15px;text-decoration:none;">Maak kennis met Benji &rarr;</a><p style="font-size:12px;line-height:1.5;color:#9a938c;margin:14px 0 0;">Geen formulier, geen wachtwoord.</p></div>`;
}

// Eigen evergreen-voettekst: Niet Alleen-brug alleen in de laatste mail van een blok;
// altijd een rustoptie (alleen maandelijks) én een afmeldlink.
function evergreenFooter(naUrl: string | null, rustUrl: string, afmeldUrl: string): string {
  const brug = naUrl
    ? `<p style="font-size:14px;font-weight:600;color:#3d3530;margin:0 0 12px;"><a href="${naUrl}" style="color:#6d84a8;text-decoration:underline;">Niet Alleen voor jou</a></p>`
    : "";
  return `
    <div style="text-align:center;margin-top:44px;">
      <img src="https://www.talktobenji.com/images/benji-logo-2.png" alt="Talk To Benji" width="42" height="42" style="display:inline-block;width:42px;height:42px;margin:0 0 12px 0;" />
      ${brug}
      <p style="font-size:13px;color:#718096;margin:7px 0 0 0;">Heb je vragen? Beantwoord gewoon deze mail.</p>
      <p style="font-size:12px;line-height:1.7;color:#a0aec0;margin:26px 0 0 0;border-top:1px solid #ece5dc;padding-top:16px;">
        <a href="${rustUrl}" style="color:#a0aec0;text-decoration:underline;">Liever minder mail? Alleen nog maandelijks</a>
        <br/>
        <a href="${afmeldUrl}" style="color:#a0aec0;text-decoration:underline;">Helemaal geen mail meer ontvangen</a>
      </p>
    </div>`;
}

async function rustUrlVoor(email: string): Promise<string> {
  const token = await ehAfmeldToken(email);
  return `${appBase()}/api/rust?e=${encodeURIComponent(email)}&t=${token}`;
}

// Bouw de HTML van één evergreen-mail. Volgordegetrouw (markers op hun eigen plek),
// met de foto-handtekening onder de afsluitgroet. isLaatsteVanBlok bepaalt of de
// Niet Alleen-brug in de voettekst staat.
async function bouwEvergreenHtml(
  ctx: any,
  args: {
    email: string;
    naam?: string;
    type: string;
    subject: string;
    bodyText: string;
    buttonText?: string;
    buttonUrl?: string;
    imageUrl?: string;
    imageCaption?: string;
    isLaatsteVanBlok: boolean;
  }
): Promise<string> {
  const voornaam = (args.naam || "").trim().split(" ")[0];
  const body = args.bodyText.replace(/\{voornaam\}/g, voornaam).replace(/(Hi|Hoi)\s+,/g, "$1,");
  const imageUrl = (args.imageUrl || "").trim() || undefined;
  const imageCaption = (args.imageCaption || "").trim() || undefined;

  const heeftBlok = body.includes(BENJI_BLOK_MARKER);
  let blokHtml = "";
  if (heeftBlok) {
    const token = await ctx.runMutation(internal.benjiStart.genereerTokenInternal, {
      email: args.email,
      naam: args.naam,
    });
    blokHtml = benjiBlokHtml(`${appBase()}/benji-start?token=${token}`);
  }

  const knopTekst = (args.buttonText || "").trim();
  const knopUrl = (args.buttonUrl || "").trim();
  const toonKnop = !!knopTekst && !!knopUrl;
  const knopHtml = toonKnop ? mailKnop(knopTekst, knopUrl) : "";
  const coverHtml = imageUrl ? coverBlok(imageUrl, knopUrl || undefined, imageCaption) : "";
  const psStijl = (p: string) =>
    `<p style="font-size:14px;line-height:1.75;color:#718096;margin-top:20px;">${p.replace(/\n/g, "<br/>")}</p>`;

  const alineas = body.split(/\n\n+/).map((p: string) => p.trim()).filter(Boolean);
  const gebruiktAfbeelding = alineas.some((p: string) => AFBEELDING_MARKER.test(p));
  const gebruiktKnop = alineas.some((p: string) => KNOP_MARKER.test(p));
  const isPS = (p: string) => /^p\.?\s*s\.?/i.test(p);
  let groetIndex = -1;
  alineas.forEach((p: string, i: number) => {
    if (isAfsluiting(p)) groetIndex = i;
  });
  const autoVoorGroet = `${!gebruiktAfbeelding ? coverHtml : ""}${!gebruiktKnop ? knopHtml : ""}`;

  // P.S.-regels horen altijd onderaan, ná de handtekening. We renderen ze dus niet
  // op hun plek in de tekst, maar verzamelen ze en zetten ze als laatste. Zo staan
  // ze goed, óók als de mail geen herkende afsluitgroet heeft.
  const psStukken: string[] = [];
  const stukken: string[] = [];
  alineas.forEach((p: string, i: number) => {
    if (p.includes(BENJI_BLOK_MARKER)) stukken.push(blokHtml);
    else if (AFBEELDING_MARKER.test(p)) { if (imageUrl) stukken.push(inlineAfbeelding(imageUrl, imageCaption)); }
    else if (KNOP_MARKER.test(p)) { if (toonKnop) stukken.push(knopHtml); }
    else if (isPS(p)) psStukken.push(psStijl(p));
    else if (i === groetIndex) {
      stukken.push(autoVoorGroet);
      stukken.push(mailAlinea(p));
      stukken.push(mailHandtekeningIen());
    } else stukken.push(mailAlinea(p));
  });
  if (groetIndex === -1) {
    stukken.push(autoVoorGroet);
    stukken.push(mailHandtekeningIen());
  }
  stukken.push(...psStukken);

  const naUrl = args.isLaatsteVanBlok ? nietAlleenUrlVoorType(args.type) : null;
  const [rustUrl, afmeldUrl] = await Promise.all([
    rustUrlVoor(args.email),
    ehAfmeldUrl(args.email, "evergreen", args.type),
  ]);

  return mailWrapper(`
    ${stukken.join("\n")}
    ${evergreenFooter(naUrl, rustUrl, afmeldUrl)}
  `);
}

async function verstuurEvergreenEmail(args: { to: string; subject: string; html: string; apiKey: string; mailId: string }) {
  const FROM = "Ien van Talk To Benji <contactmetien@talktobenji.com>";
  for (let poging = 1; poging <= 4; poging++) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${args.apiKey}` },
      body: JSON.stringify({
        from: FROM,
        to: [args.to],
        subject: args.subject,
        html: args.html,
        tags: [
          { name: "programma", value: "evergreen" },
          { name: "mail", value: args.mailId },
        ],
      }),
    });
    if (res.ok) return;
    const detail = await res.text();
    const tijdelijk = res.status === 429 || res.status >= 500;
    if (!tijdelijk || poging === 4) throw new Error(`Evergreen-mail mislukt (status ${res.status}): ${detail}`);
    await new Promise((r) => setTimeout(r, poging * 1500));
  }
}

// ── Interne data + veiligheids-helpers ───────────────────────────────────────

// Bepaalt per lead welke mail nu aan de beurt is (hoogstens één), inclusief alle
// veiligheidschecks. Kopers worden apart teruggegeven om op "koper" te zetten.
export const _evergreenPlan = internalQuery({
  args: {},
  handler: async (ctx) => {
    const nu = Date.now();
    const [blokken, alleMails, leads, afmeldingen, naProfielen, subs, verzonden] =
      await Promise.all([
        ctx.db.query("funnelBlokken").collect(),
        ctx.db.query("funnelMails").collect(),
        ctx.db.query("funnelLeads").withIndex("by_status", (q) => q.eq("status", "in-backend")).collect(),
        ctx.db.query("ehAfmeldingen").collect(),
        ctx.db.query("nietAlleenProfiles").collect(),
        ctx.db.query("userSubscriptions").collect(),
        ctx.db.query("funnelVerzonden").collect(),
      ]);

    const afgemeldSet = new Set(afmeldingen.map((a: any) => a.email.toLowerCase()));
    const naSet = new Set(naProfielen.map((p: any) => p.email.toLowerCase()));
    const kochtSet = new Set<string>();
    for (const s of subs) {
      if (s.email && (s.pricePaid ?? 0) > 0) kochtSet.add(s.email.toLowerCase());
    }

    const blokById = new Map(blokken.map((b: any) => [b._id, b]));
    const mailById = new Map(alleMails.map((m: any) => [m._id, m]));
    // Actieve mails (in actieve blokken), gegroepeerd per dagOffset.
    const actieveMails = alleMails.filter((m: any) => {
      const b = blokById.get(m.blokId);
      return m.actief && b && b.actief;
    });
    // Hoogste dagOffset per blok (voor "laatste mail van een blok").
    const maxDagPerBlok = new Map<string, number>();
    for (const m of actieveMails) {
      const cur = maxDagPerBlok.get(m.blokId) ?? -1;
      if (m.dagOffset > cur) maxDagPerBlok.set(m.blokId, m.dagOffset);
    }

    // Verzonden per e-mail → set van dagOffsets (via de mail waar het bij hoort).
    const verzondenDagen = new Map<string, Set<number>>();
    for (const v of verzonden) {
      const m = mailById.get(v.mailId);
      if (!m) continue;
      const e = v.email.toLowerCase();
      const set = verzondenDagen.get(e) ?? new Set<number>();
      set.add(m.dagOffset);
      verzondenDagen.set(e, set);
    }

    const teVerzenden: {
      email: string;
      naam: string | null;
      type: string;
      mailId: any;
      isLaatsteVanBlok: boolean;
    }[] = [];
    const teMarkerenKoper: string[] = [];

    for (const lead of leads) {
      const email = lead.email.toLowerCase();
      if (naSet.has(email) || kochtSet.has(email)) {
        teMarkerenKoper.push(email);
        continue;
      }
      if (afgemeldSet.has(email)) continue; // afmelding = geen mail (status blijft; cron slaat over)

      const type = normType(lead.verliesType);
      const dag = Math.floor((nu - lead.ingestroomdOp) / DAG_MS) + 1; // eigen dag 1 = instroomdag
      const alGehad = verzondenDagen.get(email) ?? new Set<number>();

      // Kies per dagOffset de passende mail (variant voor dit type, anders algemeen).
      // Een dagOffset zonder passende mail is voor deze lead simpelweg geen stap.
      const kandidaten = actieveMails
        .filter((m: any) => m.dagOffset <= dag && !alGehad.has(m.dagOffset))
        .map((m: any) => m.dagOffset);
      const unieke = Array.from(new Set<number>(kandidaten)).sort((a, b) => a - b);

      let gekozen: any = null;
      for (const d of unieke) {
        const opDag = actieveMails.filter((m: any) => m.dagOffset === d);
        const variant = opDag.find((m: any) => normType(m.verliesType) === type && m.verliesType);
        const algemeen = opDag.find((m: any) => !m.verliesType);
        const mail = variant ?? algemeen ?? null;
        if (mail) {
          gekozen = mail;
          break;
        }
      }
      if (!gekozen) continue;

      teVerzenden.push({
        email,
        naam: lead.naam ?? null,
        type,
        mailId: gekozen._id,
        isLaatsteVanBlok: (maxDagPerBlok.get(gekozen.blokId) ?? -1) === gekozen.dagOffset,
      });
    }

    return { teVerzenden, teMarkerenKoper };
  },
});

// Controle vlak vóór verzending (na de spreiding kan er van alles veranderd zijn).
export const _evergreenCheck = internalQuery({
  args: { email: v.string(), mailId: v.id("funnelMails") },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase();
    const [lead, afgemeld, naProfiel, subs, verzonden, mail] = await Promise.all([
      ctx.db.query("funnelLeads").withIndex("by_email", (q) => q.eq("email", email)).first(),
      ctx.db.query("ehAfmeldingen").withIndex("by_email", (q) => q.eq("email", email)).first(),
      ctx.db.query("nietAlleenProfiles").withIndex("by_email", (q) => q.eq("email", email)).first(),
      ctx.db.query("userSubscriptions").withIndex("by_email", (q) => q.eq("email", email)).collect(),
      ctx.db.query("funnelVerzonden").withIndex("by_email", (q) => q.eq("email", email)).collect(),
      ctx.db.get(args.mailId),
    ]);
    if (!lead || lead.status !== "in-backend") return null;
    if (afgemeld) return null;
    if (naProfiel || subs.some((s: any) => (s.pricePaid ?? 0) > 0)) return null;
    if (!mail || !mail.actief) return null;
    if (verzonden.some((v: any) => v.mailId === args.mailId)) return null;
    // Ook niet als er al een mail op dezelfde dagOffset ging (logische stap-dedup).
    const alleMails = await ctx.db.query("funnelMails").collect();
    const mailById = new Map(alleMails.map((m: any) => [m._id, m]));
    if (verzonden.some((v: any) => (mailById.get(v.mailId) as any)?.dagOffset === mail.dagOffset)) return null;
    return { mail };
  },
});

export const _logEvergreenVerzonden = internalMutation({
  args: { email: v.string(), mailId: v.id("funnelMails") },
  handler: async (ctx, args) => {
    await ctx.db.insert("funnelVerzonden", {
      email: args.email.toLowerCase(),
      mailId: args.mailId,
      sentAt: Date.now(),
    });
  },
});

export const _markeerKoperInternal = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const lead = await ctx.db
      .query("funnelLeads")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();
    if (lead && lead.status !== "koper") {
      await ctx.db.patch(lead._id, { status: "koper", updatedAt: Date.now() });
    }
  },
});

// ── De dagelijkse motor ──────────────────────────────────────────────────────

export const processEvergreen = internalAction({
  args: {},
  handler: async (ctx): Promise<void> => {
    if (process.env.EVERGREEN_ACTIEF !== "true") return;
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return;

    const { teVerzenden, teMarkerenKoper } = await ctx.runQuery(internal.evergreen._evergreenPlan, {});

    for (const email of teMarkerenKoper) {
      await ctx.runMutation(internal.evergreen._markeerKoperInternal, { email });
    }

    // Gespreid inplannen (kleine pieken, tegen Outlook/Hotmail-throttling).
    const intervalMs = Math.max(0, Number(process.env.EVERGREEN_SPREID_SECONDEN ?? "90")) * 1000;
    for (let i = 0; i < teVerzenden.length; i++) {
      await ctx.scheduler.runAfter(i * intervalMs, internal.evergreen._verstuurEvergreen, teVerzenden[i]);
    }
  },
});

export const _verstuurEvergreen = internalAction({
  args: {
    email: v.string(),
    naam: v.union(v.string(), v.null()),
    type: v.string(),
    mailId: v.id("funnelMails"),
    isLaatsteVanBlok: v.boolean(),
  },
  handler: async (ctx, args): Promise<void> => {
    if (process.env.EVERGREEN_ACTIEF !== "true") return;
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return;

    const check = await ctx.runQuery(internal.evergreen._evergreenCheck, {
      email: args.email,
      mailId: args.mailId,
    });
    if (!check) return;
    const mail: any = check.mail;

    try {
      const html = await bouwEvergreenHtml(ctx, {
        email: args.email,
        naam: args.naam ?? undefined,
        type: args.type,
        subject: mail.subject,
        bodyText: mail.bodyText,
        buttonText: mail.buttonText,
        buttonUrl: mail.buttonUrl,
        imageUrl: mail.imageUrl,
        imageCaption: mail.imageCaption,
        isLaatsteVanBlok: args.isLaatsteVanBlok,
      });
      await verstuurEvergreenEmail({
        to: args.email,
        subject: persoonlijkOnderwerp(mail.subject, args.naam ?? undefined),
        html,
        apiKey,
        mailId: String(args.mailId),
      });
      await ctx.runMutation(internal.evergreen._logEvergreenVerzonden, {
        email: args.email,
        mailId: args.mailId,
      });
    } catch (e) {
      console.error(`Evergreen-mail mislukt voor ${args.email}:`, e);
    }
  },
});

// ── Uitstroom bij aankoop + rustoptie ────────────────────────────────────────

/** Zet een lead op "koper" (uit de funnel). Aangeroepen door de Stripe-webhook. */
export const markeerKoper = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const lead = await ctx.db
      .query("funnelLeads")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();
    if (lead && lead.status !== "koper") {
      await ctx.db.patch(lead._id, { status: "koper", updatedAt: Date.now() });
    }
    return { ok: true };
  },
});

/** Rustoptie: alleen nog de maandmail. Aangeroepen door /api/rust na tokencheck. */
export const zetAlleenMaandmail = mutation({
  args: { email: v.string(), secret: v.string() },
  handler: async (ctx, args) => {
    if (!process.env.ADMIN_SESSION_SECRET || args.secret !== process.env.ADMIN_SESSION_SECRET) {
      throw new Error("Niet geautoriseerd");
    }
    const lead = await ctx.db
      .query("funnelLeads")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();
    if (lead && lead.status === "in-backend") {
      await ctx.db.patch(lead._id, { status: "alleen-maandmail", updatedAt: Date.now() });
    }
    return { ok: true };
  },
});

// ── Testmail naar jezelf (admin) ─────────────────────────────────────────────

export const _evergreenMailVoorTest = internalQuery({
  args: { mailId: v.id("funnelMails") },
  handler: async (ctx, args) => {
    const mail = await ctx.db.get(args.mailId);
    if (!mail) return null;
    const alleMails = await ctx.db
      .query("funnelMails")
      .withIndex("by_blok", (q) => q.eq("blokId", mail.blokId))
      .collect();
    const maxDag = alleMails
      .filter((m: any) => m.actief)
      .reduce((mx: number, m: any) => Math.max(mx, m.dagOffset), -1);
    return { mail, isLaatsteVanBlok: mail.dagOffset === maxDag };
  },
});

export const stuurTestEvergreen = action({
  args: {
    adminToken: v.string(),
    mailId: v.id("funnelMails"),
    email: v.string(),
    naam: v.optional(v.string()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ ok: boolean }> => {
    await ctx.runQuery(api.adminAuth.validateToken, { adminToken: args.adminToken });
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY ontbreekt");

    const res = await ctx.runQuery(internal.evergreen._evergreenMailVoorTest, { mailId: args.mailId });
    if (!res) throw new Error("Mail niet gevonden");
    const mail: any = res.mail;

    const html = await bouwEvergreenHtml(ctx, {
      email: args.email,
      naam: args.naam,
      type: normType(args.type),
      subject: mail.subject,
      bodyText: mail.bodyText,
      buttonText: mail.buttonText,
      buttonUrl: mail.buttonUrl,
      imageUrl: mail.imageUrl,
      imageCaption: mail.imageCaption,
      isLaatsteVanBlok: res.isLaatsteVanBlok,
    });
    await verstuurEvergreenEmail({
      to: args.email,
      subject: persoonlijkOnderwerp(mail.subject, args.naam),
      html,
      apiKey,
      mailId: String(args.mailId),
    });
    return { ok: true };
  },
});
