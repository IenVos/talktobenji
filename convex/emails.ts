/**
 * Email verzending via Resend
 */
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
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
        <a href="https://talktobenji.com/account/abonnement?upgrade=true"
           style="background-color: #6d84a8; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 600; display: inline-block;">
          Bekijk de abonnementen
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
        <p style="font-size: 16px; margin-bottom: 8px;">Lieve ${firstName},</p>

        <p style="font-size: 15px; line-height: 1.7; color: #4a5568;">
          Fijn dat je er bent. Je account staat klaar.
        </p>

        <p style="font-size: 15px; line-height: 1.7; color: #4a5568;">
          Benji is er voor jou. Op momenten dat je wilt praten, even wilt stilstaan bij iets wat je bezighoudt, of gewoon een luisterend oor nodig hebt. Geen oordeel, geen haast. Gewoon aandacht.
        </p>

        <p style="font-size: 15px; line-height: 1.7; color: #4a5568;">
          De komende 7 dagen heb je vrije toegang tot alles wat Benji te bieden heeft. Begin een gesprek, doe een dagelijkse check-in, of verken je account op je eigen tempo.
        </p>

        <div style="margin: 32px 0;">
          <a href="https://talktobenji.com/chat"
             style="background-color: #6d84a8; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 600; display: inline-block;">
            Begin je eerste gesprek
          </a>
        </div>

        <p style="font-size: 15px; line-height: 1.7; color: #4a5568;">
          Heb je een vraag? Je kunt me altijd bereiken via <a href="mailto:contactmetien@talktobenji.com" style="color: #6d84a8;">contactmetien@talktobenji.com</a>.
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
      subject: "Welkom bij Talk To Benji",
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
