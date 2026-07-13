/**
 * Even Houvast — opvolgmailreeks (5 mails) richting Niet Alleen.
 *
 * Trigger: zodra iemand de Even Houvast-brief kreeg (houvastBrieven), met verliestype.
 * Planning: dag 2, 4, 5, 7, 10, 13 na de brief (nooit op de dag van de brief zelf).
 * Veiligheden:
 *   - Alleen actief als env EH_OPVOLG_ACTIEF === "true" (zet aan zodra de ads draaien).
 *   - Alleen leads ná EH_OPVOLG_START en met het juiste verliestype.
 *   - Dedup via ehOpvolgVerzonden (nooit dubbel).
 *   - Stopt zodra iemand Niet Alleen koopt (nietAlleenProfiles).
 *   - Respecteert afmeldingen (ehAfmeldingen) met afmeldlink onder elke mail.
 *   - Stuurt hoogstens één mail per lead per run (geen blast bij achterstand).
 */
import { internalAction, action, internalQuery, internalMutation, mutation, query } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { v } from "convex/values";
import { DEFAULT_TEMPLATES } from "./emailTemplatesDefaults";
import { checkAdmin } from "./adminAuth";
import {
  ehFooter,
  nietAlleenUrlVoorType,
  appBase,
  mailAlinea,
  mailKnop,
  mailHandtekeningIen,
  mailWrapper,
} from "./ehMailFooter";

const FROM = "Ien van Talk To Benji <contactmetien@talktobenji.com>";
const DAG_MS = 24 * 60 * 60 * 1000;

// Niet versturen aan leads van vóór deze datum (voorkomt mailen van oude leads).
const EH_OPVOLG_START = Date.UTC(2026, 5, 25); // 25 juni 2026

// Welke mail op welke dag na de brief. Sleutel = mailnummer, waarde = dagoffset.
// De eerste opvolgmail start bewust op dag 2, zodat de brief en de eerste mail
// nooit op dezelfde dag binnenkomen (dat gaf afmeldingen). Mail 6 ("Wie ik ben")
// valt chronologisch op dag 4, tussen mail 1 en 2. De verzendvolgorde wordt op
// dagoffset bepaald, niet op mailnummer.
const SCHEMA: Record<number, number> = { 1: 2, 6: 4, 2: 5, 3: 7, 4: 10, 5: 13 };
const MAIL_NUMMERS = Object.keys(SCHEMA).map(Number);

// Verliestypes met een eigen reeks. Leads zonder (geldig) type krijgen "algemeen".
const EH_TYPES = ["persoon", "huisdier", "scheiding", "eenzaamheid", "kinderloos"] as const;
const ALGEMEEN = "algemeen";
function normType(t?: string | null): string {
  return t && (EH_TYPES as readonly string[]).includes(t) ? t : ALGEMEEN;
}
const TEMPLATE_KEY = (type: string, n: number) => `eh_${type}_${n}`;

// Labels voor de "waar gaat jouw verdriet over?"-keuze in de algemene reeks.
const VERLIES_KEUZES: { type: string; label: string }[] = [
  { type: "persoon", label: "Ik mis iemand die overleden is" },
  { type: "huisdier", label: "Ik verloor mijn huisdier" },
  { type: "scheiding", label: "Mijn relatie is voorbij" },
  { type: "eenzaamheid", label: "Ik voel me eenzaam" },
  { type: "kinderloos", label: "Mijn kinderwens kwam niet uit" },
];

// ── HTML-helpers (zelfde stijl als de Niet Alleen-mails) ──────────────────────

const alineaPHtml = mailAlinea;

// Afsluitgroeten die net boven Ien's naam horen te staan (onder de knop), niet
// midden in de mail. Herkend als de hele laatste alinea, los van leestekens.
const AFSLUITINGEN = [
  "lieve groet", "lieve groetjes", "veel liefs", "liefs", "met liefs",
  "warme groet", "een warme groet", "met warme groet", "groetjes",
  "warme groetjes", "veel sterkte", "sterkte",
];
function isAfsluiting(par: string): boolean {
  const g = par.toLowerCase().replace(/[.,!\s]+$/g, "").trim();
  return AFSLUITINGEN.includes(g);
}

// Marker die Ien ergens in de tekst kan zetten om de geüploade afbeelding daar
// inline te tonen: een losse regel met [afbeelding].
const AFBEELDING_MARKER = /^\[afbeelding\]$/i;

// Inline afbeelding ergens in de tekst (breder dan de boekje-cover, niet geklikt).
function inlineAfbeelding(imageUrl: string, caption?: string): string {
  const img = `<img src="${imageUrl}" alt="" style="width:100%;max-width:480px;height:auto;border-radius:12px;display:block;margin:0 auto;" />`;
  const cap = caption
    ? `<p style="font-size:13px;color:#6b6460;text-align:center;margin:10px 0 0 0;">${caption}</p>`
    : "";
  return `<div style="margin:24px 0;">${img}${cap}</div>`;
}

const knop = mailKnop;

// Ingetogen knop, gecentreerd: zelfde achtergrond als de mail, blauwe tekst, dun
// blauw randje. Gebruikt onder een afbeelding (bijv. de boekje-cover).
function zachteKnop(tekst: string, url: string): string {
  return `
    <div style="margin: 16px 0 4px; text-align: center;">
      <a href="${url}" style="background-color: #fdf9f4; color: #6d84a8; padding: 11px 24px;
         border-radius: 10px; text-decoration: none; font-size: 14px; font-weight: 600;
         display: inline-block; border: 1px solid #6d84a8;">
        ${tekst}
      </a>
    </div>`;
}

// Keuzeblok voor de algemene reeks: per verlies een knop die het type vastlegt
// en doorstuurt naar de juiste landingspagina (via /api/houvast/verlies).
function verliesKeuzeBlok(email: string, token: string): string {
  const links = VERLIES_KEUZES.map(({ type, label }) => {
    const url = `${appBase()}/api/houvast/verlies?e=${encodeURIComponent(email)}&t=${token}&type=${type}`;
    return `<div style="text-align:center; margin:8px 0;"><a href="${url}" style="display:inline-block; box-sizing:border-box; width:300px; max-width:100%; padding:11px 16px; background-color:#fdf9f4; color:#6d84a8; text-decoration:none; font-size:14px; font-weight:600; border:1px solid #6d84a8; border-radius:10px; text-align:center;">${label}</a></div>`;
  }).join("");
  return `
    <div style="margin:22px 0 8px;">
      <p style="font-size:14px; line-height:1.7; color:#6b6460; margin:0 0 10px;">Waar gaat jouw verdriet vooral over? Kies wat past, dan sluit alles beter aan:</p>
      ${links}
    </div>`;
}

// Klikbare afbeelding (bijv. boekje-cover) met optioneel zacht bijschrift.
// Een flipbook/iframe kan niet in e-mail; dit toont de cover die naar het boekje linkt.
function coverBlok(imageUrl: string, linkUrl?: string, caption?: string): string {
  const img = `<img src="${imageUrl}" alt="" style="max-width:240px;width:100%;height:auto;border-radius:10px;display:block;margin:0 auto;box-shadow:0 4px 18px rgba(0,0,0,0.12);" />`;
  const inner = linkUrl ? `<a href="${linkUrl}" style="text-decoration:none;display:inline-block;">${img}</a>` : img;
  const cap = caption
    ? `<p style="font-size:13px;color:#6b6460;margin:12px 0 0 0;">${
        linkUrl ? `<a href="${linkUrl}" style="color:#6d84a8;text-decoration:none;">${caption} →</a>` : caption
      }</p>`
    : "";
  return `<div style="margin:26px 0;text-align:center;">${inner}${cap}</div>`;
}

const handtekeningIen = mailHandtekeningIen;

const wrapper = mailWrapper;

// Hangt de herkomst aan een link in een opvolgmail: bron=eh-mail plus welke mail
// en welk verliestype. De site onthoudt die bron, zodat we in de analytics warm
// (uit deze mails) en koud (advertentie) verkeer uit elkaar kunnen houden.
// Naam en e-mail gaan mee zodat de checkout ze alvast invult; die kennen we van
// deze lead al. mailto: en externe links laten we met rust.
function metBron(
  url: string,
  type: string,
  mailNummer: number,
  email?: string,
  naam?: string
): string {
  if (!url || !url.startsWith(appBase())) return url;
  const params = new URLSearchParams({
    bron: "eh-mail",
    ehmail: String(mailNummer),
    ehtype: type,
  });
  if (email) params.set("e", email);
  if (naam && naam.trim()) params.set("n", naam.trim());
  return `${url}${url.includes("?") ? "&" : "?"}${params.toString()}`;
}

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


async function verstuurEmail(args: {
  to: string;
  subject: string;
  html: string;
  apiKey: string;
  // Labels komen terug in de Resend-webhook; de e-mail-statistieken splitsen
  // daarop uit per mailnummer en verliestype.
  tags?: { name: string; value: string }[];
}) {
  const maxPogingen = 4;
  for (let poging = 1; poging <= maxPogingen; poging++) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${args.apiKey}` },
      body: JSON.stringify({
        from: FROM,
        to: [args.to],
        subject: args.subject,
        html: args.html,
        ...(args.tags && args.tags.length > 0 ? { tags: args.tags } : {}),
      }),
    });
    if (response.ok) return;
    const error = await response.text();
    const tijdelijk = response.status === 429 || response.status >= 500;
    if (!tijdelijk || poging === maxPogingen) {
      throw new Error(`E-mail verzenden mislukt (status ${response.status}): ${error}`);
    }
    await new Promise((r) => setTimeout(r, poging * 1500));
  }
}

// Bouw + verstuur één opvolgmail. Gebruikt opgeslagen template of de default.
async function verstuurOpvolgMail(
  ctx: any,
  args: { email: string; naam?: string; type: string; mailNummer: number; apiKey: string }
) {
  const type = normType(args.type);
  const key = TEMPLATE_KEY(type, args.mailNummer);
  const saved = await ctx.runQuery(internal.emailTemplates.getTemplateInternal, { key });
  const def = (DEFAULT_TEMPLATES as any)[key];
  if (!def && !saved) throw new Error(`Geen template voor ${key}`);
  const subject: string = saved?.subject ?? def?.subject ?? "";
  const bodyText: string = saved?.bodyText ?? def?.bodyText ?? "";
  // Knop alleen tonen als ér echt een tekst én link is (na trimmen). Leeg of
  // alleen spaties = geen knop, ook geen lege gekleurde pil.
  const knopTekst: string = (saved?.buttonText ?? def?.buttonText ?? "").trim();
  const knopUrl: string = metBron(
    (saved?.buttonUrl ?? def?.buttonUrl ?? "").trim(),
    type,
    args.mailNummer,
    args.email,
    args.naam
  );
  const toonKnop = !!knopTekst && !!knopUrl;
  const imageUrl: string | undefined = saved?.imageUrl ?? def?.imageUrl;
  const imageCaption: string | undefined = saved?.imageCaption ?? def?.imageCaption;

  const voornaam = (args.naam || "").trim().split(" ")[0];
  // Vul {voornaam} in; zonder naam blijft "Hi ," / "Hoi ," over → opschonen.
  const body = bodyText
    .replace(/\{voornaam\}/g, voornaam)
    .replace(/(Hi|Hoi)\s+,/g, "$1,");

  const token = await afmeldToken(args.email);
  const afmeldUrl = `${appBase()}/api/afmelden?e=${encodeURIComponent(args.email)}&t=${token}`;

  // Algemene reeks: vraag alleen in de eerste mail uit welk verlies het is, zodat
  // we de lead naar de juiste landingspagina en reeks kunnen sturen.
  const keuzeBlok = type === ALGEMEEN && args.mailNummer === 1
    ? verliesKeuzeBlok(args.email, token)
    : "";

  // Splits de tekst: afsluitgroet (laatste alinea) hoort onder de knop, vlak
  // boven Ien's naam. De rest is de romp, met optioneel een inline-afbeelding
  // op de plek van de [afbeelding]-marker.
  const alineas = body.trim().split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  const afsluiting = alineas.length > 1 && isAfsluiting(alineas[alineas.length - 1])
    ? alineas.pop()!
    : "";
  const heeftInline = alineas.some((p) => AFBEELDING_MARKER.test(p));
  const rompHtml = alineas
    .map((p) =>
      AFBEELDING_MARKER.test(p)
        ? imageUrl ? inlineAfbeelding(imageUrl, imageCaption) : ""
        : alineaPHtml(p)
    )
    .join("\n");

  // De cover-afbeelding (boven de knop) alleen tonen als de afbeelding niet al
  // inline in de tekst staat, anders zou hij dubbel verschijnen.
  const toonCover = !!imageUrl && !heeftInline;

  const html = wrapper(`
    ${rompHtml}
    ${keuzeBlok}
    ${toonCover ? coverBlok(imageUrl!, knopUrl || undefined, imageCaption) : ""}
    ${toonKnop ? (toonCover ? zachteKnop(knopTekst, knopUrl) : knop(knopTekst, knopUrl)) : ""}
    ${afsluiting ? alineaPHtml(afsluiting) : ""}
    ${handtekeningIen()}
    ${ehFooter(nietAlleenUrlVoorType(type), afmeldUrl)}
  `);

  await verstuurEmail({
    to: args.email,
    subject,
    html,
    apiKey: args.apiKey,
    tags: [
      { name: "programma", value: "eh" },
      { name: "mail", value: String(args.mailNummer) },
      { name: "verliestype", value: type },
    ],
  });
}

// ── Interne data-helpers ──────────────────────────────────────────────────────

export const _leadsVoorOpvolg = internalQuery({
  args: {},
  handler: async (ctx) => {
    const alle = await ctx.db.query("houvastBrieven").collect();
    return alle
      .filter((b: any) => b.sentAt >= EH_OPVOLG_START)
      .map((b: any) => ({ email: b.email, naam: b.naam ?? null, sentAt: b.sentAt, verliesType: b.verliesType ?? null }));
  },
});

export const _statusVoorLead = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const lc = args.email.toLowerCase();
    const [verzonden, afgemeld, profiel] = await Promise.all([
      ctx.db.query("ehOpvolgVerzonden").withIndex("by_email", (q) => q.eq("email", lc)).collect(),
      ctx.db.query("ehAfmeldingen").withIndex("by_email", (q) => q.eq("email", lc)).first(),
      ctx.db.query("nietAlleenProfiles").withIndex("by_email", (q) => q.eq("email", lc)).first(),
    ]);
    return {
      gestuurd: verzonden.map((v: any) => v.mailNummer as number),
      afgemeld: !!afgemeld,
      heeftGekocht: !!profiel,
    };
  },
});

// Effectieve dag-offsets per mail voor één type: opgeslagen dagOffset uit de admin,
// anders de default.
export const _dagSchema = internalQuery({
  args: { type: v.string() },
  handler: async (ctx, args) => {
    const type = normType(args.type);
    const result: Record<number, number> = { ...SCHEMA };
    for (const n of MAIL_NUMMERS) {
      const t = await ctx.db
        .query("emailTemplates")
        .withIndex("by_key", (q) => q.eq("key", TEMPLATE_KEY(type, n)))
        .unique();
      if (t && typeof (t as any).dagOffset === "number") result[n] = (t as any).dagOffset;
    }
    return result;
  },
});

export const _logVerzonden = internalMutation({
  args: { email: v.string(), mailNummer: v.number() },
  handler: async (ctx, args) => {
    const lc = args.email.toLowerCase();
    const bestaand = await ctx.db
      .query("ehOpvolgVerzonden")
      .withIndex("by_email", (q) => q.eq("email", lc))
      .collect();
    if (bestaand.some((e: any) => e.mailNummer === args.mailNummer)) return;
    await ctx.db.insert("ehOpvolgVerzonden", { email: lc, mailNummer: args.mailNummer, sentAt: Date.now() });
  },
});

// ── Dagelijkse cron ────────────────────────────────────────────────────────────

export const processEvenHouvastOpvolg = internalAction({
  args: {},
  handler: async (ctx) => {
    if (process.env.EH_OPVOLG_ACTIEF !== "true") return;
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return;

    const leads = await ctx.runQuery(internal.evenHouvastOpvolg._leadsVoorOpvolg, {});
    const nu = Date.now();
    const schemaCache: Record<string, Record<number, number>> = {};

    for (const lead of leads) {
      const status = await ctx.runQuery(internal.evenHouvastOpvolg._statusVoorLead, { email: lead.email });
      if (status.afgemeld || status.heeftGekocht) continue;

      const type = normType(lead.verliesType);
      if (!schemaCache[type]) {
        schemaCache[type] = await ctx.runQuery(internal.evenHouvastOpvolg._dagSchema, { type });
      }
      const schema = schemaCache[type];

      const dagenGeleden = Math.floor((nu - lead.sentAt) / DAG_MS);

      // Eerste mail (op dagvolgorde) die wél verschuldigd is en nog niet verstuurd.
      // Maximaal één per run.
      const volgorde = MAIL_NUMMERS.slice().sort((a, b) => schema[a] - schema[b]);
      let teVersturen: number | null = null;
      for (const n of volgorde) {
        if (dagenGeleden >= schema[n] && !status.gestuurd.includes(n)) {
          teVersturen = n;
          break;
        }
      }
      if (teVersturen === null) continue;

      try {
        await verstuurOpvolgMail(ctx, {
          email: lead.email,
          naam: lead.naam ?? undefined,
          type,
          mailNummer: teVersturen,
          apiKey,
        });
        await ctx.runMutation(internal.evenHouvastOpvolg._logVerzonden, {
          email: lead.email,
          mailNummer: teVersturen,
        });
      } catch (e) {
        // Niet fataal: volgende run probeert opnieuw (nog niet gelogd).
        console.error(`EH opvolgmail ${teVersturen} mislukt voor ${lead.email}:`, e);
      }
    }
  },
});

// ── Testfunctie (admin): stuur alle 5 mails naar één inbox ──────────────────────

export const stuurTestOpvolg = action({
  args: { adminToken: v.string(), email: v.string(), naam: v.optional(v.string()), type: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await ctx.runQuery(api.adminAuth.validateToken, { adminToken: args.adminToken });
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY ontbreekt");
    const type = normType(args.type);
    const volgorde = MAIL_NUMMERS.slice().sort((a, b) => SCHEMA[a] - SCHEMA[b]);
    for (const n of volgorde) {
      await verstuurOpvolgMail(ctx, { email: args.email, naam: args.naam, type, mailNummer: n, apiKey });
    }
    return { verstuurd: volgorde.length };
  },
});

// Test: stuur één specifieke mail (1..6) van een gekozen verliestype naar een inbox.
export const stuurTestOpvolgEnkel = action({
  args: { adminToken: v.string(), email: v.string(), naam: v.optional(v.string()), mailNummer: v.number(), type: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await ctx.runQuery(api.adminAuth.validateToken, { adminToken: args.adminToken });
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY ontbreekt");
    await verstuurOpvolgMail(ctx, { email: args.email, naam: args.naam, type: normType(args.type), mailNummer: args.mailNummer, apiKey });
    return { ok: true };
  },
});

// ── Funnel-overzicht voor de admin ──────────────────────────────────────────────
// Toont per lead (alle verliestypes) waar die in de opvolgreeks zit (laatste
// verstuurde mail), het type, of die is afgemeld, en of Niet Alleen is gekocht.
export const funnelOverzicht = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const leads = (await ctx.db.query("houvastBrieven").collect()).filter(
      (b: any) => b.sentAt >= EH_OPVOLG_START
    );
    const nu = Date.now();
    const rijen = [];
    for (const lead of leads) {
      const lc = lead.email.toLowerCase();
      const [verzonden, afgemeld, profiel] = await Promise.all([
        ctx.db.query("ehOpvolgVerzonden").withIndex("by_email", (q) => q.eq("email", lc)).collect(),
        ctx.db.query("ehAfmeldingen").withIndex("by_email", (q) => q.eq("email", lc)).first(),
        ctx.db.query("nietAlleenProfiles").withIndex("by_email", (q) => q.eq("email", lc)).first(),
      ]);
      // Laatste mail op dagvolgorde (niet op nummer: mail 6 valt op dag 2).
      const laatsteMail = verzonden.length
        ? verzonden
            .map((v: any) => v.mailNummer as number)
            .reduce((best: number, n: number) => ((SCHEMA[n] ?? 0) > (SCHEMA[best] ?? 0) ? n : best))
        : 0;
      rijen.push({
        email: lead.email,
        naam: lead.naam ?? null,
        type: normType(lead.verliesType),
        dagenGeleden: Math.floor((nu - lead.sentAt) / DAG_MS),
        laatsteMail,
        afgemeld: !!afgemeld,
        gekocht: !!profiel,
      });
    }
    rijen.sort((a, b) => a.dagenGeleden - b.dagenGeleden);
    return rijen;
  },
});

// ── Advertentie-overzicht voor de admin ─────────────────────────────────────────
// Trekt de opgeslagen tracking-URL (bronUrl) per lead uit elkaar en groepeert op
// campagne + advertentie. Zo zie je per ad hoeveel aanvragen, klanten en omzet die
// opleverde, zonder per lead te hoeven zoeken. Werkt op bestaande data: er hoeft
// niets in Meta veranderd te worden, mits de ads-URL UTM-parameters bevat.
function parseAdVanUrl(
  bronUrl?: string | null,
  bronRegel?: string | null
): { campagne: string; ad: string; kanaal: string; getagd: boolean } {
  if (bronUrl) {
    try {
      const p = new URL(bronUrl).searchParams;
      const campagne = (p.get("utm_campaign") ?? "").trim();
      const ad = (p.get("utm_content") ?? p.get("utm_term") ?? "").trim();
      const kanaal = (p.get("utm_source") ?? "").trim();
      if (campagne || ad) {
        return {
          campagne: campagne || "(zonder campagnenaam)",
          ad: ad || "(hele campagne)",
          kanaal,
          getagd: true,
        };
      }
    } catch {
      // ongeldige URL — val terug op de bron-regel
    }
  }
  // Geen UTM-tags gevonden: groepeer op de compacte bron-regel (bijv. "Meta (FB/IG) · /lp/..").
  return { campagne: bronRegel || "Onbekend", ad: "", kanaal: "", getagd: false };
}

export const advertentieOverzicht = query({
  args: { adminToken: v.string(), from: v.number(), to: v.number() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);

    const [leads, excluded, naProfiles, subs] = await Promise.all([
      ctx.db.query("houvastBrieven").collect(),
      ctx.db.query("analyticsExcludedEmails").collect(),
      ctx.db.query("nietAlleenProfiles").collect(),
      ctx.db.query("userSubscriptions").collect(),
    ]);

    const uitgesloten = new Set(excluded.map((e: any) => e.email.toLowerCase()));
    const naEmails = new Set(naProfiles.map((p: any) => p.email.toLowerCase()));
    const omzetPerEmail: Record<string, number> = {};
    for (const s of subs) {
      if (!s.email || !s.pricePaid) continue;
      const e = s.email.toLowerCase();
      omzetPerEmail[e] = (omzetPerEmail[e] ?? 0) + s.pricePaid;
    }

    type Groep = {
      campagne: string;
      ad: string;
      kanaal: string;
      getagd: boolean;
      aanvragen: number;
      klanten: number;
      omzet: number;
    };
    const groepen: Record<string, Groep> = {};

    const inRange = leads.filter(
      (l: any) =>
        l.sentAt >= args.from &&
        l.sentAt <= args.to &&
        !uitgesloten.has(l.email.toLowerCase())
    );

    for (const lead of inRange) {
      const { campagne, ad, kanaal, getagd } = parseAdVanUrl(lead.bronUrl, lead.bron);
      const key = `${campagne}||${ad}`;
      if (!groepen[key]) {
        groepen[key] = { campagne, ad, kanaal, getagd, aanvragen: 0, klanten: 0, omzet: 0 };
      }
      const g = groepen[key];
      g.aanvragen++;
      const e = lead.email.toLowerCase();
      const omzet = omzetPerEmail[e] ?? 0;
      if (naEmails.has(e) || omzet > 0) g.klanten++;
      g.omzet += omzet;
    }

    const rijen = Object.values(groepen).map((g) => ({
      ...g,
      conversie: g.aanvragen > 0 ? Math.round((g.klanten / g.aanvragen) * 100) : 0,
    }));
    rijen.sort((a, b) => b.aanvragen - a.aanvragen);
    return rijen;
  },
});

// ── Afmelding registreren (aangeroepen door /api/afmelden na token-check) ────────

export const registreerAfmelding = mutation({
  args: { email: v.string(), secret: v.string() },
  handler: async (ctx, args) => {
    if (!process.env.ADMIN_SESSION_SECRET || args.secret !== process.env.ADMIN_SESSION_SECRET) {
      throw new Error("Niet geautoriseerd");
    }
    const lc = args.email.toLowerCase();
    const bestaand = await ctx.db.query("ehAfmeldingen").withIndex("by_email", (q) => q.eq("email", lc)).first();
    if (!bestaand) await ctx.db.insert("ehAfmeldingen", { email: lc, createdAt: Date.now() });
    return { ok: true };
  },
});

// ── Verliestype vastleggen (vanuit de algemene reeks, na token-check) ────────────
// De lead kiest in de mail waar het verdriet over gaat; dat leggen we vast op de
// houvastBrief(ven) van dit e-mailadres, zodat de juiste type-reeks doorloopt.
export const setVerliesType = mutation({
  args: { email: v.string(), type: v.string(), secret: v.string() },
  handler: async (ctx, args) => {
    if (!process.env.ADMIN_SESSION_SECRET || args.secret !== process.env.ADMIN_SESSION_SECRET) {
      throw new Error("Niet geautoriseerd");
    }
    if (!(EH_TYPES as readonly string[]).includes(args.type)) throw new Error("Onbekend verliestype");
    const lc = args.email.trim().toLowerCase();
    const brieven = await ctx.db
      .query("houvastBrieven")
      .withIndex("by_email", (q) => q.eq("email", lc))
      .collect();
    for (const b of brieven) {
      await ctx.db.patch(b._id, { verliesType: args.type });
    }
    return { ok: true, aangepast: brieven.length };
  },
});
