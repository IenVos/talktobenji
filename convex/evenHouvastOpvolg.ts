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
  mailLinks,
  mailKnop,
  mailHandtekeningIen,
  mailWrapper,
  persoonlijkOnderwerp,
  persoonlijkeBody,
} from "./ehMailFooter";
import { BENJI_MARKER, BENJI_BLOK_MARKER } from "./ehConcepten";
import { STATS_RESET_MS } from "./emailStats";

const FROM = "Ien van Talk To Benji <contactmetien@talktobenji.com>";
const DAG_MS = 24 * 60 * 60 * 1000;

// Niet versturen aan leads van vóór deze datum (voorkomt mailen van oude leads).
const EH_OPVOLG_START = Date.UTC(2026, 5, 25); // 25 juni 2026

// Welke mail op welke dag na de brief. Sleutel = mailnummer, waarde = dagoffset.
// Dit is het CENTRALE verzendschema voor de hele funnel, gelijk voor alle types
// (afgeleid van de geoptimaliseerde huisdier-cadans). Dit is de code-fallback; als
// er een rij in `ehVerzendSchema` staat, wint die (één centrale plek, admin-bewerkbaar).
// Mail 6 ("Benji voorstellen") valt chronologisch als 2e (dag 3). De verzendvolgorde
// wordt op dagoffset bepaald, niet op mailnummer. Nooit meer per verliestype instelbaar.
const SCHEMA: Record<number, number> = { 1: 2, 6: 3, 2: 5, 3: 8, 4: 10, 5: 12 };
const MAIL_NUMMERS = Object.keys(SCHEMA).map(Number);

// Ondergrens: nooit een opvolgmail binnen twee dagen na de brief. De cron kijkt
// naar hele dagen sinds de brief, dus dag 0 betekent "vanavond nog", en dat
// leverde meteen afmeldingen op. Deze grens geldt boven elke admin-instelling.
const MIN_DAG_OFFSET = 2;

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

  const body = persoonlijkeBody(bodyText, args.naam);

  const token = await afmeldToken(args.email);
  // Mailnummer en verliestype mee in de afmeldlink: zo zien we in de admin bij
  // wélke mail iemand afhaakt, en kun je die mail bijsturen.
  const afmeldUrl =
    `${appBase()}/api/afmelden?e=${encodeURIComponent(args.email)}&t=${token}` +
    `&m=${args.mailNummer}&type=${type}`;

  // Algemene reeks: vraag alleen in de eerste mail uit welk verlies het is, zodat
  // we de lead naar de juiste landingspagina en reeks kunnen sturen.
  const keuzeBlok = type === ALGEMEEN && args.mailNummer === 1
    ? verliesKeuzeBlok(args.email, token)
    : "";

  // Splits de tekst: afsluitgroet (laatste alinea) hoort onder de knop, vlak
  // boven Ien's naam. De rest is de romp, met optioneel een inline-afbeelding
  // op de plek van de [afbeelding]-marker.
  // Benji één-klik: bevat deze mail een Benji-CTA (bijv. "[Maak kennis met Benji >>]")
  // of het [benji-blok], maak dan per lead een persoonlijk 7-daags token en bouw de
  // /benji-start-link. Mails zonder Benji-marker raken hier niet door: geen token,
  // geen knop, geen blok, alles blijft precies als voorheen.
  const heeftBenjiMarker = /\[[^\]]*benji[^\]]*\]/i.test(body);
  let benjiKnopVoor: (p: string) => string = () => "";
  let benjiBlokHtml = "";
  if (heeftBenjiMarker) {
    const benjiToken = await ctx.runMutation(internal.benjiStart.genereerTokenInternal, {
      email: args.email,
      naam: args.naam,
    });
    // Log deze verzending (welke opvolgmail) zodat we per klik de tik kunnen terugrekenen.
    await ctx.runMutation(internal.benjiStart.logVerzending, {
      email: args.email,
      mail: String(args.mailNummer),
    });
    const benjiUrl = `${appBase()}/benji-start?token=${benjiToken}`;

    // Voorwaardelijk blok: heeft dit adres de link al eens gebruikt (deur open)?
    // Zo nee → "maak kennis". Zo ja → de "kom terug"-tekst (Benji leert je pas kennen
    // als je vaker praat). We kijken alleen naar "geklikt ja/nee", nooit naar inhoud.
    const gestart = await ctx.runQuery(internal.benjiStart.heeftBenjiGebruikt, {
      email: args.email,
    });

    // Knoptekst: de tekst die je in de admin tussen de haakjes zet wint (bijv.
    // "[Probeer Benji gratis >>]" wordt de knop "Probeer Benji gratis"). De
    // sluit-pijltjes halen we eraf. Alleen bij de kale marker [benji-start-link] of
    // lege haakjes gebruiken we de slimme standaard, mét de automatische "Praat met
    // Benji" voor wie Benji al opende.
    benjiKnopVoor = (p: string): string => {
      const binnen = (p.match(/\[([^\]]*)\]/)?.[1] ?? "").replace(/[>»→\s]+$/g, "").trim();
      const eigen = binnen && binnen.toLowerCase() !== "benji-start-link" ? binnen : "";
      const label = eigen || (gestart ? "Praat met Benji" : "Maak kennis met Benji");
      return `<div style="text-align:left;margin:26px 0;"><a href="${benjiUrl}" style="display:inline-block;background:#fdf9f4;color:#9a8168;border:1.5px solid #9a8168;padding:12px 26px;border-radius:12px;font-weight:600;font-size:15px;text-decoration:none;">${label} &rarr;</a></div>`;
    };

    if (gestart) {
      // Kom-terug-blok voor wie Benji al opende. Persoonlijke toon, geen promo. De
      // tekst zegt bewust nergens wat ze binnen deden ("misschien wel, misschien niet").
      const alinea = (t: string, mb = 16) =>
        `<p style="font-size:15px;line-height:1.75;color:#4a5568;margin:0 0 ${mb}px;">${t}</p>`;
      benjiBlokHtml = `<div style="margin:26px 0 6px;background:#ffffff;border:1px solid #e7ded1;border-radius:16px;padding:28px 26px;">${
        alinea("Je hebt Benji nu een paar dagen.") +
        alinea("Misschien heb je er al iets aan gehad. Misschien is het erbij ingeschoten. Allebei is prima.") +
        alinea("E&eacute;n ding wil ik je meegeven. Benji wordt pas iets waard als hij je leert kennen. Wie je bent, wie je mist, hoe het nu met je gaat.") +
        alinea("In het begin merk je dat nog niet. Na een paar gesprekken wel.") +
        alinea("Wat je hem vertelt lees ik niet. Dat kan ik niet en dat wil ik ook niet.", 24)
      }<div style="text-align:center;"><a href="${benjiUrl}" style="display:inline-block;background:#fdf9f4;color:#9a8168;border:1.5px solid #9a8168;padding:11px 24px;border-radius:12px;font-weight:600;font-size:15px;text-decoration:none;">Praat met Benji &rarr;</a></div></div>`;
    } else {
      benjiBlokHtml = `<div style="margin:26px 0 6px;background:#ffffff;border:1px solid #e7ded1;border-radius:16px;padding:24px 22px;text-align:center;"><p style="font-size:16px;font-weight:700;color:#3d3530;margin:0 0 8px;">7 dagen gratis met Benji</p><p style="font-size:14px;line-height:1.6;color:#6b6460;margin:0 0 18px;">Een plek om je verhaal kwijt te kunnen, wanneer jij wilt. Ook midden in de nacht.</p><a href="${benjiUrl}" style="display:inline-block;background:#fdf9f4;color:#9a8168;border:1.5px solid #9a8168;padding:11px 24px;border-radius:12px;font-weight:600;font-size:15px;text-decoration:none;">Maak kennis met Benji &rarr;</a><p style="font-size:12px;line-height:1.5;color:#9a938c;margin:14px 0 0;">Geen formulier, geen wachtwoord.</p></div>`;
    }
  }
  const isBenjiCta = (p: string) =>
    p.includes(BENJI_MARKER) || /\[[^\]]*benji[^\]]*\]/i.test(p);

  // Opdracht-kadertje: alles tussen [opdracht] en [/opdracht] wordt een zacht blok,
  // zodat een klein doe-momentje in de mail opvalt. Zonder de marker: geen effect.
  let opdrachtCard = "";
  let bodyVoorSplit = body;
  const opdrachtMatch = body.match(/\[opdracht\]([\s\S]*?)\[\/opdracht\]/i);
  if (opdrachtMatch) {
    const innerHtml = opdrachtMatch[1]
      .trim()
      .split(/\n\n+/)
      .map((p) => `<p style="font-size:15px;line-height:1.7;color:#4a5568;margin:0 0 12px;">${p.trim().replace(/\n/g, "<br/>")}</p>`)
      .join("");
    opdrachtCard = `<div style="background:#fdf9f4;border:1px solid #e7ded1;border-radius:14px;padding:18px 22px 6px;margin:22px 0;">${innerHtml}</div>`;
    bodyVoorSplit = body.replace(opdrachtMatch[0], "\n\n[[OPDRACHT]]\n\n");
  }

  const alineas0 = bodyVoorSplit.trim().split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  // Het Benji-blok komt onderaan (na de P.S.); haal die alinea uit de stroom.
  const heeftBlok = alineas0.some((p) => p.includes(BENJI_BLOK_MARKER));
  const alineas = alineas0.filter((p) => !p.includes(BENJI_BLOK_MARKER));
  // Een P.S.-alinea komt ná de handtekening (zoals een echte P.S. onder een brief).
  const psIndex = alineas.findIndex((p) => /^p\.?\s*s\.?/i.test(p));
  const ps = psIndex >= 0 ? alineas.splice(psIndex, 1)[0] : "";
  const afsluiting = alineas.length > 1 && isAfsluiting(alineas[alineas.length - 1])
    ? alineas.pop()!
    : "";
  const heeftInline = alineas.some((p) => AFBEELDING_MARKER.test(p));
  const rompHtml = alineas
    .map((p) =>
      p === "[[OPDRACHT]]"
        ? opdrachtCard
        : isBenjiCta(p)
        ? benjiKnopVoor(p)
        : AFBEELDING_MARKER.test(p)
        ? imageUrl ? inlineAfbeelding(imageUrl, imageCaption) : ""
        : alineaPHtml(p)
    )
    .join("\n");
  const psHtml = ps
    ? `<p style="font-size:14px;line-height:1.75;color:#718096;margin-top:20px;">${mailLinks(ps).replace(/\n/g, "<br/>")}</p>`
    : "";

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
    ${psHtml}
    ${heeftBlok ? benjiBlokHtml : ""}
    ${ehFooter(nietAlleenUrlVoorType(type), afmeldUrl)}
  `);

  await verstuurEmail({
    to: args.email,
    subject: persoonlijkOnderwerp(subject, args.naam),
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
    const [verzonden, afgemeld, profiel, funnelLead] = await Promise.all([
      ctx.db.query("ehOpvolgVerzonden").withIndex("by_email", (q) => q.eq("email", lc)).collect(),
      ctx.db.query("ehAfmeldingen").withIndex("by_email", (q) => q.eq("email", lc)).first(),
      ctx.db.query("nietAlleenProfiles").withIndex("by_email", (q) => q.eq("email", lc)).first(),
      ctx.db.query("funnelLeads").withIndex("by_email", (q) => q.eq("email", lc)).first(),
    ]);
    return {
      gestuurd: verzonden.map((v: any) => v.mailNummer as number),
      afgemeld: !!afgemeld,
      heeftGekocht: !!profiel,
      // Op het Benji-spoor? Dan geen EH-mails meer (die persoon praat met Benji).
      opBenjiSpoor: (funnelLead?.spoor ?? "") === "benji",
    };
  },
});

// Het effectieve verzendschema: één centrale rij (ehVerzendSchema) voor de HELE
// funnel, gelijk voor alle verliestypes. Geen per-mail/per-type dagOffset meer, zodat
// het opslaan van een mail de timing nooit kan verzetten. Zonder centrale rij: de
// code-fallback (SCHEMA, huisdier-cadans). De ondergrens MIN_DAG_OFFSET schuift de
// hele reeks op als de vroegste mail te vroeg staat.
async function leesVerzendSchema(ctx: any): Promise<Record<number, number>> {
  const doc = await ctx.db.query("ehVerzendSchema").first();
  const result: Record<number, number> = doc
    ? { 1: doc.mail1, 2: doc.mail2, 3: doc.mail3, 4: doc.mail4, 5: doc.mail5, 6: doc.mail6 }
    : { ...SCHEMA };
  const vroegste = Math.min(...MAIL_NUMMERS.map((n) => result[n]));
  const verschuiving = Math.max(0, MIN_DAG_OFFSET - vroegste);
  if (verschuiving > 0) for (const n of MAIL_NUMMERS) result[n] += verschuiving;
  return result;
}

export const _dagSchema = internalQuery({
  args: { type: v.string() },
  handler: async (ctx) => leesVerzendSchema(ctx),
});

// Admin: het centrale verzendschema lezen (voor het beheerscherm). Toont de opgeslagen
// waarden, of de code-fallback (huisdier-cadans) als er nog niets is ingesteld.
export const getVerzendSchema = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const doc = await ctx.db.query("ehVerzendSchema").first();
    return {
      mail1: doc?.mail1 ?? SCHEMA[1],
      mail2: doc?.mail2 ?? SCHEMA[2],
      mail3: doc?.mail3 ?? SCHEMA[3],
      mail4: doc?.mail4 ?? SCHEMA[4],
      mail5: doc?.mail5 ?? SCHEMA[5],
      mail6: doc?.mail6 ?? SCHEMA[6],
      ondergrens: MIN_DAG_OFFSET,
    };
  },
});

// Admin: het centrale verzendschema opslaan. Geldt meteen voor alle verliestypes.
export const setVerzendSchema = mutation({
  args: {
    adminToken: v.string(),
    mail1: v.number(), mail2: v.number(), mail3: v.number(),
    mail4: v.number(), mail5: v.number(), mail6: v.number(),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const clamp = (n: number) => Math.max(0, Math.round(n || 0));
    const velden = {
      mail1: clamp(args.mail1), mail2: clamp(args.mail2), mail3: clamp(args.mail3),
      mail4: clamp(args.mail4), mail5: clamp(args.mail5), mail6: clamp(args.mail6),
      updatedAt: Date.now(),
    };
    const doc = await ctx.db.query("ehVerzendSchema").first();
    if (doc) await ctx.db.patch(doc._id, velden);
    else await ctx.db.insert("ehVerzendSchema", velden);
    return { ok: true };
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

// Intern mailnummer van de "Benji voorstellen"-mail (EH_META n=6). Voor wie Benji al
// gebruikte vervangen we deze door de kom-terug-mail (zie processEvenHouvastOpvolg).
const BENJI_VOORSTEL_MAILNR = 6;

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

    // Verzamel eerst alle te versturen mails van deze run.
    const teVerzenden: { email: string; naam?: string; type: string; mailNummer: number }[] = [];
    // Brief-klikkers krijgen op de "Benji voorstellen"-plek (mail 6) de kom-terug-mail
    // in plaats daarvan (ze kennen Benji al). Alleen als de schakelaar aan staat.
    const teVerzendenKomTerug: { email: string; naam?: string; type: string }[] = [];
    const komTerugAan = process.env.EH_BRIEF_KOMTERUG_ACTIEF === "true";
    for (const lead of leads) {
      const status = await ctx.runQuery(internal.evenHouvastOpvolg._statusVoorLead, { email: lead.email });
      if (status.afgemeld || status.heeftGekocht || status.opBenjiSpoor) continue;

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

      // "Benji voorstellen" (mail 6) → voor wie Benji al gebruikte de kom-terug-mail
      // sturen i.p.v. de intro. Zo geen dubbele "maak kennis" en geen extra mail.
      if (
        teVersturen === BENJI_VOORSTEL_MAILNR &&
        komTerugAan &&
        (await ctx.runQuery(internal.benjiStart.heeftBenjiGebruikt, { email: lead.email }))
      ) {
        teVerzendenKomTerug.push({ email: lead.email, naam: lead.naam ?? undefined, type });
      } else {
        teVerzenden.push({ email: lead.email, naam: lead.naam ?? undefined, type, mailNummer: teVersturen });
      }
    }

    // Gespreid versturen: elke mail als losse geplande taak, standaard 90s uit elkaar
    // (instelbaar via env EH_SPREID_SECONDEN). Zo raken we Microsoft (Hotmail/Outlook)
    // niet in één burst, wat 'server busy'-throttling en bounces gaf. Opvolgmails en
    // kom-terug-vervangingen delen dezelfde cadans.
    const intervalMs = Math.max(0, Number(process.env.EH_SPREID_SECONDEN ?? "90")) * 1000;
    let planIdx = 0;
    for (const m of teVerzenden) {
      await ctx.scheduler.runAfter(planIdx * intervalMs, internal.evenHouvastOpvolg._verstuurEnLog, m);
      planIdx++;
    }
    for (const k of teVerzendenKomTerug) {
      await ctx.scheduler.runAfter(planIdx * intervalMs, internal.evenHouvastOpvolg._verstuurBriefKomTerugEnLog, k);
      planIdx++;
    }
  },
});

// Verstuur één opvolgmail (vanuit de gespreide planning). Her-controleert of de lead
// intussen niet is afgemeld/heeft gekocht/de mail al kreeg, zodat vertraging veilig is.
export const _verstuurEnLog = internalAction({
  args: {
    email: v.string(),
    naam: v.optional(v.string()),
    type: v.string(),
    mailNummer: v.number(),
  },
  handler: async (ctx, args) => {
    if (process.env.EH_OPVOLG_ACTIEF !== "true") return;
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return;

    const status = await ctx.runQuery(internal.evenHouvastOpvolg._statusVoorLead, { email: args.email });
    if (status.afgemeld || status.heeftGekocht || status.opBenjiSpoor || status.gestuurd.includes(args.mailNummer)) return;

    try {
      await verstuurOpvolgMail(ctx, {
        email: args.email,
        naam: args.naam,
        type: args.type,
        mailNummer: args.mailNummer,
        apiKey,
      });
      await ctx.runMutation(internal.evenHouvastOpvolg._logVerzonden, {
        email: args.email,
        mailNummer: args.mailNummer,
      });
    } catch (e) {
      // Niet fataal: volgende dag-run probeert opnieuw (nog niet gelogd).
      console.error(`EH opvolgmail ${args.mailNummer} mislukt voor ${args.email}:`, e);
    }
  },
});

// Vervanging op de "Benji voorstellen"-plek (mail 6) voor brief-klikkers: verstuur de
// kom-terug-mail en log mail 6 als verstuurd, zodat de funnel gewoon doorloopt. Her-
// controleert net als _verstuurEnLog, zodat de gespreide planning veilig is.
export const _verstuurBriefKomTerugEnLog = internalAction({
  args: { email: v.string(), naam: v.optional(v.string()), type: v.string() },
  handler: async (ctx, args) => {
    if (process.env.EH_OPVOLG_ACTIEF !== "true") return;
    if (process.env.EH_BRIEF_KOMTERUG_ACTIEF !== "true") return;
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return;

    const status = await ctx.runQuery(internal.evenHouvastOpvolg._statusVoorLead, { email: args.email });
    if (status.afgemeld || status.heeftGekocht || status.opBenjiSpoor || status.gestuurd.includes(BENJI_VOORSTEL_MAILNR)) return;

    // Veel gepraat (>= drempel) → vervolg-mail (Benji onthoudt); anders de kom-terug-mail.
    const aantalBerichten = await ctx.runQuery(internal.evenHouvastOpvolg._aantalEigenBerichten, { email: args.email });
    const templateKey = aantalBerichten >= VERVOLG_DREMPEL ? BRIEF_VERVOLG_KEY : BRIEF_KOMTERUG_KEY;

    try {
      await verstuurBriefKomTerug(ctx, { email: args.email, naam: args.naam, type: args.type, apiKey, templateKey });
      await ctx.runMutation(internal.evenHouvastOpvolg._logVerzonden, {
        email: args.email,
        mailNummer: BENJI_VOORSTEL_MAILNR,
      });
      await ctx.runMutation(internal.evenHouvastOpvolg._logBriefKomTerug, { email: args.email });
    } catch (e) {
      console.error(`EH brief-kom-terug (i.p.v. mail ${BENJI_VOORSTEL_MAILNR}) mislukt voor ${args.email}:`, e);
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
  args: {
    email: v.string(),
    secret: v.string(),
    // Uit welke mail werd de afmeldlink geklikt: "brief" of het mailnummer van de
    // opvolgreeks ("1" t/m "6"). Plus het verliestype van die reeks.
    mail: v.optional(v.string()),
    verliestype: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!process.env.ADMIN_SESSION_SECRET || args.secret !== process.env.ADMIN_SESSION_SECRET) {
      throw new Error("Niet geautoriseerd");
    }
    const lc = args.email.toLowerCase();
    const bestaand = await ctx.db.query("ehAfmeldingen").withIndex("by_email", (q) => q.eq("email", lc)).first();
    if (!bestaand) {
      await ctx.db.insert("ehAfmeldingen", {
        email: lc,
        createdAt: Date.now(),
        mail: args.mail,
        verliestype: args.verliestype,
      });
    } else if (!bestaand.mail && args.mail) {
      // Oude afmelding zonder herkomst: alsnog aanvullen.
      await ctx.db.patch(bestaand._id, { mail: args.mail, verliestype: args.verliestype });
    }
    return { ok: true };
  },
});

/**
 * Waar haken mensen af? Per mail: hoeveel verstuurd, hoeveel afmeldingen, en het
 * percentage daarvan. Plus de laatste afmeldingen met datum en mail, zodat je in
 * één oogopslag ziet welke mail bijsturing nodig heeft.
 */
export const afmeldOverzicht = query({
  args: { adminToken: v.string(), sinceDays: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const dagen = args.sinceDays && args.sinceDays > 0 ? args.sinceDays : 90;
    // De reset-datum is een harde ondergrens (net als bij emailStats): afmeld-ratio's
    // tellen alleen afmeldingen én verzendingen ná de schone start mee. Zo staat een
    // vers gestarte reeks op 0%, in plaats van historische afmeldingen te tonen.
    const cutoff = Math.max(Date.now() - dagen * DAG_MS, STATS_RESET_MS);

    const [alleAfmeldingen, alleVerzonden, alleBrieven] = await Promise.all([
      ctx.db.query("ehAfmeldingen").collect(),
      ctx.db.query("ehOpvolgVerzonden").collect(),
      ctx.db.query("houvastBrieven").collect(),
    ]);

    const afmeldingen = alleAfmeldingen.filter((a) => a.createdAt >= cutoff);

    // Verstuurd per mail in dezelfde periode (de brief telt als eigen "mail").
    const verzondenPerMail = new Map<string, number>();
    for (const v of alleVerzonden) {
      if (v.sentAt < cutoff) continue;
      const sleutel = String(v.mailNummer);
      verzondenPerMail.set(sleutel, (verzondenPerMail.get(sleutel) ?? 0) + 1);
    }
    const brievenInPeriode = alleBrieven.filter((b) => b._creationTime >= cutoff).length;
    verzondenPerMail.set("brief", brievenInPeriode);

    const afmeldingenPerMail = new Map<string, number>();
    for (const a of afmeldingen) {
      const sleutel = a.mail ?? "onbekend";
      afmeldingenPerMail.set(sleutel, (afmeldingenPerMail.get(sleutel) ?? 0) + 1);
    }

    // Verliestype van de lead zelf. Zo weten we het type óók bij afmeldingen van
    // vóór 14 juli 2026, toen de afmeldlink dat nog niet meestuurde.
    const typePerEmail = new Map<string, string>();
    for (const b of alleBrieven) {
      if (b.verliesType) typePerEmail.set(b.email.toLowerCase(), b.verliesType);
    }

    const perType = new Map<string, number>();
    for (const a of afmeldingen) {
      const type = a.verliestype ?? typePerEmail.get(a.email) ?? "onbekend";
      perType.set(type, (perType.get(type) ?? 0) + 1);
    }

    // Vaste volgorde: eerst de brief, dan de mails in de volgorde waarin ze aankomen.
    // Label op leesvolgorde (1e, 2e opvolgmail...), niet op het interne mailnummer:
    // mail 6 ("Wie ik ben") is later toegevoegd maar valt chronologisch als 2e mail.
    const volgorde = ["brief", ...MAIL_NUMMERS.sort((a, b) => SCHEMA[a] - SCHEMA[b]).map(String)];
    const perMail = volgorde.map((sleutel, idx) => {
      const verzonden = verzondenPerMail.get(sleutel) ?? 0;
      const afgemeld = afmeldingenPerMail.get(sleutel) ?? 0;
      return {
        mail: sleutel,
        // idx 0 = brief, idx 1 = 1e opvolgmail, enz. → nummer volgt de verzendvolgorde.
        label: sleutel === "brief" ? "De brief" : `Opvolgmail ${idx}`,
        dag: sleutel === "brief" ? 0 : SCHEMA[Number(sleutel)],
        verzonden,
        afgemeld,
        ratio: verzonden > 0 ? Math.round((afgemeld / verzonden) * 1000) / 10 : 0,
      };
    });

    // Splitsing EH vs overige stromen: de brief + opvolgmail 1-6 zijn de EH-funnel;
    // losse mail, evergreen en reactivatie zijn andere stromen. Zo houden we "waar
    // haken EH-leads af" zuiver, maar blijft geen afmelding onzichtbaar (het totaal
    // klopt: EH + overige + onbekend).
    const EH_SLEUTELS = new Set(["brief", "1", "2", "3", "4", "5", "6"]);
    const OVERIG_LABEL: Record<string, string> = {
      "losse-mail": "Losse mail",
      heractivatie: "Losse mail (heractivatie)",
      evergreen: "Evergreen",
      reactivatie: "Reactivatie",
    };
    let ehTotaal = 0;
    const overigMap = new Map<string, number>();
    for (const a of afmeldingen) {
      const s = a.mail;
      if (!s) continue; // null/leeg = onbekend, apart geteld
      if (EH_SLEUTELS.has(s)) ehTotaal++;
      else overigMap.set(s, (overigMap.get(s) ?? 0) + 1);
    }
    const overigeStromen = Array.from(overigMap.entries())
      .map(([sleutel, aantal]) => ({ sleutel, label: OVERIG_LABEL[sleutel] ?? sleutel, aantal }))
      .sort((a, b) => b.aantal - a.aantal);
    const overigTotaal = overigeStromen.reduce((s, r) => s + r.aantal, 0);

    return {
      dagen,
      totaalAfgemeld: afmeldingen.length,
      ehTotaal,
      overigeStromen,
      overigTotaal,
      // Afmeldingen van vóór 14 juli 2026 weten we niet bij welke mail ze hoorden.
      onbekend: afmeldingenPerMail.get("onbekend") ?? 0,
      perMail,
      perType: Array.from(perType.entries())
        .map(([type, aantal]) => ({ type, aantal }))
        .sort((a, b) => b.aantal - a.aantal),
      recent: afmeldingen
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 50)
        .map((a) => ({
          email: a.email,
          createdAt: a.createdAt,
          mail: a.mail,
          // Uit de afmeldlink, of anders het type van de lead zelf.
          verliestype: a.verliestype ?? typePerEmail.get(a.email),
        })),
    };
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

// ── Brief-klikker "kom terug"-mail ───────────────────────────────────────────────
// Vervangt op de "Benji voorstellen"-plek (mail 6, ~dag 3) de intro-mail voor wie de
// brief-link al gebruikte: zij kennen Benji al. Zo geen extra mail en geen dubbele
// "maak kennis". Zacht bedoeld: normaliseert dat een eerste gesprek even wennen is en
// nodigt uit om het nog een kans te geven. Aan/uit via env EH_BRIEF_KOMTERUG_ACTIEF
// (staat UIT tot de gespreks-privacy live is, want de tekst belooft "alleen jij en
// Benji kunnen het lezen"). Zie het geheugen: privacy-plan.
const BRIEF_KOMTERUG_KEY = "eh_brief_kom_terug";
// Vervolg-mail voor wie al véél gepraat heeft (>= drempel berichten): geen herkansing
// maar doorgaan waar je was, want Benji onthoudt (samenvattingen vorige gesprekken).
const BRIEF_VERVOLG_KEY = "eh_brief_vervolg";
// Vanaf hoeveel eigen berichten iemand de vervolg-mail krijgt i.p.v. de kom-terug-mail.
const VERVOLG_DREMPEL = 10;

async function verstuurBriefKomTerug(
  ctx: any,
  args: { email: string; naam?: string | null; type?: string | null; apiKey: string; templateKey?: string }
) {
  const type = normType(args.type);
  const key = args.templateKey ?? BRIEF_KOMTERUG_KEY;
  const mailLabel = key === BRIEF_VERVOLG_KEY ? "brief-vervolg" : "brief-komterug";
  const saved = await ctx.runQuery(internal.emailTemplates.getTemplateInternal, { key });
  const def = (DEFAULT_TEMPLATES as any)[key];
  const subject: string = saved?.subject ?? def?.subject ?? "";
  const bodyText: string = saved?.bodyText ?? def?.bodyText ?? "";
  const knopTekst: string = (saved?.buttonText ?? def?.buttonText ?? "Verder praten met Benji").trim();

  // Persoonlijke één-klik Benji-link. Voor een terugkerende gebruiker leidt die naar
  // hun eigen plek/gesprek (routeNaStart). Zelfde mechanisme als de opvolgmails.
  const benjiToken = await ctx.runMutation(internal.benjiStart.genereerTokenInternal, {
    email: args.email,
    naam: args.naam ?? undefined,
  });
  await ctx.runMutation(internal.benjiStart.logVerzending, { email: args.email, mail: mailLabel });
  const benjiUrl = `${appBase()}/benji-start?token=${benjiToken}`;

  const body = persoonlijkeBody(bodyText, args.naam);
  const alineas = body.trim().split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  // Afsluitgroet (bijv. "Liefs") hoort ONDER de knop, vlak boven Ien's naam/foto.
  const afsluiting =
    alineas.length > 1 && isAfsluiting(alineas[alineas.length - 1]) ? alineas.pop()! : "";
  const rompHtml = alineas.map(mailAlinea).join("\n");

  // Knop links uitgelijnd (zoals de rest van de mail).
  const benjiKnop = knopTekst
    ? `<div style="text-align:left;margin:26px 0;"><a href="${benjiUrl}" style="display:inline-block;background:#fdf9f4;color:#9a8168;border:1.5px solid #9a8168;padding:12px 26px;border-radius:12px;font-weight:600;font-size:15px;text-decoration:none;">${knopTekst} &rarr;</a></div>`
    : "";

  const token = await afmeldToken(args.email);
  const afmeldUrl = `${appBase()}/api/afmelden?e=${encodeURIComponent(args.email)}&t=${token}&m=${mailLabel}&type=${type}`;

  const html = mailWrapper(`
    ${rompHtml}
    ${benjiKnop}
    ${afsluiting ? mailAlinea(afsluiting) : ""}
    ${mailHandtekeningIen()}
    ${ehFooter(nietAlleenUrlVoorType(type), afmeldUrl)}
  `);

  await verstuurEmail({
    to: args.email,
    subject: persoonlijkOnderwerp(subject, args.naam),
    html,
    apiKey: args.apiKey,
    tags: [
      { name: "programma", value: "eh" },
      { name: "mail", value: mailLabel },
      { name: "verliestype", value: type },
    ],
  });
}

export const _logBriefKomTerug = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.insert("ehBriefKomTerugVerzonden", {
      email: args.email.toLowerCase().trim(),
      verstuurdOp: Date.now(),
    });
  },
});

// Aantal EIGEN berichten (role "user") van een adres over al z'n gesprekken. Bepaalt
// of iemand de kom-terug-mail krijgt (weinig gepraat) of de vervolg-mail (veel gepraat).
// Telt alleen, leest nooit inhoud.
export const _aantalEigenBerichten = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .unique();
    if (!user) return 0;
    const sessies = await ctx.db
      .query("chatSessions")
      .withIndex("by_user", (q) => q.eq("userId", user._id.toString()))
      .collect();
    let n = 0;
    for (const s of sessies) {
      const msgs = await ctx.db
        .query("chatMessages")
        .withIndex("by_session", (q) => q.eq("sessionId", s._id))
        .collect();
      n += msgs.filter((m) => m.role === "user").length;
    }
    return n;
  },
});

// Admin: stuur de kom-terug-mail als test naar een inbox (geen tracking, geen gating).
export const stuurTestBriefKomTerug = action({
  args: {
    adminToken: v.string(),
    email: v.string(),
    naam: v.optional(v.string()),
    type: v.optional(v.string()),
    templateKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.runQuery(api.adminAuth.validateToken, { adminToken: args.adminToken });
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY ontbreekt");
    await verstuurBriefKomTerug(ctx, {
      email: args.email,
      naam: args.naam,
      type: args.type,
      apiKey,
      templateKey: args.templateKey,
    });
    return { ok: true };
  },
});
