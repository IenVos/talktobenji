import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Resend } from "resend";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function buildInvoicePdf({
  invoiceNr, date, customerName, customerEmail, productName, totalInclBtw,
}: {
  invoiceNr: string; date: string; customerName: string; customerEmail: string;
  productName: string; totalInclBtw: number;
}): Promise<Uint8Array> {
  const BTW_RATE = 0.25;
  const exclBtw = totalInclBtw / (1 + BTW_RATE);
  const btwBedrag = totalInclBtw - exclBtw;
  const fmt = (n: number) => `€ ${n.toFixed(2).replace(".", ",")}`;

  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();

  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontReg = await doc.embedFont(StandardFonts.Helvetica);

  const gray = rgb(0.6, 0.6, 0.6);
  const dark = rgb(0.11, 0.1, 0.09);
  const mid = rgb(0.47, 0.44, 0.42);
  const green = rgb(0.09, 0.64, 0.26);
  const line = rgb(0.91, 0.9, 0.89);

  const L = 56; // left margin
  const R = width - 56; // right margin

  // ── Header balk ──
  page.drawRectangle({ x: 0, y: height - 72, width, height: 72, color: rgb(0.96, 0.95, 0.94) });
  page.drawText("TalkToBenji", { x: L, y: height - 38, size: 15, font: fontBold, color: dark });
  page.drawText("onderdeel van LAAV", { x: L, y: height - 54, size: 9, font: fontReg, color: mid });

  // ── FACTUUR + VOLDAAN ──
  let y = height - 110;
  page.drawText("FACTUUR", { x: L, y, size: 8, font: fontBold, color: gray });
  // VOLDAAN badge
  page.drawRectangle({ x: R - 72, y: y - 4, width: 72, height: 18, color: rgb(0.86, 0.99, 0.87) });
  page.drawText("VOLDAAN", { x: R - 58, y: y + 1, size: 8, font: fontBold, color: green });

  y -= 20;
  page.drawText(invoiceNr, { x: L, y, size: 13, font: fontBold, color: dark });
  y -= 16;
  page.drawText(date, { x: L, y, size: 10, font: fontReg, color: mid });

  // ── Van / Aan ──
  y -= 36;
  page.drawText("VAN", { x: L, y, size: 8, font: fontBold, color: gray });
  page.drawText("AAN", { x: width / 2, y, size: 8, font: fontBold, color: gray });

  const vanLines = ["TalkToBenji", "contactmetien@talktobenji.com", "Hässleholm, 28192", "Zweden", "BTW: SE671123042201"];
  const aanLines = [customerName, customerEmail];

  y -= 16;
  for (const l of vanLines) {
    page.drawText(l, { x: L, y, size: 9.5, font: l === "TalkToBenji" ? fontBold : fontReg, color: dark });
    y -= 14;
  }
  let aanY = y + vanLines.length * 14 - 14;
  for (const l of aanLines) {
    page.drawText(l, { x: width / 2, y: aanY, size: 9.5, font: l === customerName ? fontBold : fontReg, color: dark });
    aanY -= 14;
  }

  // ── Divider ──
  y -= 16;
  page.drawLine({ start: { x: L, y }, end: { x: R, y }, thickness: 0.5, color: line });

  // ── Tabelheader ──
  y -= 20;
  page.drawText("OMSCHRIJVING", { x: L, y, size: 8, font: fontBold, color: gray });
  page.drawText("BEDRAG", { x: R - 60, y, size: 8, font: fontBold, color: gray });

  // ── Productregel ──
  y -= 20;
  page.drawText(productName, { x: L, y, size: 11, font: fontBold, color: dark });
  page.drawText(fmt(exclBtw), { x: R - 60, y, size: 11, font: fontReg, color: dark });

  // ── Divider ──
  y -= 20;
  page.drawLine({ start: { x: L, y }, end: { x: R, y }, thickness: 0.5, color: line });

  // ── Subtotaal / BTW / Totaal ──
  const col1 = R - 180;
  const col2 = R - 60;
  y -= 20;
  page.drawText("Subtotaal excl. btw", { x: col1, y, size: 9.5, font: fontReg, color: mid });
  page.drawText(fmt(exclBtw), { x: col2, y, size: 9.5, font: fontReg, color: mid });
  y -= 16;
  page.drawText("BTW (25%)", { x: col1, y, size: 9.5, font: fontReg, color: mid });
  page.drawText(fmt(btwBedrag), { x: col2, y, size: 9.5, font: fontReg, color: mid });
  y -= 14;
  page.drawLine({ start: { x: col1, y }, end: { x: R, y }, thickness: 1, color: dark });
  y -= 16;
  page.drawText("Totaal incl. btw", { x: col1, y, size: 11, font: fontBold, color: dark });
  page.drawText(fmt(totalInclBtw), { x: col2, y, size: 11, font: fontBold, color: dark });

  // ── Betaald-balk ──
  y -= 36;
  page.drawRectangle({ x: L, y: y - 8, width: R - L, height: 28, color: rgb(0.96, 0.95, 0.94) });
  page.drawText(`Betaald via Stripe  -  ${date}`, { x: L + 14, y: y + 4, size: 9.5, font: fontBold, color: mid });

  // ── Footer ──
  page.drawLine({ start: { x: 0, y: 48 }, end: { x: width, y: 48 }, thickness: 0.5, color: line });
  page.drawText("Vragen? contactmetien@talktobenji.com", { x: L, y: 24, size: 8.5, font: fontReg, color: gray });

  return doc.save();
}


export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe niet geconfigureerd" }, { status: 500 });
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-02-24.acacia" });
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;
    const { email, name, subscriptionType, slug, productName, optIn, isGift, recipientEmail, recipientName, personalMessage, deliveryMethod, scheduledSendDate, giftBillingPeriod, giftAccessDays, giftLabel } = pi.metadata;

    // ── Cadeau-afhandeling ──
    if (isGift === "true" && email) {
      try {
        // Genereer unieke code
        const codeRaw = Math.random().toString(36).slice(2, 6).toUpperCase() +
                        Math.random().toString(36).slice(2, 6).toUpperCase();
        const code = `BENJI-${codeRaw.slice(0, 4)}-${codeRaw.slice(4, 8)}`;

        const product = slug
          ? await convex.query(api.checkoutProducts.getBySlug, { slug }).catch(() => null)
          : null;
        const subType: string = subscriptionType || "alles_in_1";

        // Als er een variant geselecteerd is gebruik die billing period; anders afleiden uit subscriptionType
        const billingPeriod: "monthly" | "quarterly" | "half_yearly" | "yearly" =
          (giftBillingPeriod === "monthly" || giftBillingPeriod === "quarterly" || giftBillingPeriod === "half_yearly" || giftBillingPeriod === "yearly")
            ? giftBillingPeriod
            : subType === "maand_toegang" ? "monthly"
            : subType === "kwartaal_toegang" ? "quarterly"
            : "yearly";

        // accessDays: variant heeft voorrang, daarna product, daarna default
        const accessDays =
          (giftAccessDays && parseInt(giftAccessDays, 10) > 0)
            ? parseInt(giftAccessDays, 10)
            : product?.accessDays ?? 365;

        const scheduledTs = scheduledSendDate ? parseInt(scheduledSendDate, 10) : undefined;
        const sendNow = !scheduledTs || scheduledTs <= Date.now();

        // Productnaam: gebruik giftLabel als er een variant is, anders productName
        const displayProductName = giftLabel
          ? `${productName || product?.name || "Talk To Benji"} — ${giftLabel}`
          : productName || product?.name || slug || "Talk To Benji";

        await convex.mutation(api.giftCodes.createGiftCode, {
          webhookSecret: process.env.KENNISSHOP_WEBHOOK_SECRET!,
          code,
          slug: slug || "",
          productName: displayProductName,
          subscriptionType: subType,
          billingPeriod,
          accessDays,
          pricePaid: pi.amount / 100,
          giverName: name || email,
          giverEmail: email,
          recipientEmail: recipientEmail || undefined,
          recipientName: recipientName || undefined,
          personalMessage: personalMessage || undefined,
          deliveryMethod: (deliveryMethod === "direct" ? "direct" : "manual") as "direct" | "manual",
          scheduledSendDate: scheduledTs,
          paymentIntentId: pi.id,
        });

        if (process.env.RESEND_API_KEY) {
          const resend = new Resend(process.env.RESEND_API_KEY);
          const giverVoornaam = (name || email).split(" ")[0];
          const displayProduct = displayProductName;

          // Haal admin-templates op (vallen terug op defaults als niet aangepast)
          const [tplGever, tplOntvanger] = await Promise.all([
            convex.query(api.emailTemplates.getTemplatePublic, { key: "gift_gever" }).catch(() => null),
            convex.query(api.emailTemplates.getTemplatePublic, { key: "gift_ontvanger" }).catch(() => null),
          ]);

          const buildBody = (text: string) =>
            text
              .split(/\n\n+/)
              .map((p) => `<p style="font-size:15px;line-height:1.8;color:#4a5568;">${p.replace(/\n/g, "<br/>")}</p>`)
              .join("");

          // ── Factuur voor gever ──
          const invoiceNr = `TTB-${new Date().getFullYear()}-${pi.id.slice(-6).toUpperCase()}`;
          const invoiceDate = new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
          let attachments: { filename: string; content: string }[] = [];
          try {
            const pdfBytes = await buildInvoicePdf({
              invoiceNr, date: invoiceDate,
              customerName: name || email, customerEmail: email,
              productName: displayProduct, totalInclBtw: pi.amount / 100,
            });
            attachments = [{ filename: `${invoiceNr}.pdf`, content: Buffer.from(pdfBytes).toString("base64") }];
          } catch (pdfErr: any) {
            console.error("[PDF] Cadeau factuur mislukt:", pdfErr?.message);
          }

          // ── Mail aan gever: cadeaucode + factuur ──
          const geverSubject = (tplGever?.subject ?? "Je cadeaucode voor {product}")
            .replace("{product}", displayProduct).replace("{naam}", giverVoornaam);
          const geverAanhef = (tplGever?.aanhef ?? "Hi {naam},").replace("{naam}", giverVoornaam);
          const geverBody = (tplGever?.bodyText ?? "Bedankt voor je aankoop! Hieronder vind je de cadeaucode voor {product}.\n\nJe factuur vind je als bijlage.")
            .replace(/{product}/g, displayProduct).replace(/{naam}/g, giverVoornaam);

          const scheduledNote = scheduledTs && !sendNow
            ? `<p style="font-size:14px;color:#718096;margin-top:16px;">📅 De ontvanger-mail wordt verstuurd op <strong>${new Date(scheduledTs).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</strong>.</p>`
            : "";

          await resend.emails.send({
            from: "Talk To Benji <noreply@talktobenji.com>",
            to: email,
            subject: geverSubject,
            html: `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;color:#2d3748;background:#fdf9f4;padding:32px 24px;">
              <p style="font-size:16px;margin-bottom:16px;">${geverAanhef}</p>
              ${buildBody(geverBody)}
              <div style="background:#fff;border:2px dashed #6d84a8;border-radius:12px;padding:20px 24px;margin:24px 0;text-align:center;">
                <p style="font-size:12px;color:#a0aec0;margin:0 0 6px 0;text-transform:uppercase;letter-spacing:0.1em;">Cadeaucode</p>
                <p style="font-size:28px;font-weight:700;color:#2d3748;letter-spacing:0.08em;margin:0;">${code}</p>
              </div>
              ${scheduledNote}
              <p style="font-size:13px;color:#a0aec0;margin-top:24px;">Je factuur (${invoiceNr}) vind je als bijlage.</p>
              <p style="font-size:14px;color:#718096;">Vragen? <a href="mailto:contactmetien@talktobenji.com" style="color:#6d84a8;">contactmetien@talktobenji.com</a></p>
            </div>`,
            ...(attachments.length > 0 && { attachments }),
          }).catch((err: any) => console.error("[Resend] Gever-cadeaumail mislukt:", err?.message));

          // ── Mail aan ontvanger: alleen bij direct + recipientEmail + sendNow ──
          if (deliveryMethod === "direct" && recipientEmail && sendNow) {
            const berichtHtml = personalMessage
              ? `<p style="background:#fff;border-left:3px solid #6d84a8;padding:12px 16px;border-radius:0 8px 8px 0;font-style:italic;color:#4a5568;margin:16px 0;">"${personalMessage}"</p>`
              : "";
            const ontvSubject = (tplOntvanger?.subject ?? "{gever} heeft iets voor je")
              .replace("{gever}", giverVoornaam).replace("{product}", displayProduct);
            const ontvAanhef = (tplOntvanger?.aanhef ?? "Hoi,");
            const ontvBody = (tplOntvanger?.bodyText ?? "{gever} heeft je een cadeau gegeven: toegang tot {product}.\n\n{bericht}\n\nWissel je code in en maak een gratis account aan.")
              .replace(/{gever}/g, giverVoornaam)
              .replace(/{product}/g, displayProduct)
              .replace(/{bericht}/g, personalMessage || "");

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
                  <p style="font-size:28px;font-weight:700;color:#2d3748;letter-spacing:0.08em;margin:0;">${code}</p>
                </div>
                <div style="margin:20px 0;">
                  <a href="https://talktobenji.com/cadeau-inwisselen" style="background:#6d84a8;color:#fff;padding:13px 26px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:600;display:inline-block;">${tplOntvanger?.buttonText ?? "Cadeau inwisselen"}</a>
                </div>
                <p style="font-size:14px;color:#718096;margin-top:24px;">Vragen? <a href="mailto:contactmetien@talktobenji.com" style="color:#6d84a8;">contactmetien@talktobenji.com</a></p>
              </div>`,
            }).catch((err: any) => console.error("[Resend] Ontvanger-cadeaumail mislukt:", err?.message));
          }
        }
      } catch (err: any) {
        console.error("[Cadeau] Fout bij verwerken gift:", err?.message);
      }
      return NextResponse.json({ received: true });
    }

    if (email) {
      // Product ophalen op basis van slug (bevat verliesType en bevestigingsmail)
      const product = slug
        ? await convex.query(api.checkoutProducts.getBySlug, { slug }).catch(() => null)
        : null;

      try {
        const subType: string = subscriptionType || "alles_in_1";
        const billingPeriod =
          subType === "maand_toegang" ? "monthly" :
          subType === "kwartaal_toegang" ? "quarterly" :
          "yearly";

        // Activatie proberen (stille fout als nog geen account)
        try {
          const accessDays = product?.accessDays ?? 365;
          await convex.mutation(api.subscriptions.activateSubscriptionByEmail, {
            webhookSecret: process.env.KENNISSHOP_WEBHOOK_SECRET!,
            email,
            subscriptionType: subType,
            billingPeriod,
            accessDays,
            pricePaid: pi.amount / 100,
            paymentProvider: "stripe",
            externalSubscriptionId: pi.id,
          });
        } catch {
          // Geen account — activatie volgt na registratie
        }

        // Niet Alleen profiel aanmaken:
        // - nieuw systeem: product heeft verliesType ingesteld in admin
        // - fallback: algemeen niet-alleen product (geen verliesType, klant kiest zelf tijdens onboarding)
        const isNietAlleen = !!product?.verliesType || subscriptionType === "niet_alleen";
        if (isNietAlleen) {
          try {
            await convex.mutation(api.nietAlleen.activateNietAlleenDirect, {
              email,
              naam: name || email,
              verliesType: product?.verliesType, // undefined = klant kiest zelf
            });
          } catch (err: any) {
            console.error("[Convex] Niet Alleen profiel aanmaken mislukt:", err?.message);
          }
        }
      } catch (err: any) {
        console.error("[Stripe webhook] fout:", err?.message);
      }

      // Welkomstmail direct via Resend (geen Convex nodig)
      const isNietAlleenMail = !!(product?.verliesType || subscriptionType === "niet_alleen");
      if (isNietAlleenMail && process.env.RESEND_API_KEY) {
        try {
          const resend = new Resend(process.env.RESEND_API_KEY);
          const voornaam = (name || email).split(" ")[0];
          await resend.emails.send({
            from: "Niet Alleen <noreply@talktobenji.com>",
            to: email,
            subject: "Welkom bij Niet Alleen",
            html: `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;color:#2d3748;background:#fdf9f4;padding:32px 24px;">
              <p style="font-size:16px;margin-bottom:8px;">Hi ${voornaam},</p>
              <p style="font-size:15px;line-height:1.8;color:#4a5568;">Fijn dat je er bent. De komende 30 dagen lopen we samen met je mee, één dag tegelijk.</p>
              <p style="font-size:15px;line-height:1.8;color:#4a5568;">Elke ochtend ontvang je een kleine vraag van Benji. Geen druk, geen goed of fout. Gewoon ruimte voor wat er in je leeft.</p>
              <div style="margin:28px 0;">
                <a href="https://talktobenji.com/niet-alleen/welkom" style="background-color:#6d84a8;color:white;padding:13px 26px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:600;display:inline-block;">Vandaag beginnen</a>
              </div>
              <p style="font-size:13px;color:#a0aec0;margin-bottom:20px;">Niet Alleen is een programma van Talk To Benji.</p>
              <table cellpadding="0" cellspacing="0" border="0"><tr>
                <td style="padding-right:14px;vertical-align:middle;"><img src="https://talktobenji.com/images/ien-founder.png" alt="Ien" width="52" height="52" style="border-radius:50%;display:block;" /></td>
                <td style="vertical-align:middle;"><p style="font-size:15px;font-weight:600;color:#2d3748;margin:0;">Ien</p><p style="font-size:13px;color:#718096;margin:3px 0 0 0;">Founder van Talk To Benji</p></td>
              </tr></table>
              <p style="font-size:13px;color:#a0aec0;margin-top:16px;">Vragen? Stuur een mail naar <a href="mailto:contactmetien@talktobenji.com" style="color:#6d84a8;">contactmetien@talktobenji.com</a>.</p>
            </div>`,
          });
        } catch (err: any) {
          console.error("[Resend] Welkomstmail mislukt:", err?.message);
        }
      }

      // MailerLite — alleen toevoegen als koper opt-in heeft gegeven
      const mailerLiteKey = process.env.MAILERLITE_API_KEY;
      const mailerLiteGroep = process.env.MAILERLITE_GROUP_GRATIS;
      if (mailerLiteKey && mailerLiteGroep && optIn === "true") {
        await fetch("https://connect.mailerlite.com/api/subscribers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${mailerLiteKey}`,
          },
          body: JSON.stringify({
            email,
            fields: { name: name ?? "" },
            groups: [mailerLiteGroep],
          }),
        }).catch((err) => console.error("[MailerLite] Stripe webhook fout:", err));
      }

      // Bevestigingsmail + factuur
      if (process.env.RESEND_API_KEY) {
        try {
          const resend = new Resend(process.env.RESEND_API_KEY);
          const invoiceNr = `TTB-${new Date().getFullYear()}-${pi.id.slice(-6).toUpperCase()}`;
          const date = new Date().toLocaleDateString("nl-NL", {
            day: "numeric", month: "long", year: "numeric",
          });
          const totalInclBtw = pi.amount / 100;
          const omschrijving = productName || (slug ? slug.replace(/-/g, " ") : "Aankoop");
          const voornaam = (name || email).split(" ")[0];

          // Bouw PDF
          let attachments: { filename: string; content: string }[] = [];
          try {
            const pdfBytes = await buildInvoicePdf({
              invoiceNr, date,
              customerName: name || email,
              customerEmail: email,
              productName: omschrijving,
              totalInclBtw,
            });
            attachments = [{ filename: `${invoiceNr}.pdf`, content: Buffer.from(pdfBytes).toString("base64") }];
          } catch (pdfErr: any) {
            console.error("[PDF] Generatie mislukt, email zonder bijlage:", pdfErr?.message);
          }

          if (product?.followUpEmailSubject && product?.followUpEmailBody) {
            // Bevestigingsmail + factuur als bijlage in één e-mail
            const toHtml = (text: string) =>
              text
                .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" style="color:#6d84a8;">$1</a>')
                .replace(/\n/g, "<br/>");
            const bodyHtml = product.followUpEmailBody
              .replace(/{naam}/g, voornaam)
              .split("\n\n")
              .map((p: string) => `<p style="font-size:15px;line-height:1.8;color:#4a5568;">${toHtml(p)}</p>`)
              .join("");
            await resend.emails.send({
              from: "Talk To Benji <noreply@talktobenji.com>",
              to: email,
              subject: product.followUpEmailSubject.replace("{naam}", voornaam),
              html: `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;color:#2d3748;background:#fdf9f4;padding:32px 24px;">
                ${bodyHtml}
                <div style="height:40px;"></div>
                <hr style="border:none;border-top:1px solid #e8e4e0;margin:0 0 20px 0;" />
                <p style="font-size:13px;color:#a0aec0;margin:0 0 8px 0;">Je factuur (${invoiceNr}) vind je als bijlage bij deze e-mail.</p>
                <p style="font-size:14px;color:#718096;">Vragen? Stuur een mail naar <a href="mailto:contactmetien@talktobenji.com" style="color:#6d84a8;">contactmetien@talktobenji.com</a>.</p>
              </div>`,
              ...(attachments.length > 0 && { attachments }),
            });
          } else {
            // Geen bevestigingsmail ingesteld — stuur alleen de factuur
            await resend.emails.send({
              from: "Talk To Benji <noreply@talktobenji.com>",
              to: email,
              subject: `Factuur ${invoiceNr} – ${omschrijving}`,
              html: `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;color:#44403c;padding:32px 24px;">
                <p style="font-size:15px;line-height:1.7;">Hi ${voornaam},</p>
                <p style="font-size:15px;line-height:1.7;">Hierbij je factuur voor <strong>${omschrijving}</strong>. Je vindt de factuur als bijlage bij deze e-mail.</p>
                <p style="font-size:14px;color:#78716c;">Vragen? Stuur een mail naar <a href="mailto:contactmetien@talktobenji.com" style="color:#6d84a8;">contactmetien@talktobenji.com</a>.</p>
              </div>`,
              ...(attachments.length > 0 && { attachments }),
            });
          }
        } catch (err: any) {
          console.error("[Resend] E-mail versturen mislukt:", err?.message);
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
