/**
 * Even Houvast — opvolgmailreeks (5 mails) richting Niet Alleen.
 *
 * Trigger: zodra iemand de Even Houvast-brief kreeg (houvastBrieven), met verliestype.
 * Planning: dag 0/1, 3, 5, 8, 11 na de brief.
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

const FROM = "Ien van Talk To Benji <contactmetien@talktobenji.com>";
const DAG_MS = 24 * 60 * 60 * 1000;

// Niet versturen aan leads van vóór deze datum (voorkomt mailen van oude leads).
const EH_OPVOLG_START = Date.UTC(2026, 5, 25); // 25 juni 2026

// Welke mail op welke dag na de brief. Sleutel = mailnummer, waarde = dagoffset.
// Mail 6 ("Wie ik ben") valt chronologisch op dag 2, tussen mail 1 en 2. De
// verzendvolgorde wordt op dagoffset bepaald, niet op mailnummer.
const SCHEMA: Record<number, number> = { 1: 0, 6: 2, 2: 3, 3: 5, 4: 8, 5: 11 };
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

function alineaHtml(bodyText: string): string {
  return bodyText
    .trim()
    .split(/\n\n+/)
    .map((p) => `<p style="font-size: 15px; line-height: 1.8; color: #4a5568;">${p.trim().replace(/\n/g, "<br/>")}</p>`)
    .join("\n");
}

function knop(tekst: string, url: string): string {
  return `
    <div style="margin: 28px 0;">
      <a href="${url}" style="background-color: #6d84a8; color: white; padding: 13px 26px;
         border-radius: 10px; text-decoration: none; font-size: 15px; font-weight: 600; display: inline-block;">
        ${tekst}
      </a>
    </div>`;
}

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
    return `<div style="text-align:center; margin:8px 0;"><a href="${url}" style="display:inline-block; padding:9px 18px; background-color:#fdf9f4; color:#6d84a8; text-decoration:none; font-size:14px; font-weight:600; border:1px solid #6d84a8; border-radius:10px;">${label}</a></div>`;
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

function handtekeningIen(): string {
  return `
    <table cellpadding="0" cellspacing="0" border="0" style="margin-top: 24px;">
      <tr>
        <td style="padding-right: 14px; vertical-align: middle;">
          <img src="https://talktobenji.com/images/ien-founder.png" alt="Ien" width="52" height="52"
            style="border-radius: 50%; display: block; width: 52px; height: 52px; object-fit: cover;" />
        </td>
        <td style="vertical-align: middle;">
          <p style="font-size: 15px; font-weight: 600; color: #2d3748; margin: 0;">Ien</p>
          <p style="font-size: 13px; color: #718096; margin: 3px 0 0 0;">Founder van Talk To Benji</p>
        </td>
      </tr>
    </table>`;
}

function afmeldVoettekst(afmeldUrl: string): string {
  return `
    <p style="font-size: 12px; line-height: 1.6; color: #a0aec0; margin-top: 28px; border-top: 1px solid #ece5dc; padding-top: 16px;">
      Je ontvangt deze mails omdat je Even Houvast hebt gedaan.
      <a href="${afmeldUrl}" style="color: #a0aec0; text-decoration: underline;">Geen opvolgmails meer ontvangen</a>.
    </p>`;
}

function wrapper(inhoud: string): string {
  return `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                max-width: 560px; margin: 0 auto; color: #2d3748; background: #fdf9f4; padding: 32px 24px;">
      ${inhoud}
    </div>`;
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

function appBase(): string {
  return (process.env.APP_URL || "https://www.talktobenji.com").replace(/\/+$/, "");
}

async function verstuurEmail(args: { to: string; subject: string; html: string; apiKey: string }) {
  const maxPogingen = 4;
  for (let poging = 1; poging <= maxPogingen; poging++) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${args.apiKey}` },
      body: JSON.stringify({ from: FROM, to: [args.to], subject: args.subject, html: args.html }),
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
  const buttonText: string | undefined = saved?.buttonText ?? def?.buttonText;
  const buttonUrl: string | undefined = saved?.buttonUrl ?? def?.buttonUrl;
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

  const html = wrapper(`
    ${alineaHtml(body)}
    ${keuzeBlok}
    ${imageUrl ? coverBlok(imageUrl, buttonUrl, imageCaption) : ""}
    ${buttonText && buttonUrl ? (imageUrl ? zachteKnop(buttonText, buttonUrl) : knop(buttonText, buttonUrl)) : ""}
    ${handtekeningIen()}
    ${afmeldVoettekst(afmeldUrl)}
  `);

  await verstuurEmail({ to: args.email, subject, html, apiKey: args.apiKey });
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
