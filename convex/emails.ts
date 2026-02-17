/**
 * Email verzending via Resend
 */
import { internalAction } from "./_generated/server";
import { v } from "convex/values";

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
