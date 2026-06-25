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
import { internalAction, action, internalQuery, internalMutation, mutation } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { v } from "convex/values";
import { DEFAULT_TEMPLATES } from "./emailTemplatesDefaults";

const FROM = "Talk To Benji <noreply@talktobenji.com>";
const DAG_MS = 24 * 60 * 60 * 1000;

// Niet versturen aan leads van vóór deze datum (voorkomt mailen van oude leads).
const EH_OPVOLG_START = Date.UTC(2026, 5, 25); // 25 juni 2026

// Welke mail op welke dag na de brief. Sleutel = mailnummer, waarde = dagoffset.
const SCHEMA: Record<number, number> = { 1: 0, 2: 3, 3: 5, 4: 8, 5: 11 };
const TEMPLATE_KEY = (n: number) => `eh_huisdier_${n}`;
const VERLIES_TYPE = "huisdier";

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
          <p style="font-size: 13px; color: #718096; margin: 3px 0 0 0;">Oprichtster van Talk To Benji</p>
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
  args: { email: string; naam?: string; mailNummer: number; apiKey: string }
) {
  const key = TEMPLATE_KEY(args.mailNummer);
  const saved = await ctx.runQuery(internal.emailTemplates.getTemplateInternal, { key });
  const def = (DEFAULT_TEMPLATES as any)[key];
  const subject: string = saved?.subject ?? def.subject;
  const bodyText: string = saved?.bodyText ?? def.bodyText;
  const buttonText: string | undefined = saved?.buttonText ?? def.buttonText;
  const buttonUrl: string | undefined = saved?.buttonUrl ?? def.buttonUrl;

  const voornaam = (args.naam || "").trim().split(" ")[0];
  const body = bodyText
    .replace("Hoi {voornaam},", voornaam ? `Hoi ${voornaam},` : "Hoi,")
    .replace(/\{voornaam\}/g, voornaam);

  const token = await afmeldToken(args.email);
  const afmeldUrl = `${appBase()}/api/afmelden?e=${encodeURIComponent(args.email)}&t=${token}`;

  const html = wrapper(`
    ${alineaHtml(body)}
    ${buttonText && buttonUrl ? knop(buttonText, buttonUrl) : ""}
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
      .filter((b: any) => b.verliesType === VERLIES_TYPE && b.sentAt >= EH_OPVOLG_START)
      .map((b: any) => ({ email: b.email, naam: b.naam ?? null, sentAt: b.sentAt }));
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

// Effectieve dag-offsets per mail: opgeslagen dagOffset uit de admin, anders de default.
export const _dagSchema = internalQuery({
  args: {},
  handler: async (ctx) => {
    const result: Record<number, number> = { ...SCHEMA };
    for (let n = 1; n <= 5; n++) {
      const t = await ctx.db
        .query("emailTemplates")
        .withIndex("by_key", (q) => q.eq("key", TEMPLATE_KEY(n)))
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
    const schema = await ctx.runQuery(internal.evenHouvastOpvolg._dagSchema, {});
    const nu = Date.now();

    for (const lead of leads) {
      const status = await ctx.runQuery(internal.evenHouvastOpvolg._statusVoorLead, { email: lead.email });
      if (status.afgemeld || status.heeftGekocht) continue;

      const dagenGeleden = Math.floor((nu - lead.sentAt) / DAG_MS);

      // Eerste mail die wél verschuldigd is en nog niet verstuurd. Maximaal één per run.
      let teVersturen: number | null = null;
      for (let n = 1; n <= 5; n++) {
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
  args: { adminToken: v.string(), email: v.string(), naam: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await ctx.runQuery(api.adminAuth.validateToken, { adminToken: args.adminToken });
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY ontbreekt");
    for (let n = 1; n <= 5; n++) {
      await verstuurOpvolgMail(ctx, { email: args.email, naam: args.naam, mailNummer: n, apiKey });
    }
    return { verstuurd: 5 };
  },
});

// Test: stuur één specifieke mail (1..5) naar een inbox.
export const stuurTestOpvolgEnkel = action({
  args: { adminToken: v.string(), email: v.string(), naam: v.optional(v.string()), mailNummer: v.number() },
  handler: async (ctx, args) => {
    await ctx.runQuery(api.adminAuth.validateToken, { adminToken: args.adminToken });
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY ontbreekt");
    await verstuurOpvolgMail(ctx, { email: args.email, naam: args.naam, mailNummer: args.mailNummer, apiKey });
    return { ok: true };
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
