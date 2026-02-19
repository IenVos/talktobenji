/**
 * Email verzending via Resend
 */
import { internalAction } from "./_generated/server";
import { v } from "convex/values";

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

export const sendTrialDayFiveReminder = internalAction({
  args: {
    email: v.string(),
    name: v.string(),
    expiresAt: v.number(),
  },
  handler: async (_ctx, args) => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY niet geconfigureerd");

    const expiresDate = new Date(args.expiresAt).toLocaleDateString("nl-NL", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    const html = `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #2d3748;">
        <p style="font-size: 16px; margin-bottom: 8px;">Lieve ${args.name},</p>
        <p style="font-size: 15px; line-height: 1.7; color: #4a5568;">
          We wilden je even laten weten dat je proefperiode over <strong>2 dagen</strong> afloopt, op ${expiresDate}.
        </p>
        <p style="font-size: 15px; line-height: 1.7; color: #4a5568;">
          We hopen dat je de afgelopen dagen hebt kunnen voelen waarvoor Benji er is: een plek waar je je verhaal kwijt kunt, op je eigen tempo.
        </p>
        <p style="font-size: 15px; line-height: 1.7; color: #4a5568;">
          Als je wilt blijven werken aan wat je bent begonnen, je reflecties, je doelen, je gesprekken, dan is er een abonnement dat daarbij past. En wat je tot nu toe hebt opgebouwd, blijft altijd van jou.
        </p>
        <div style="text-align: center; margin: 32px 0;">
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

    await sendEmail({
      to: args.email,
      subject: "Nog 2 dagen — je proefperiode loopt bijna af",
      html,
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
  handler: async (_ctx, args) => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY niet geconfigureerd");

    const html = `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #2d3748;">
        <p style="font-size: 16px; margin-bottom: 8px;">Lieve ${args.name},</p>
        <p style="font-size: 15px; line-height: 1.7; color: #4a5568;">
          Hoe gaat het met je? We hopen dat de afgelopen week met Benji een beetje steun heeft gebracht.
        </p>
        <p style="font-size: 15px; line-height: 1.7; color: #4a5568;">
          De afgelopen 7 dagen hebben we je laten proeven van alles wat Benji te bieden heeft, en vandaag is de laatste dag dat je volledige toegang hebt.
        </p>
        <p style="font-size: 15px; line-height: 1.7; color: #4a5568;">
          Heb je gemerkt dat bepaalde dingen je goed deden? De gesprekken, je reflecties, de check-ins of de memories? Dan is het fijn om te weten dat die gewoon voor je bewaard blijven, wat je ook kiest.
        </p>
        <p style="font-size: 15px; line-height: 1.7; color: #4a5568;">
          Mocht je willen blijven gebruiken wat je de afgelopen tijd hebt ontdekt, dan kan dat via een abonnement dat bij je past. Geen druk, maar we willen je er wel even op wijzen.
        </p>
        <div style="text-align: center; margin: 32px 0;">
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

    await sendEmail({
      to: args.email,
      subject: "Vandaag is de laatste dag van je proefperiode",
      html,
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
