/**
 * Losse tussendoor-mails / maandmail — Convex-kant.
 *
 * Ien stelt zelf een mail op en stuurt die naar een gekozen doelgroep, nu of
 * ingepland op datum/tijd. Gespreid versturen (kleine groepjes met pauze), met
 * dedup per mail en een noodrem. Afgemelde en testadressen vallen altijd af.
 *
 * Doelgroepen komen uit de mensen die we mogen mailen: de evergreen-leads
 * (funnelLeads), de Even Houvast-leads (houvastBrieven) en de nieuwsbrief-opt-ins.
 * De rustgroep (status alleen-maandmail) zit alleen in "lijst-incl-rust".
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
  persoonlijkOnderwerp,
} from "./ehMailFooter";
import { BENJI_BLOK_MARKER } from "./ehConcepten";

const DEFAULT_BATCH = 25;
const DEFAULT_INTERVAL_SEC = 60;

const EH_TYPES = ["persoon", "huisdier", "scheiding", "eenzaamheid", "kinderloos"];
const ALGEMEEN = "algemeen";
function normType(t?: string | null): string {
  return t && EH_TYPES.includes(t) ? t : ALGEMEEN;
}


// ── Doelgroep bepalen ────────────────────────────────────────────────────────

/**
 * Zet een doelgroep-sleutel om in de lijst ontvangers {email, naam, type}.
 * Sleutels: "lijst-incl-rust" (iedereen, ook de rustgroep), "lijst" (iedereen
 * behalve de rustgroep), "type:<verliestype>" (dat type, zonder rustgroep).
 * Afgemelde en testadressen vallen altijd af. Uniek per e-mailadres.
 */
async function resolveDoelgroep(
  ctx: any,
  doelgroep: string
): Promise<{ email: string; naam: string | null; type: string }[]> {
  // Dynamische doelgroepen op openingsgedrag:
  //  - "sluimerend": opende eerder wél, maar al 120+ dagen niet meer.
  //  - "nooit-geopend": kreeg 2+ mails en opende nog nooit iets.
  if (doelgroep === "sluimerend" || doelgroep === "nooit-geopend") {
    const alleenNooit = doelgroep === "nooit-geopend";
    const DREMPEL = 120 * 86_400_000;
    const nu = Date.now();
    const [events, afmeldingen, excluded, brieven, funnelLeads, naProfielen] = await Promise.all([
      ctx.db.query("resendEmailEvents").collect(),
      ctx.db.query("ehAfmeldingen").collect(),
      ctx.db.query("analyticsExcludedEmails").collect(),
      ctx.db.query("houvastBrieven").collect(),
      ctx.db.query("funnelLeads").collect(),
      ctx.db.query("nietAlleenProfiles").collect(),
    ]);
    const afgemeldSet = new Set(afmeldingen.map((a: any) => a.email.toLowerCase()));
    const testSet = new Set(excluded.map((e: any) => e.email.toLowerCase()));
    const naamMap = new Map<string, string>();
    const typeMap = new Map<string, string>();
    for (const b of brieven) if (b.email) { const e = b.email.toLowerCase(); if (b.naam) naamMap.set(e, b.naam); if (b.verliesType) typeMap.set(e, b.verliesType); }
    for (const l of funnelLeads) if (l.email) { const e = l.email.toLowerCase(); if (l.naam && !naamMap.has(e)) naamMap.set(e, l.naam); if (l.verliesType && !typeMap.has(e)) typeMap.set(e, l.verliesType); }
    for (const p of naProfielen) if (p.email && p.naam) { const e = p.email.toLowerCase(); if (!naamMap.has(e)) naamMap.set(e, p.naam); }

    const per = new Map<string, { sent: Set<string>; laatsteOpen: number }>();
    for (const ev of events) {
      if (!ev.to) continue;
      const e = ev.to.toLowerCase();
      const t = (ev.type || "").toLowerCase();
      let r = per.get(e);
      if (!r) { r = { sent: new Set(), laatsteOpen: 0 }; per.set(e, r); }
      if (t.includes("sent") || t.includes("delivered")) r.sent.add(ev.emailId);
      if (t.includes("opened") && ev.createdAt > r.laatsteOpen) r.laatsteOpen = ev.createdAt;
    }
    const out: { email: string; naam: string | null; type: string }[] = [];
    for (const [email, r] of per.entries()) {
      if (afgemeldSet.has(email) || testSet.has(email)) continue;
      if (r.sent.size < 2) continue;
      const nooitGeopend = r.laatsteOpen === 0;
      if (alleenNooit) {
        if (!nooitGeopend) continue;               // alleen wie nog nooit opende
      } else {
        if (nooitGeopend) continue;                // alleen wie eerder wél opende...
        if (r.laatsteOpen >= nu - DREMPEL) continue; // ...maar nu al lang niet meer
      }
      out.push({ email, naam: naamMap.get(email) ?? null, type: normType(typeMap.get(email)) });
    }
    return out;
  }

  // Eigen doelgroep (mailGroepen): "groep:<id>". Adressen komen uit de groep zelf;
  // afgemelde en testadressen vallen ook hier af.
  if (doelgroep.startsWith("groep:")) {
    const groepId = doelgroep.slice(6);
    const [leden, afmeldingen, excluded] = await Promise.all([
      ctx.db.query("mailGroepLeden").withIndex("by_groep", (q: any) => q.eq("groepId", groepId)).collect(),
      ctx.db.query("ehAfmeldingen").collect(),
      ctx.db.query("analyticsExcludedEmails").collect(),
    ]);
    const afgemeldSet = new Set(afmeldingen.map((a: any) => a.email.toLowerCase()));
    const testSet = new Set(excluded.map((e: any) => e.email.toLowerCase()));
    const gezien = new Set<string>();
    const out: { email: string; naam: string | null; type: string }[] = [];
    for (const l of leden) {
      const email = l.email.toLowerCase();
      if (afgemeldSet.has(email) || testSet.has(email) || gezien.has(email)) continue;
      gezien.add(email);
      out.push({ email, naam: l.naam ?? null, type: normType(l.verliesType) });
    }
    return out;
  }

  const [funnelLeads, brieven, optins, afmeldingen, excluded] = await Promise.all([
    ctx.db.query("funnelLeads").collect(),
    ctx.db.query("houvastBrieven").collect(),
    ctx.db.query("nieuwsbriefOptins").collect(),
    ctx.db.query("ehAfmeldingen").collect(),
    ctx.db.query("analyticsExcludedEmails").collect(),
  ]);

  const afgemeldSet = new Set(afmeldingen.map((a: any) => a.email.toLowerCase()));
  const testSet = new Set(excluded.map((e: any) => e.email.toLowerCase()));
  const rustSet = new Set(
    funnelLeads.filter((l: any) => l.status === "alleen-maandmail").map((l: any) => l.email.toLowerCase())
  );

  // Naam + type per e-mailadres: funnelLeads eerst, dan brieven, dan opt-ins.
  const info = new Map<string, { naam: string | null; type: string }>();
  const zet = (email: string, naam?: string | null, type?: string | null) => {
    const e = email.toLowerCase();
    const bestaand = info.get(e);
    info.set(e, {
      naam: bestaand?.naam ?? (naam ?? null),
      type: bestaand?.type && bestaand.type !== ALGEMEEN ? bestaand.type : normType(type),
    });
  };
  for (const l of funnelLeads) zet(l.email, l.naam, l.verliesType);
  for (const b of brieven) zet(b.email, b.naam, b.verliesType);
  for (const o of optins) zet(o.email, o.naam, null);

  const typeFilter = doelgroep.startsWith("type:") ? doelgroep.slice(5) : null;
  const inclRust = doelgroep === "lijst-incl-rust";

  const out: { email: string; naam: string | null; type: string }[] = [];
  for (const [email, meta] of info.entries()) {
    if (afgemeldSet.has(email) || testSet.has(email)) continue;
    if (!inclRust && rustSet.has(email)) continue; // rustgroep alleen bij incl-rust
    if (typeFilter && meta.type !== typeFilter) continue;
    out.push({ email, naam: meta.naam, type: meta.type });
  }
  out.sort((a, b) => a.email.localeCompare(b.email));
  return out;
}

// ── Renderer ─────────────────────────────────────────────────────────────────

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

// Voettekst voor een losse mail: rustoptie + afmeldlink (geen vaste Niet Alleen-brug;
// een link naar een aanbod zet Ien desgewenst zelf in de tekst of via de knop).
function losseFooter(rustUrl: string, afmeldUrl: string): string {
  return `
    <div style="text-align:center;margin-top:44px;">
      <img src="https://www.talktobenji.com/images/benji-logo-2.png" alt="Talk To Benji" width="42" height="42" style="display:inline-block;width:42px;height:42px;margin:0 0 12px 0;" />
      <p style="font-size:13px;color:#718096;margin:7px 0 0 0;">Heb je vragen? Beantwoord gewoon deze mail.</p>
      <p style="font-size:12px;line-height:1.7;color:#a0aec0;margin:26px 0 0 0;border-top:1px solid #ece5dc;padding-top:16px;">
        <a href="${rustUrl}" style="color:#a0aec0;text-decoration:underline;">Liever minder mail? Alleen nog maandelijks</a>
        <br/>
        <a href="${afmeldUrl}" style="color:#a0aec0;text-decoration:underline;">Helemaal geen mail meer ontvangen</a>
      </p>
    </div>`;
}

async function bouwLosseHtml(
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
  let groetIndex = -1;
  alineas.forEach((p: string, i: number) => {
    if (isAfsluiting(p)) groetIndex = i;
  });
  const autoVoorGroet = `${!gebruiktAfbeelding ? coverHtml : ""}${!gebruiktKnop ? knopHtml : ""}`;

  const stukken: string[] = [];
  alineas.forEach((p: string, i: number) => {
    if (p.includes(BENJI_BLOK_MARKER)) stukken.push(blokHtml);
    else if (AFBEELDING_MARKER.test(p)) { if (imageUrl) stukken.push(inlineAfbeelding(imageUrl, imageCaption)); }
    else if (KNOP_MARKER.test(p)) { if (toonKnop) stukken.push(knopHtml); }
    else if (i === groetIndex) {
      stukken.push(autoVoorGroet);
      stukken.push(mailAlinea(p));
      stukken.push(mailHandtekeningIen());
    } else if (/^p\.?\s*s\.?/i.test(p)) stukken.push(psStijl(p));
    else stukken.push(mailAlinea(p));
  });
  if (groetIndex === -1) {
    stukken.push(autoVoorGroet);
    stukken.push(mailHandtekeningIen());
  }

  const token = await ehAfmeldToken(args.email);
  const rustUrl = `${appBase()}/api/rust?e=${encodeURIComponent(args.email)}&t=${token}`;
  const afmeldUrl = await ehAfmeldUrl(args.email, "losse-mail", args.type);

  return mailWrapper(`
    ${stukken.join("\n")}
    ${losseFooter(rustUrl, afmeldUrl)}
  `);
}

async function verstuurLosseEmail(args: { to: string; subject: string; html: string; apiKey: string; mailId: string }) {
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
          { name: "programma", value: "losse-mail" },
          { name: "mail", value: args.mailId },
        ],
      }),
    });
    if (res.ok) return;
    const detail = await res.text();
    const tijdelijk = res.status === 429 || res.status >= 500;
    if (!tijdelijk || poging === 4) throw new Error(`Losse mail mislukt (status ${res.status}): ${detail}`);
    await new Promise((r) => setTimeout(r, poging * 1500));
  }
}

// ── Admin: beheer + doelgroep-telling ────────────────────────────────────────

const DOELGROEP_LABELS: Record<string, string> = {
  "lijst-incl-rust": "Hele lijst (incl. rustgroep)",
  lijst: "Hele lijst (zonder rustgroep)",
  sluimerend: "Sluimerend (opende eerder, nu lang niet)",
  "nooit-geopend": "Nooit-openers (opende nog nooit iets)",
  "type:persoon": "Verlies van een persoon",
  "type:huisdier": "Verlies van een huisdier",
  "type:scheiding": "Relatie voorbij",
  "type:eenzaamheid": "Eenzaamheid",
  "type:kinderloos": "Kinderwens",
};

export const lijst = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const rijen = await ctx.db.query("losseMails").collect();
    rijen.sort((a, b) => b.createdAt - a.createdAt);
    return rijen.map((r) => ({
      _id: r._id,
      subject: r.subject,
      doelgroep: r.doelgroep,
      doelgroepLabel: DOELGROEP_LABELS[r.doelgroep] ?? r.doelgroep,
      status: r.status,
      geplandOp: r.geplandOp ?? null,
      aantalVerzonden: r.aantalVerzonden ?? 0,
      verstuurdOp: r.verstuurdOp ?? null,
    }));
  },
});

export const get = query({
  args: { adminToken: v.string(), id: v.id("losseMails") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    return await ctx.db.get(args.id);
  },
});

/** Aantal ontvangers voor een doelgroep (voor de voorbeschouwing). */
export const doelgroepAantal = query({
  args: { adminToken: v.string(), doelgroep: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const lijst = await resolveDoelgroep(ctx, args.doelgroep);
    return { aantal: lijst.length };
  },
});

export const opslaan = mutation({
  args: {
    adminToken: v.string(),
    id: v.optional(v.id("losseMails")),
    subject: v.string(),
    bodyText: v.string(),
    buttonText: v.optional(v.string()),
    buttonUrl: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    imageCaption: v.optional(v.string()),
    doelgroep: v.string(),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const velden = {
      subject: args.subject,
      bodyText: args.bodyText,
      buttonText: args.buttonText?.trim() || undefined,
      buttonUrl: args.buttonUrl?.trim() || undefined,
      imageUrl: args.imageUrl?.trim() || undefined,
      imageCaption: args.imageCaption?.trim() || undefined,
      doelgroep: args.doelgroep,
      updatedAt: Date.now(),
    };
    if (args.id) {
      const bestaand = await ctx.db.get(args.id);
      if (bestaand && (bestaand.status === "bezig" || bestaand.status === "verzonden")) {
        throw new Error("Deze mail is al verstuurd of wordt verstuurd en kan niet meer gewijzigd worden.");
      }
      await ctx.db.patch(args.id, velden);
      return { ok: true, id: args.id };
    }
    const id = await ctx.db.insert("losseMails", {
      ...velden,
      status: "concept",
      createdAt: Date.now(),
    });
    return { ok: true, id };
  },
});

export const verwijderen = mutation({
  args: { adminToken: v.string(), id: v.id("losseMails") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const rij = await ctx.db.get(args.id);
    if (rij && rij.status === "bezig") throw new Error("Kan niet verwijderen terwijl de mail wordt verstuurd.");
    await ctx.db.delete(args.id);
    return { ok: true };
  },
});

// ── Testmail ─────────────────────────────────────────────────────────────────

export const _losseMailVoorTest = internalQuery({
  args: { id: v.id("losseMails") },
  handler: async (ctx, args) => ctx.db.get(args.id),
});

export const stuurTestLosseMail = action({
  args: {
    adminToken: v.string(),
    id: v.id("losseMails"),
    email: v.string(),
    naam: v.optional(v.string()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ ok: boolean }> => {
    await ctx.runQuery(api.adminAuth.validateToken, { adminToken: args.adminToken });
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY ontbreekt");
    const mail: any = await ctx.runQuery(internal.broadcasts._losseMailVoorTest, { id: args.id });
    if (!mail) throw new Error("Mail niet gevonden");
    const html = await bouwLosseHtml(ctx, {
      email: args.email,
      naam: args.naam,
      type: normType(args.type),
      subject: mail.subject,
      bodyText: mail.bodyText,
      buttonText: mail.buttonText,
      buttonUrl: mail.buttonUrl,
      imageUrl: mail.imageUrl,
      imageCaption: mail.imageCaption,
    });
    await verstuurLosseEmail({ to: args.email, subject: persoonlijkOnderwerp(mail.subject, args.naam), html, apiKey, mailId: String(args.id) });
    return { ok: true };
  },
});

// ── Verzending: nu of ingepland, gespreid, stopbaar ──────────────────────────

/** Start nu, of plan in op een tijdstip. */
export const startVerzending = mutation({
  args: {
    adminToken: v.string(),
    id: v.id("losseMails"),
    bevestig: v.boolean(),
    geplandOp: v.optional(v.number()), // leeg = nu
    batchGrootte: v.optional(v.number()),
    intervalSec: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    if (!args.bevestig) throw new Error("Bevestiging ontbreekt");
    const rij = await ctx.db.get(args.id);
    if (!rij) throw new Error("Mail niet gevonden");
    if (rij.status === "bezig") throw new Error("De verzending loopt al.");

    const batchGrootte = Math.max(1, Math.min(100, args.batchGrootte ?? DEFAULT_BATCH));
    const intervalSec = Math.max(5, args.intervalSec ?? DEFAULT_INTERVAL_SEC);
    const nu = Date.now();
    const gepland = args.geplandOp && args.geplandOp > nu + 30_000 ? args.geplandOp : null;

    await ctx.db.patch(args.id, {
      status: gepland ? "gepland" : "bezig",
      geplandOp: gepland ?? undefined,
      gestopt: false,
      batchGrootte,
      intervalSec,
      gestartOp: gepland ? undefined : nu,
      updatedAt: nu,
    });

    if (gepland) {
      await ctx.scheduler.runAt(gepland, internal.broadcasts._ronde, { id: args.id });
    } else {
      await ctx.scheduler.runAfter(0, internal.broadcasts._ronde, { id: args.id });
    }
    return { ok: true, gepland: !!gepland };
  },
});

/** Noodrem / annuleren: een geplande of lopende verzending stopt. */
export const stopVerzending = mutation({
  args: { adminToken: v.string(), id: v.id("losseMails") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const rij = await ctx.db.get(args.id);
    if (!rij) return { ok: false };
    // Een nog-niet-gestarte geplande mail zetten we terug op concept; een lopende
    // krijgt de noodrem-vlag zodat de volgende ronde stopt.
    if (rij.status === "gepland") {
      await ctx.db.patch(args.id, { status: "concept", geplandOp: undefined, gestopt: true, updatedAt: Date.now() });
    } else if (rij.status === "bezig") {
      await ctx.db.patch(args.id, { gestopt: true, updatedAt: Date.now() });
    }
    return { ok: true };
  },
});

export const _config = internalQuery({
  args: { id: v.id("losseMails") },
  handler: async (ctx, args) => {
    const r = await ctx.db.get(args.id);
    if (!r) return null;
    return {
      subject: r.subject,
      bodyText: r.bodyText,
      buttonText: r.buttonText,
      buttonUrl: r.buttonUrl,
      imageUrl: r.imageUrl,
      imageCaption: r.imageCaption,
      doelgroep: r.doelgroep,
      status: r.status,
      gestopt: !!r.gestopt,
      batchGrootte: r.batchGrootte ?? DEFAULT_BATCH,
      intervalSec: r.intervalSec ?? DEFAULT_INTERVAL_SEC,
    };
  },
});

export const _resterend = internalQuery({
  args: { id: v.id("losseMails"), limit: v.number() },
  handler: async (ctx, args) => {
    const r = await ctx.db.get(args.id);
    if (!r) return { totaalResterend: 0, batch: [] };
    const doel = await resolveDoelgroep(ctx, r.doelgroep);
    const verzonden = await ctx.db
      .query("losseMailVerzonden")
      .withIndex("by_mail", (q) => q.eq("losseMailId", args.id))
      .collect();
    const alGehad = new Set(verzonden.map((v: any) => v.email.toLowerCase()));
    const resterend = doel.filter((d) => !alGehad.has(d.email));
    return { totaalResterend: resterend.length, batch: resterend.slice(0, args.limit) };
  },
});

export const _logVerzonden = internalMutation({
  args: { id: v.id("losseMails"), email: v.string(), aantalErbij: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await ctx.db.insert("losseMailVerzonden", {
      losseMailId: args.id,
      email: args.email.toLowerCase(),
      sentAt: Date.now(),
    });
  },
});

export const _statusZet = internalMutation({
  args: {
    id: v.id("losseMails"),
    status: v.optional(v.string()),
    aantalErbij: v.optional(v.number()),
    verstuurdOp: v.optional(v.number()),
    gestartOp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const r = await ctx.db.get(args.id);
    if (!r) return;
    const patch: any = { updatedAt: Date.now() };
    if (args.status) patch.status = args.status;
    if (args.aantalErbij) patch.aantalVerzonden = (r.aantalVerzonden ?? 0) + args.aantalErbij;
    if (args.verstuurdOp) patch.verstuurdOp = args.verstuurdOp;
    if (args.gestartOp) patch.gestartOp = args.gestartOp;
    await ctx.db.patch(args.id, patch);
  },
});

export const _ronde = internalAction({
  args: { id: v.id("losseMails") },
  handler: async (ctx, args): Promise<void> => {
    const cfg = await ctx.runQuery(internal.broadcasts._config, { id: args.id });
    if (!cfg) return;
    if (cfg.gestopt) {
      await ctx.runMutation(internal.broadcasts._statusZet, { id: args.id, status: "concept" });
      return;
    }
    if (cfg.status !== "bezig" && cfg.status !== "gepland") return;
    if (cfg.status === "gepland") {
      await ctx.runMutation(internal.broadcasts._statusZet, { id: args.id, status: "bezig", gestartOp: Date.now() });
    }
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return;

    const { batch, totaalResterend } = await ctx.runQuery(internal.broadcasts._resterend, {
      id: args.id,
      limit: cfg.batchGrootte,
    });
    if (batch.length === 0) {
      await ctx.runMutation(internal.broadcasts._statusZet, {
        id: args.id,
        status: "verzonden",
        verstuurdOp: Date.now(),
      });
      return;
    }

    let verstuurd = 0;
    for (const lead of batch) {
      try {
        const html = await bouwLosseHtml(ctx, {
          email: lead.email,
          naam: lead.naam ?? undefined,
          type: lead.type,
          subject: cfg.subject,
          bodyText: cfg.bodyText,
          buttonText: cfg.buttonText,
          buttonUrl: cfg.buttonUrl,
          imageUrl: cfg.imageUrl,
          imageCaption: cfg.imageCaption,
        });
        await verstuurLosseEmail({ to: lead.email, subject: persoonlijkOnderwerp(cfg.subject, lead.naam), html, apiKey, mailId: String(args.id) });
        await ctx.runMutation(internal.broadcasts._logVerzonden, { id: args.id, email: lead.email });
        verstuurd++;
      } catch (e) {
        console.error(`Losse mail mislukt voor ${lead.email}:`, e);
      }
    }
    if (verstuurd > 0) {
      await ctx.runMutation(internal.broadcasts._statusZet, { id: args.id, aantalErbij: verstuurd });
    }

    if (totaalResterend - verstuurd > 0) {
      await ctx.scheduler.runAfter(cfg.intervalSec * 1000, internal.broadcasts._ronde, { id: args.id });
    } else {
      await ctx.runMutation(internal.broadcasts._statusZet, {
        id: args.id,
        status: "verzonden",
        verstuurdOp: Date.now(),
      });
    }
  },
});

// ── Reacties + uitschrijven van niet-reageerders (lijsthygiëne) ──────────────

/**
 * Reacties op een verstuurde losse mail: hoeveel ontvangers hem openden of
 * klikten. Basis voor de her-activatie: wie na de wachttijd niets deed, kun je
 * uitschrijven.
 */
export const reacties = query({
  args: { adminToken: v.string(), id: v.id("losseMails") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const rij = await ctx.db.get(args.id);
    const verzonden = await ctx.db
      .query("losseMailVerzonden")
      .withIndex("by_mail", (q) => q.eq("losseMailId", args.id))
      .collect();
    const ontvangers = new Set(verzonden.map((v: any) => v.email.toLowerCase()));

    const mailTag = String(args.id);
    const events = await ctx.db.query("resendEmailEvents").collect();
    const gereageerd = new Set<string>();
    for (const ev of events) {
      if (!ev.to) continue;
      const t = (ev.type || "").toLowerCase();
      if (!(t.includes("opened") || t.includes("clicked"))) continue;
      if (ev.tags?.mail !== mailTag) continue;
      const e = ev.to.toLowerCase();
      if (ontvangers.has(e)) gereageerd.add(e);
    }
    const verstuurdOp = rij?.verstuurdOp ?? null;
    const dagenGeleden = verstuurdOp ? Math.floor((Date.now() - verstuurdOp) / 86_400_000) : null;
    return {
      verstuurd: ontvangers.size,
      gereageerd: gereageerd.size,
      nietGereageerd: ontvangers.size - gereageerd.size,
      verstuurdOp,
      dagenGeleden,
    };
  },
});

/**
 * Schrijf de ontvangers van deze mail uit die niet openden/klikten. Registreert
 * een afmelding (ehAfmeldingen), zodat ze nergens meer gemaild worden. Bedoeld na
 * de wachttijd van een her-activatiemail.
 */
export const schrijfNietReageerdersUit = mutation({
  args: { adminToken: v.string(), id: v.id("losseMails") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const verzonden = await ctx.db
      .query("losseMailVerzonden")
      .withIndex("by_mail", (q) => q.eq("losseMailId", args.id))
      .collect();
    const ontvangers = new Set(verzonden.map((v: any) => v.email.toLowerCase()));

    const mailTag = String(args.id);
    const events = await ctx.db.query("resendEmailEvents").collect();
    const gereageerd = new Set<string>();
    for (const ev of events) {
      if (!ev.to) continue;
      const t = (ev.type || "").toLowerCase();
      if (!(t.includes("opened") || t.includes("clicked"))) continue;
      if (ev.tags?.mail !== mailTag) continue;
      gereageerd.add(ev.to.toLowerCase());
    }

    const bestaand = new Set(
      (await ctx.db.query("ehAfmeldingen").collect()).map((a: any) => a.email.toLowerCase())
    );

    let uitgeschreven = 0;
    for (const email of ontvangers) {
      if (gereageerd.has(email) || bestaand.has(email)) continue;
      await ctx.db.insert("ehAfmeldingen", {
        email,
        createdAt: Date.now(),
        mail: "heractivatie",
      });
      uitgeschreven++;
    }
    return { uitgeschreven };
  },
});
