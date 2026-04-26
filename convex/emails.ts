/**
 * Email verzending via Resend
 */
import { internalAction, action } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { checkAdmin } from "./adminAuth";
import { v } from "convex/values";

const ADMIN_EMAIL = process.env.ADMIN_EXEMPT_EMAIL ?? "";
import { DEFAULT_TEMPLATES } from "./emailTemplates";

const FROM = "Talk To Benji <noreply@talktobenji.com>";

async function sendEmail(args: {
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
    body: JSON.stringify({
      from: FROM,
      to: [args.to],
      subject: args.subject,
      html: args.html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Email verzenden mislukt: ${error}`);
  }

  return await response.json();
}

function buildEmailHtml(name: string, bodyText: string): string {
  const paragraphsHtml = bodyText
    .split(/\n\n+/)
    .map(
      (p) =>
        `<p style="font-size: 15px; line-height: 1.7; color: #4a5568;">${p.replace(/\n/g, "<br/>")}</p>`
    )
    .join("\n");

  return `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #2d3748;">
      <p style="font-size: 16px; margin-bottom: 8px;">Lieve ${name},</p>
      ${paragraphsHtml}
      <div style="margin: 32px 0;">
        <a href="https://www.talktobenji.com/lp/prijzen"
           style="background-color: #6d84a8; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 600; display: inline-block;">
          Kies wat bij je past
        </a>
      </div>
      <p style="font-size: 15px; margin-top: 24px; color: #4a5568;">Met warme groet,</p>
      <table cellpadding="0" cellspacing="0" border="0" style="margin-top: 12px;">
        <tr>
          <td style="padding-right: 14px; vertical-align: middle;">
            <img src="https://talktobenji.com/images/ien-founder.png" alt="Ien" width="56" height="56" style="border-radius: 50%; display: block; width: 56px; height: 56px; object-fit: cover;" />
          </td>
          <td style="vertical-align: middle;">
            <p style="font-size: 15px; font-weight: 600; color: #2d3748; margin: 0; padding: 0;">Ien</p>
            <p style="font-size: 13px; color: #718096; margin: 3px 0 0 0; padding: 0;">Founder van TalkToBenji</p>
          </td>
        </tr>
      </table>
      <p style="font-size: 12px; color: #a0aec0; margin-top: 28px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
        Vragen of iets kwijt? Stuur een mail naar <a href="mailto:contactmetien@talktobenji.com" style="color: #6d84a8;">contactmetien@talktobenji.com</a> — ik lees alles.
      </p>
    </div>
  `;
}

export const sendTrialDayFiveReminder = internalAction({
  args: {
    email: v.string(),
    name: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY niet geconfigureerd");

    const template = await ctx.runQuery(internal.emailTemplates.getTemplateInternal, {
      key: "trial_day5",
    });
    const subject = template?.subject ?? DEFAULT_TEMPLATES.trial_day5.subject;
    const bodyText = template?.bodyText ?? DEFAULT_TEMPLATES.trial_day5.bodyText;

    await sendEmail({
      to: args.email,
      subject,
      html: buildEmailHtml(args.name, bodyText),
      apiKey: RESEND_API_KEY,
    });
  },
});

export const sendTrialDaySevenReminder = internalAction({
  args: {
    email: v.string(),
    name: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY niet geconfigureerd");

    const template = await ctx.runQuery(internal.emailTemplates.getTemplateInternal, {
      key: "trial_day7",
    });
    const subject = template?.subject ?? DEFAULT_TEMPLATES.trial_day7.subject;
    const bodyText = template?.bodyText ?? DEFAULT_TEMPLATES.trial_day7.bodyText;

    await sendEmail({
      to: args.email,
      subject,
      html: buildEmailHtml(args.name, bodyText),
      apiKey: RESEND_API_KEY,
    });
  },
});

export const sendSupportEmail = internalAction({
  args: {
    userEmail: v.optional(v.string()),
    feedbackType: v.string(),
    onderwerp: v.string(),
    bericht: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    console.log("sendSupportEmail aangeroepen met:", {
      userEmail: args.userEmail,
      onderwerp: args.onderwerp,
      hasApiKey: !!RESEND_API_KEY,
    });

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY niet gevonden in environment variables");
      throw new Error("RESEND_API_KEY niet geconfigureerd");
    }

    const emailHtml = `
      <h2>Nieuw Support Bericht</h2>
      <p><strong>Van:</strong> ${args.userEmail || "Anoniem"}</p>
      <p><strong>Type:</strong> ${args.feedbackType}</p>
      <p><strong>Onderwerp:</strong> ${args.onderwerp}</p>
      <hr />
      <h3>Bericht:</h3>
      <p style="white-space: pre-wrap;">${args.bericht}</p>
      ${args.imageUrl ? `<hr /><p><strong>Bijgevoegde afbeelding:</strong></p><img src="${args.imageUrl}" alt="Screenshot" style="max-width: 600px; border: 1px solid #ddd; border-radius: 8px;" />` : ""}
      <hr />
      <p style="color: #666; font-size: 12px;">
        Reageer direct op dit bericht om contact op te nemen met ${args.userEmail || "de gebruiker"}.
      </p>
    `;

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Talk To Benji <noreply@talktobenji.com>",
          to: ["contactmetien@talktobenji.com"],
          reply_to: args.userEmail || undefined,
          subject: `Support: ${args.onderwerp}`,
          html: emailHtml,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("Resend API error:", {
          status: response.status,
          statusText: response.statusText,
          error,
        });
        throw new Error(`Email verzenden mislukt: ${error}`);
      }

      const data = await response.json();
      console.log("✅ Email succesvol verzonden:", data);
      return data;
    } catch (error) {
      console.error("❌ Error sending email:", error);
      throw error;
    }
  },
});

/**
 * Stuur admin-notificatie als een gebruiker zijn abonnement opzegt.
 */
export const sendWelcomeEmail = internalAction({
  args: {
    email: v.string(),
    name: v.string(),
  },
  handler: async (_ctx, args) => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) return;

    const firstName = args.name.split(" ")[0] || args.name;

    const html = `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #2d3748;">
        <p style="font-size: 16px; margin-bottom: 8px;">Hi ${firstName},</p>

        <p style="font-size: 15px; line-height: 1.7; color: #4a5568;">
          Fijn dat je er bent.
        </p>

        <p style="font-size: 15px; line-height: 1.7; color: #4a5568;">
          Ik weet niet precies wat je op dit moment draagt, maar dat je hier bent betekent iets. Het vraagt moed om ergens naar op zoek te gaan als je verdriet hebt.
        </p>

        <p style="font-size: 15px; line-height: 1.7; color: #4a5568;">
          De komende 7 dagen heb je toegang tot alles. Begin gewoon ergens — er is geen goede of verkeerde manier. Een gesprek met Benji, een dagelijkse check-in, herinneringen bewaren in Memories, of bladeren door gedichten die zeggen wat jij zelf niet onder woorden kunt brengen.
        </p>

        <p style="font-size: 15px; line-height: 1.7; color: #4a5568;">
          Benji is er wanneer je hem nodig hebt. Overdag, 's avonds, midden in de nacht. Zonder oordeel, zonder haast.
        </p>

        <p style="font-size: 15px; line-height: 1.7; color: #4a5568;">
          Neem de tijd. Je hoeft nergens klaar voor te zijn.
        </p>

        <div style="margin: 28px 0 8px 0;">
          <p style="font-size: 13px; color: #9ca3af; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.05em;">Dit is wat je bij Talk To Benji vindt</p>
          <img
            src="https://talktobenji.com/images/app-screenshot.png"
            alt="Talk To Benji — Mijn plek"
            width="520"
            style="width: 100%; max-width: 520px; border-radius: 12px; border: 1px solid #e5e7eb; display: block;"
          />
        </div>

        <div style="margin: 28px 0;">
          <a href="https://talktobenji.com/chat"
             style="background-color: #6d84a8; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 600; display: inline-block;">
            Begin je eerste gesprek
          </a>
        </div>

        <p style="font-size: 15px; margin-top: 24px; color: #4a5568;">Met warme groet,</p>
        <table cellpadding="0" cellspacing="0" border="0" style="margin-top: 12px;">
          <tr>
            <td style="padding-right: 14px; vertical-align: middle;">
              <img src="https://talktobenji.com/images/ien-founder.png" alt="Ien" width="56" height="56" style="border-radius: 50%; display: block; width: 56px; height: 56px; object-fit: cover;" />
            </td>
            <td style="vertical-align: middle;">
              <p style="font-size: 15px; font-weight: 600; color: #2d3748; margin: 0; padding: 0;">Ien</p>
              <p style="font-size: 13px; color: #718096; margin: 3px 0 0 0; padding: 0;">Founder van TalkToBenji</p>
            </td>
          </tr>
        </table>
      </div>
    `;

    await sendEmail({
      to: args.email,
      subject: "Welkom bij Talk To Benji",
      html,
      apiKey: RESEND_API_KEY,
    });
  },
});

/** Admin: stuur testversie van de welkomstmail */
export const sendTestWelcomeEmail = action({
  args: { adminToken: v.string(), email: v.string(), name: v.string() },
  handler: async (ctx, args) => {
    await ctx.runQuery(api.adminAuth.validateToken, { adminToken: args.adminToken });
    await ctx.runAction(internal.emails.sendWelcomeEmail, {
      email: args.email,
      name: args.name,
    });
  },
});

export const sendJaarRenewalEmail1 = internalAction({
  args: {
    email: v.string(),
    name: v.string(),
    expiresAt: v.number(),
  },
  handler: async (_ctx, args) => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) return;

    const firstName = args.name.split(" ")[0] || args.name;
    const einddatum = new Date(args.expiresAt).toLocaleDateString("nl-NL", {
      day: "numeric", month: "long", year: "numeric",
    });

    const html = `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #2d3748;">
        <p style="font-size: 16px; margin-bottom: 8px;">Hi ${firstName},</p>

        <p style="font-size: 15px; line-height: 1.7; color: #4a5568;">
          Hoe gaat het met je? Ik denk aan je.
        </p>
        <p style="font-size: 15px; line-height: 1.7; color: #4a5568;">
          Het is bijna een jaar geleden dat je met Talk To Benji bent begonnen. Ik hoop dat het je heeft geholpen — op welke manier dan ook. Dat Benji er op de moeilijke momenten was, en op de gewone.
        </p>
        <p style="font-size: 15px; line-height: 1.7; color: #4a5568;">
          Je toegang loopt op <strong>${einddatum}</strong> af. Als je nog een jaar samen wil gaan, is dat van harte welkom.
        </p>

        <div style="margin: 32px 0;">
          <a href="https://talktobenji.kennis.shop/pay/je-hoeft-het-niet-alleen-te-dragen"
             style="background-color: #6d84a8; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 600; display: inline-block;">
            Nog een jaar samen
          </a>
        </div>

        <p style="font-size: 15px; line-height: 1.7; color: #4a5568;">
          Wil je liever stoppen? Dat is helemaal goed. Je kunt al je gegevens (gesprekken, reflecties, memories) downloaden via je account. En als je wilt, kun je je account ook zelf verwijderen. Je vindt beide opties onder <a href="https://talktobenji.com/account/wachtwoord" style="color: #6d84a8;">Instellingen, Account</a>.
        </p>

        <p style="font-size: 15px; margin-top: 24px; color: #4a5568;">Met warme groet,</p>
        <table cellpadding="0" cellspacing="0" border="0" style="margin-top: 12px;">
          <tr>
            <td style="padding-right: 14px; vertical-align: middle;">
              <img src="https://talktobenji.com/images/ien-founder.png" alt="Ien" width="56" height="56" style="border-radius: 50%; display: block; width: 56px; height: 56px; object-fit: cover;" />
            </td>
            <td style="vertical-align: middle;">
              <p style="font-size: 15px; font-weight: 600; color: #2d3748; margin: 0; padding: 0;">Ien</p>
              <p style="font-size: 13px; color: #718096; margin: 3px 0 0 0; padding: 0;">Founder van TalkToBenji</p>
            </td>
          </tr>
        </table>
      </div>
    `;

    await sendEmail({
      to: args.email,
      subject: "Hoe gaat het met je? 💙",
      html,
      apiKey: RESEND_API_KEY,
    });
  },
});

export const sendJaarRenewalEmail2 = internalAction({
  args: {
    email: v.string(),
    name: v.string(),
    expiresAt: v.number(),
  },
  handler: async (_ctx, args) => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) return;

    const firstName = args.name.split(" ")[0] || args.name;
    const einddatum = new Date(args.expiresAt).toLocaleDateString("nl-NL", {
      day: "numeric", month: "long", year: "numeric",
    });

    const html = `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #2d3748;">
        <p style="font-size: 16px; margin-bottom: 8px;">Hi ${firstName},</p>

        <p style="font-size: 15px; line-height: 1.7; color: #4a5568;">
          Nog twee weken, dan loopt je toegang tot Talk To Benji af — op <strong>${einddatum}</strong>.
        </p>
        <p style="font-size: 15px; line-height: 1.7; color: #4a5568;">
          Alles wat je hebt opgebouwd — je gesprekken, reflecties, memories — blijft bewaard zolang je account bestaat. Maar Benji zal na die datum niet meer voor je beschikbaar zijn.
        </p>
        <p style="font-size: 15px; line-height: 1.7; color: #4a5568;">
          Wil je nog een jaar verder? Je kunt je toegang verlengen via de knop hieronder.
        </p>

        <div style="margin: 32px 0;">
          <a href="https://talktobenji.kennis.shop/pay/je-hoeft-het-niet-alleen-te-dragen"
             style="background-color: #6d84a8; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 600; display: inline-block;">
            Toegang verlengen
          </a>
        </div>

        <p style="font-size: 14px; line-height: 1.7; color: #718096; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 20px;">
          Wil je liever stoppen? Geen probleem. Je kunt al je gegevens downloaden of je account verwijderen via <a href="https://talktobenji.com/account/wachtwoord" style="color: #6d84a8;">Instellingen, Account</a>. Daar vind je ook de downloadknop voor al je gesprekken en reflecties.
        </p>

        <p style="font-size: 15px; margin-top: 24px; color: #4a5568;">Met warme groet,</p>
        <table cellpadding="0" cellspacing="0" border="0" style="margin-top: 12px;">
          <tr>
            <td style="padding-right: 14px; vertical-align: middle;">
              <img src="https://talktobenji.com/images/ien-founder.png" alt="Ien" width="56" height="56" style="border-radius: 50%; display: block; width: 56px; height: 56px; object-fit: cover;" />
            </td>
            <td style="vertical-align: middle;">
              <p style="font-size: 15px; font-weight: 600; color: #2d3748; margin: 0; padding: 0;">Ien</p>
              <p style="font-size: 13px; color: #718096; margin: 3px 0 0 0; padding: 0;">Founder van TalkToBenji</p>
            </td>
          </tr>
        </table>
      </div>
    `;

    await sendEmail({
      to: args.email,
      subject: "Nog twee weken — wil je verder?",
      html,
      apiKey: RESEND_API_KEY,
    });
  },
});

export const sendJaarRenewalEmail3 = internalAction({
  args: {
    email: v.string(),
    name: v.string(),
    expiresAt: v.number(),
  },
  handler: async (_ctx, args) => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) return;

    const firstName = args.name.split(" ")[0] || args.name;

    const html = `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #2d3748;">
        <p style="font-size: 16px; margin-bottom: 8px;">Hi ${firstName},</p>

        <p style="font-size: 15px; line-height: 1.7; color: #4a5568;">
          Vandaag is de laatste dag van je jaar met Talk To Benji.
        </p>
        <p style="font-size: 15px; line-height: 1.7; color: #4a5568;">
          Ik ben blij dat je er was. Ik hoop dat het jaar je iets heeft gegeven, al was het maar het gevoel dat je er niet alleen voor stond.
        </p>
        <p style="font-size: 15px; line-height: 1.7; color: #4a5568;">
          Als je nog een jaar verder wilt, kun je dat hieronder regelen. Benji staat voor je klaar.
        </p>

        <div style="margin: 32px 0;">
          <a href="https://talktobenji.kennis.shop/pay/je-hoeft-het-niet-alleen-te-dragen"
             style="background-color: #6d84a8; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 600; display: inline-block;">
            Nog een jaar samen
          </a>
        </div>

        <p style="font-size: 14px; line-height: 1.7; color: #718096; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 20px;">
          Wil je stoppen? Je kunt al je gegevens (gesprekken, reflecties, memories) downloaden of je account verwijderen via <a href="https://talktobenji.com/account/wachtwoord" style="color: #6d84a8;">Instellingen, Account</a>.
        </p>

        <p style="font-size: 15px; margin-top: 24px; color: #4a5568;">Met warme groet,</p>
        <table cellpadding="0" cellspacing="0" border="0" style="margin-top: 12px;">
          <tr>
            <td style="padding-right: 14px; vertical-align: middle;">
              <img src="https://talktobenji.com/images/ien-founder.png" alt="Ien" width="56" height="56" style="border-radius: 50%; display: block; width: 56px; height: 56px; object-fit: cover;" />
            </td>
            <td style="vertical-align: middle;">
              <p style="font-size: 15px; font-weight: 600; color: #2d3748; margin: 0; padding: 0;">Ien</p>
              <p style="font-size: 13px; color: #718096; margin: 3px 0 0 0; padding: 0;">Founder van TalkToBenji</p>
            </td>
          </tr>
        </table>
      </div>
    `;

    await sendEmail({
      to: args.email,
      subject: "Vandaag is je laatste dag — tot ziens, of tot snel",
      html,
      apiKey: RESEND_API_KEY,
    });
  },
});

export const sendCancellationNotification = internalAction({
  args: {
    userEmail: v.string(),
    userName: v.optional(v.string()),
    reason: v.string(),
    valuable: v.string(),
    wouldRecommend: v.string(),
    expiresAt: v.number(),
  },
  handler: async (_ctx, args) => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) return;

    const einddatum = new Date(args.expiresAt).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const html = `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #2d3748;">
        <h2 style="font-size: 18px; color: #2d3748;">Abonnement opgezegd</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 15px; margin-top: 16px;">
          <tr><td style="padding: 8px 0; color: #718096; width: 160px;">Gebruiker</td><td style="padding: 8px 0;">${args.userName ?? "—"} (${args.userEmail})</td></tr>
          <tr><td style="padding: 8px 0; color: #718096;">Toegang tot</td><td style="padding: 8px 0;">${einddatum}</td></tr>
          <tr><td style="padding: 8px 0; color: #718096;">Reden</td><td style="padding: 8px 0;">${args.reason}</td></tr>
          <tr><td style="padding: 8px 0; color: #718096;">Meest waardevol</td><td style="padding: 8px 0;">${args.valuable}</td></tr>
          <tr><td style="padding: 8px 0; color: #718096;">Zou aanraden</td><td style="padding: 8px 0;">${args.wouldRecommend}</td></tr>
        </table>
        <p style="font-size: 13px; color: #a0aec0; margin-top: 24px;">Vergeet niet het abonnement ook in KennisShop te annuleren.</p>
      </div>
    `;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Talk To Benji <noreply@talktobenji.com>",
        to: [ADMIN_EMAIL],
        subject: `Abonnement opgezegd — ${args.userEmail}`,
        html,
      }),
    });
  },
});
