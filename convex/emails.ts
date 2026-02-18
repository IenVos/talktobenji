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
          Je gratis proefperiode van Benji loopt over <strong>2 dagen</strong> af — op ${expiresDate}.
        </p>
        <p style="font-size: 15px; line-height: 1.7; color: #4a5568;">
          Tot die tijd heb je nog toegang tot alles: gesprekken met Benji, reflecties, check-ins, doelen, memories, inspiratie en handreikingen.
        </p>
        <p style="font-size: 15px; line-height: 1.7; color: #4a5568;">
          Wil je dit blijven gebruiken? Kies dan nu een abonnement dat bij je past.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://talktobenji.com/account/abonnement?upgrade=true"
             style="background-color: #6d84a8; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 600; display: inline-block;">
            Mijn abonnement bekijken
          </a>
        </div>
        <p style="font-size: 14px; line-height: 1.7; color: #718096;">
          Je gesprekken, reflecties en doelen blijven altijd bewaard — ook als je niet upgradet.
        </p>
        <p style="font-size: 15px; margin-top: 24px; color: #4a5568;">Met warmte,<br />Benji</p>
      </div>
    `;

    await sendEmail({
      to: args.email,
      subject: "Nog 2 dagen proeftijd — upgrade om alles te blijven gebruiken",
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
          Vandaag is de <strong>laatste dag</strong> van je gratis proefperiode bij Benji.
        </p>
        <p style="font-size: 15px; line-height: 1.7; color: #4a5568;">
          Morgen wordt je toegang teruggezet naar gratis. Daarmee verlies je toegang tot:
        </p>
        <ul style="font-size: 15px; line-height: 1.9; color: #4a5568; padding-left: 20px;">
          <li>Onbeperkt gesprekken met Benji</li>
          <li>Reflecties en check-ins</li>
          <li>Persoonlijke doelen</li>
          <li>Memories, inspiratie en handreikingen</li>
          <li>Personalisatie van je account</li>
        </ul>
        <p style="font-size: 15px; line-height: 1.7; color: #4a5568;">
          Je verhaal, gesprekken en alles wat je hebt opgebouwd blijven altijd bewaard.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://talktobenji.com/account/abonnement?upgrade=true"
             style="background-color: #6d84a8; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 600; display: inline-block;">
            Nu upgraden
          </a>
        </div>
        <p style="font-size: 15px; margin-top: 24px; color: #4a5568;">Met warmte,<br />Benji</p>
      </div>
    `;

    await sendEmail({
      to: args.email,
      subject: "Vandaag is je laatste dag — upgrade nu",
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
