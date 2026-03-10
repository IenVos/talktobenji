/**
 * Niet Alleen — e-mailfuncties
 * Dagelijkse mails: inhoud uit NIET_ALLEEN_CONTENT met Benji-ondertekening.
 * Welkomst- en afsluitmail: bewerkbaar via admin panel, met Ien-ondertekening.
 */
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { DEFAULT_TEMPLATES } from "./emailTemplates";
import { getDagInhoud, getMailTekst, vervangVerliesNaam } from "./nietAlleenContent";

const FROM = "Talk To Benji <noreply@talktobenji.com>";

async function verstuurEmail(args: {
  to: string;
  subject: string;
  html: string;
  apiKey: string;
}) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${args.apiKey}`,
    },
    body: JSON.stringify({ from: FROM, to: [args.to], subject: args.subject, html: args.html }),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`E-mail verzenden mislukt: ${error}`);
  }
}

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

/** Rendert mailtekst met {link} placeholder → vervangen door knop-HTML */
function renderMailTekst(tekst: string, knopHtml: string): string {
  const [voor, na = ""] = tekst.split("{link}");
  return `${alineaHtml(voor)}${knopHtml}${na.trim() ? alineaHtml(na.trim()) : ""}`;
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
          <p style="font-size: 13px; color: #718096; margin: 3px 0 0 0;">Founder van TalkToBenji</p>
        </td>
      </tr>
    </table>`;
}

/** Wrapper voor e-mails met Ien-handtekening (welkom, dag28, dag30) */
function wrapperIen(inhoud: string): string {
  return `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                max-width: 560px; margin: 0 auto; color: #2d3748; background: #fdf9f4; padding: 32px 24px;">
      ${inhoud}
      ${handtekeningIen()}
    </div>`;
}

/** Wrapper voor dagelijkse Benji-mails — geen aparte handtekening */
function wrapperBenji(inhoud: string): string {
  return `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                max-width: 560px; margin: 0 auto; color: #2d3748; background: #fdf9f4; padding: 32px 24px;">
      ${inhoud}
    </div>`;
}

// ─────────────────────────────────────────
// Welkomstmail (Ien-ondertekening)
// ─────────────────────────────────────────

export const sendWelkomstMail = internalAction({
  args: { email: v.string(), naam: v.string() },
  handler: async (ctx, args) => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) return;

    const template = await ctx.runQuery(internal.emailTemplates.getTemplateInternal, { key: "niet_alleen_welkom" });
    const subject = template?.subject ?? DEFAULT_TEMPLATES.niet_alleen_welkom.subject;
    const bodyText = template?.bodyText ?? DEFAULT_TEMPLATES.niet_alleen_welkom.bodyText;
    const voornaam = args.naam.split(" ")[0];

    const html = wrapperIen(`
      <p style="font-size: 16px; margin-bottom: 8px;">Hi ${voornaam},</p>
      ${alineaHtml(bodyText)}
      ${knop("Begin dag 1", "https://talktobenji.com/niet-alleen/welkom")}
      <p style="font-size: 14px; color: #718096;">
        Heb je vragen? Stuur een mail naar
        <a href="mailto:contactmetien@talktobenji.com" style="color: #6d84a8;">contactmetien@talktobenji.com</a>.
      </p>
    `);

    await verstuurEmail({ to: args.email, subject, html, apiKey: RESEND_API_KEY });
  },
});

// ─────────────────────────────────────────
// Dagelijkse herinneringsmail (Benji-ondertekening)
// ─────────────────────────────────────────

export const sendDagMail = internalAction({
  args: {
    email: v.string(),
    naam: v.string(),
    dagNummer: v.number(),
    verliesType: v.string(),
    verliesNaam: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) return;

    const inhoud = getDagInhoud(args.dagNummer, args.verliesType);
    const subject = inhoud?.subject ?? `Dag ${args.dagNummer}`;

    let mailTekst = getMailTekst(args.dagNummer, args.verliesType);
    mailTekst = vervangVerliesNaam(mailTekst, args.verliesNaam, args.verliesType);

    const voornaam = args.naam.split(" ")[0];
    const knopHtml = knop("Schrijf vandaag", "https://talktobenji.com/niet-alleen");

    const html = wrapperBenji(`
      <p style="font-size: 16px; margin-bottom: 8px;">Hi ${voornaam},</p>
      <p style="font-size: 13px; color: #a0aec0; margin-bottom: 4px;">Dag ${args.dagNummer} van 30</p>
      ${renderMailTekst(mailTekst, knopHtml)}
    `);

    await verstuurEmail({ to: args.email, subject, html, apiKey: RESEND_API_KEY });
  },
});

// ─────────────────────────────────────────
// Dag 28 — voorbereidingsmail (Ien-ondertekening)
// ─────────────────────────────────────────

export const sendVoorbereidingsMail = internalAction({
  args: { email: v.string(), naam: v.string() },
  handler: async (ctx, args) => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) return;

    const template = await ctx.runQuery(internal.emailTemplates.getTemplateInternal, { key: "niet_alleen_dag28" });
    const subject = template?.subject ?? DEFAULT_TEMPLATES.niet_alleen_dag28.subject;
    const bodyText = template?.bodyText ?? DEFAULT_TEMPLATES.niet_alleen_dag28.bodyText;
    const voornaam = args.naam.split(" ")[0];

    const html = wrapperIen(`
      <p style="font-size: 16px; margin-bottom: 8px;">Hi ${voornaam},</p>
      ${alineaHtml(bodyText)}
      ${knop("Bekijk wat er meer is", "https://talktobenji.com/niet-alleen/ontdek")}
    `);

    await verstuurEmail({ to: args.email, subject, html, apiKey: RESEND_API_KEY });
  },
});

// ─────────────────────────────────────────
// Dag 30 — afsluitmail (Ien-ondertekening)
// ─────────────────────────────────────────

export const sendAfsluitMail = internalAction({
  args: { email: v.string(), naam: v.string(), aantalDagenIngevuld: v.number() },
  handler: async (ctx, args) => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) return;

    const template = await ctx.runQuery(internal.emailTemplates.getTemplateInternal, { key: "niet_alleen_dag30" });
    const subject = template?.subject ?? DEFAULT_TEMPLATES.niet_alleen_dag30.subject;
    const bodyText = template?.bodyText ?? DEFAULT_TEMPLATES.niet_alleen_dag30.bodyText;
    const voornaam = args.naam.split(" ")[0];

    const bodyTextMet = bodyText.replace("{dagen}", String(args.aantalDagenIngevuld));

    const html = wrapperIen(`
      <p style="font-size: 16px; margin-bottom: 8px;">Hi ${voornaam},</p>
      ${alineaHtml(bodyTextMet)}
      ${knop("Alles bewaren", "https://talktobenji.com/niet-alleen/ontdek")}
      <p style="font-size: 14px; color: #718096;">
        Vragen? Stuur een mail naar
        <a href="mailto:contactmetien@talktobenji.com" style="color: #6d84a8;">contactmetien@talktobenji.com</a>.
      </p>
    `);

    await verstuurEmail({ to: args.email, subject, html, apiKey: RESEND_API_KEY });
  },
});
