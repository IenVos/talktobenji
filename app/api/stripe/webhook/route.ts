import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Resend } from "resend";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function buildInvoiceEmail({
  invoiceNr,
  date,
  customerName,
  customerEmail,
  productName,
  totalInclBtw,
}: {
  invoiceNr: string;
  date: string;
  customerName: string;
  customerEmail: string;
  productName: string;
  totalInclBtw: number;
}) {
  const BTW_RATE = 0.25;
  const exclBtw = totalInclBtw / (1 + BTW_RATE);
  const btwBedrag = totalInclBtw - exclBtw;

  const fmt = (n: number) =>
    new Intl.NumberFormat("sv-SE", { style: "currency", currency: "EUR" }).format(n);

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Factuur ${invoiceNr}</title>
</head>
<body style="margin:0;padding:0;background:#f5f4f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#44403c;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td>
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e7e5e4;">

          <!-- Header -->
          <tr>
            <td style="background:#f5f4f0;padding:32px 40px;border-bottom:1px solid #e7e5e4;text-align:center;">
              <img src="https://www.talktobenji.com/images/benji-logo-2.png" alt="Talk To Benji" height="36" style="height:36px;width:auto;" />
            </td>
          </tr>

          <!-- Factuur titel + voldaan badge -->
          <tr>
            <td style="padding:32px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#a8a29e;">Factuur</p>
                    <h1 style="margin:4px 0 0;font-size:24px;font-weight:700;color:#1c1917;">${invoiceNr}</h1>
                  </td>
                  <td style="text-align:right;vertical-align:top;">
                    <span style="display:inline-block;background:#dcfce7;color:#16a34a;font-size:13px;font-weight:700;padding:6px 14px;border-radius:999px;letter-spacing:0.04em;">VOLDAAN</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Datum -->
          <tr>
            <td style="padding:8px 40px 28px;">
              <p style="margin:0;font-size:14px;color:#78716c;">${date}</p>
            </td>
          </tr>

          <!-- Van / Aan -->
          <tr>
            <td style="padding:0 40px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:top;width:50%;">
                    <p style="margin:0 0 6px;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#a8a29e;">Van</p>
                    <p style="margin:0;font-size:14px;line-height:1.6;color:#44403c;">
                      <strong style="color:#1c1917;">TalkToBenji</strong><br />
                      onderdeel van LAAV<br />
                      contactmetien@talktobenji.com<br />
                      Hässleholm, 28192<br />
                      Zweden<br />
                      BTW: SE671123042201
                    </p>
                  </td>
                  <td style="vertical-align:top;width:50%;padding-left:24px;">
                    <p style="margin:0 0 6px;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#a8a29e;">Aan</p>
                    <p style="margin:0;font-size:14px;line-height:1.6;color:#44403c;">
                      <strong style="color:#1c1917;">${customerName}</strong><br />
                      ${customerEmail}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #e7e5e4;margin:0;" />
            </td>
          </tr>

          <!-- Regelitems header -->
          <tr>
            <td style="padding:16px 40px 8px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#a8a29e;">Omschrijving</td>
                  <td style="font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#a8a29e;text-align:right;">Bedrag</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Product regel -->
          <tr>
            <td style="padding:8px 40px 16px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:15px;color:#1c1917;font-weight:500;">${productName}</td>
                  <td style="font-size:15px;color:#1c1917;text-align:right;white-space:nowrap;">${fmt(exclBtw)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #e7e5e4;margin:0;" />
            </td>
          </tr>

          <!-- Subtotaal + BTW + Totaal -->
          <tr>
            <td style="padding:16px 40px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width:240px;margin-left:auto;">
                <tr>
                  <td style="font-size:14px;color:#78716c;padding-bottom:6px;">Subtotaal excl. btw</td>
                  <td style="font-size:14px;color:#78716c;text-align:right;padding-bottom:6px;">${fmt(exclBtw)}</td>
                </tr>
                <tr>
                  <td style="font-size:14px;color:#78716c;padding-bottom:12px;">BTW (25%)</td>
                  <td style="font-size:14px;color:#78716c;text-align:right;padding-bottom:12px;">${fmt(btwBedrag)}</td>
                </tr>
                <tr style="border-top:2px solid #1c1917;">
                  <td style="font-size:16px;font-weight:700;color:#1c1917;padding-top:12px;">Totaal incl. btw</td>
                  <td style="font-size:16px;font-weight:700;color:#1c1917;text-align:right;padding-top:12px;">${fmt(totalInclBtw)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Betaalmethode -->
          <tr>
            <td style="padding:0 40px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f0;border-radius:10px;padding:14px 18px;">
                <tr>
                  <td>
                    <p style="margin:0;font-size:13px;color:#78716c;">
                      ✓&nbsp; <strong style="color:#44403c;">Betaald via Stripe</strong> &nbsp;·&nbsp; ${date}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f5f4f0;padding:20px 40px;border-top:1px solid #e7e5e4;text-align:center;">
              <p style="margin:0;font-size:12px;color:#a8a29e;">
                Vragen? Mail naar <a href="mailto:contactmetien@talktobenji.com" style="color:#6d84a8;">contactmetien@talktobenji.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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
    const { email, name, subscriptionType, slug, productName } = pi.metadata;

    if (email) {
      try {
        const subType = (
          subscriptionType === "niet_alleen" ||
          subscriptionType === "uitgebreid" ||
          subscriptionType === "alles_in_1"
        )
          ? (subscriptionType as "niet_alleen" | "uitgebreid" | "alles_in_1")
          : "alles_in_1";

        await convex.mutation(api.subscriptions.activateSubscriptionByEmail, {
          webhookSecret: process.env.KENNISSHOP_WEBHOOK_SECRET!,
          email,
          subscriptionType: subType,
          billingPeriod: "yearly",
          pricePaid: pi.amount / 100,
          paymentProvider: "stripe",
          externalSubscriptionId: pi.id,
        });
      } catch (err: any) {
        console.error("[Stripe webhook] activatie mislukt:", err?.message);
      }

      // MailerLite — voeg toe aan groep
      const mailerLiteKey = process.env.MAILERLITE_API_KEY;
      const mailerLiteGroep = process.env.MAILERLITE_GROUP_GRATIS;
      if (mailerLiteKey && mailerLiteGroep) {
        fetch("https://connect.mailerlite.com/api/subscribers", {
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

      // Factuur per e-mail via Resend
      if (process.env.RESEND_API_KEY) {
        try {
          const resend = new Resend(process.env.RESEND_API_KEY);
          const invoiceNr = `TTB-${new Date().getFullYear()}-${pi.id.slice(-6).toUpperCase()}`;
          const date = new Date().toLocaleDateString("nl-NL", {
            day: "numeric", month: "long", year: "numeric",
          });
          const totalInclBtw = pi.amount / 100;
          const omschrijving = productName || (slug ? slug.replace(/-/g, " ") : "Aankoop");

          await resend.emails.send({
            from: "TalkToBenji <contactmetien@talktobenji.com>",
            to: email,
            subject: `Factuur ${invoiceNr} – ${omschrijving}`,
            html: buildInvoiceEmail({
              invoiceNr,
              date,
              customerName: name || email,
              customerEmail: email,
              productName: omschrijving,
              totalInclBtw,
            }),
          });
        } catch (err: any) {
          console.error("[Resend] Factuur versturen mislukt:", err?.message);
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
