/**
 * Verwerking van ingeplande cadeau-mails.
 * Wordt dagelijks aangeroepen via cron job.
 */
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Resend } from "resend";
import { DEFAULT_TEMPLATES } from "./emailTemplatesDefaults";

export const processScheduledGifts = internalAction({
  args: {},
  handler: async (ctx) => {
    const pending = await ctx.runQuery(internal.giftCodes.getPendingScheduledGifts, {});
    if (!pending.length) return;

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      console.error("[GiftScheduled] RESEND_API_KEY niet ingesteld");
      return;
    }
    const resend = new Resend(resendKey);

    for (const gift of pending) {
      try {
        // Haal templates op (DB-override of default)
        const [tplOntvanger, tplVerzonden] = await Promise.all([
          ctx.runQuery(internal.emailTemplates.getTemplateInternal, { key: "gift_ontvanger" }),
          ctx.runQuery(internal.emailTemplates.getTemplateInternal, { key: "gift_verzonden" }),
        ]);

        const defaultOntvanger = DEFAULT_TEMPLATES.gift_ontvanger;
        const defaultVerzonden = DEFAULT_TEMPLATES.gift_verzonden;

        const giverVoornaam = gift.giverName.split(" ")[0];
        const displayProduct = gift.productName;
        const recipientEmail = gift.recipientEmail!;

        const buildBody = (text: string) =>
          text
            .split(/\n\n+/)
            .map((p) => `<p style="font-size:15px;line-height:1.8;color:#4a5568;">${p.replace(/\n/g, "<br/>")}</p>`)
            .join("");

        // ── Mail aan ontvanger ──
        const ontvSubject = (tplOntvanger?.subject ?? defaultOntvanger.subject)
          .replace(/{gever}/g, giverVoornaam)
          .replace(/{product}/g, displayProduct);
        const ontvAanhef = tplOntvanger?.aanhef ?? defaultOntvanger.aanhef ?? "Hoi,";
        const ontvBody = (tplOntvanger?.bodyText ?? defaultOntvanger.bodyText)
          .replace(/{gever}/g, giverVoornaam)
          .replace(/{product}/g, displayProduct)
          .replace(/{bericht}/g, gift.personalMessage || "");

        const berichtHtml = gift.personalMessage
          ? `<p style="background:#fff;border-left:3px solid #6d84a8;padding:12px 16px;border-radius:0 8px 8px 0;font-style:italic;color:#4a5568;margin:16px 0;">"${gift.personalMessage}"</p>`
          : "";

        const ontvButtonText = tplOntvanger?.buttonText ?? defaultOntvanger.buttonText ?? "Cadeau inwisselen";

        await resend.emails.send({
          from: "Talk To Benji <noreply@talktobenji.com>",
          to: recipientEmail,
          subject: ontvSubject,
          html: `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;color:#2d3748;background:#fdf9f4;padding:32px 24px;">
            <p style="font-size:16px;margin-bottom:16px;">${ontvAanhef}</p>
            ${buildBody(ontvBody)}
            ${berichtHtml}
            <div style="background:#fff;border:2px dashed #6d84a8;border-radius:12px;padding:20px 24px;margin:24px 0;text-align:center;">
              <p style="font-size:12px;color:#a0aec0;margin:0 0 6px 0;text-transform:uppercase;letter-spacing:0.1em;">Jouw cadeaucode</p>
              <p style="font-size:28px;font-weight:700;color:#2d3748;letter-spacing:0.08em;margin:0;">${gift.code}</p>
            </div>
            <div style="margin:20px 0;">
              <a href="https://talktobenji.com/cadeau-inwisselen" style="background:#6d84a8;color:#fff;padding:13px 26px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:600;display:inline-block;">${ontvButtonText}</a>
            </div>
            <p style="font-size:14px;color:#718096;margin-top:24px;">Vragen? <a href="mailto:contactmetien@talktobenji.com" style="color:#6d84a8;">contactmetien@talktobenji.com</a></p>
          </div>`,
        });

        // ── Markeer als verstuurd ──
        await ctx.runMutation(internal.giftCodes.markRecipientEmailSent, { id: gift._id });

        // ── Notificatie aan gever ──
        const verzSubject = (tplVerzonden?.subject ?? defaultVerzonden.subject)
          .replace(/{naam}/g, giverVoornaam)
          .replace(/{product}/g, displayProduct)
          .replace(/{ontvanger}/g, recipientEmail);
        const verzAanhef = (tplVerzonden?.aanhef ?? defaultVerzonden.aanhef ?? "Hi {naam},")
          .replace(/{naam}/g, giverVoornaam);
        const verzBody = (tplVerzonden?.bodyText ?? defaultVerzonden.bodyText)
          .replace(/{naam}/g, giverVoornaam)
          .replace(/{product}/g, displayProduct)
          .replace(/{ontvanger}/g, recipientEmail);

        await resend.emails.send({
          from: "Talk To Benji <noreply@talktobenji.com>",
          to: gift.giverEmail,
          subject: verzSubject,
          html: `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;color:#2d3748;background:#fdf9f4;padding:32px 24px;">
            <p style="font-size:16px;margin-bottom:16px;">${verzAanhef}</p>
            ${buildBody(verzBody)}
            <p style="font-size:14px;color:#718096;margin-top:24px;">Vragen? <a href="mailto:contactmetien@talktobenji.com" style="color:#6d84a8;">contactmetien@talktobenji.com</a></p>
          </div>`,
        });

        console.log(`[GiftScheduled] Code ${gift.code} verstuurd naar ${recipientEmail}`);
      } catch (err: any) {
        console.error(`[GiftScheduled] Fout bij code ${gift.code}:`, err?.message);
      }
    }
  },
});
