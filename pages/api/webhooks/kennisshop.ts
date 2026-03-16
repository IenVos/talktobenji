/**
 * KennisShop webhook endpoint
 *
 * Stel in KennisShop in als webhook-URL:
 *   https://talktobenji.com/api/webhooks/kennisshop
 *
 * Vereiste environment variabelen:
 *   KENNISSHOP_WEBHOOK_SECRET  — zelf te kiezen geheime sleutel, ook instellen in Convex
 *
 * KennisShop product-ID's → abonnement type mapping:
 *   Stel de juiste product-ID's in als environment variabelen:
 *   KENNISSHOP_PRODUCT_UITGEBREID  — product-ID van "Benji Uitgebreid"
 *   KENNISSHOP_PRODUCT_ALLES_IN_1  — product-ID van "Benji Alles in 1"
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { ConvexHttpClient } from "convex/browser";
import { api, internal } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Alleen POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Controleer webhook secret — via header of query param
  const secret =
    (req.headers["x-webhook-secret"] as string) ||
    (req.headers["x-kennisshop-secret"] as string) ||
    (req.query.secret as string);

  if (!secret || secret !== process.env.KENNISSHOP_WEBHOOK_SECRET) {
    console.warn("[KennisShop webhook] Ongeldig secret ontvangen");
    return res.status(401).json({ error: "Unauthorized" });
  }

  const body = req.body;

  console.log("[KennisShop webhook] Event ontvangen:", JSON.stringify(body, null, 2));

  // KennisShop stuurt data in een "data" object
  const data = body?.data || body;

  const email: string | undefined = data?.customer_email;
  const externalId: string | undefined = data?.order_id?.toString();
  const productId: string | undefined =
    data?.bought_products?.[0]?.product_id?.toString();

  // Bij opzegging stuurt KennisShop een apart veld
  const isCancellation = data?.status === "cancelled" || data?.status === "canceled";

  if (!email) {
    console.error("[KennisShop webhook] Geen e-mail in payload");
    return res.status(400).json({ error: "Geen e-mail gevonden in payload" });
  }

  function getSubscriptionType(prodId?: string): "uitgebreid" | "alles_in_1" | "niet_alleen" | null {
    if (!prodId) return null;
    if (prodId === process.env.KENNISSHOP_PRODUCT_UITGEBREID) return "uitgebreid";
    if (prodId === process.env.KENNISSHOP_PRODUCT_ALLES_IN_1) return "alles_in_1";
    if (prodId === process.env.KENNISSHOP_PRODUCT_NIET_ALLEEN) return "niet_alleen";
    if (prodId === process.env.KENNISSHOP_PRODUCT_JAAR_TOEGANG) return "alles_in_1";
    return null;
  }

  function isJaarToegang(prodId?: string): boolean {
    return !!prodId && prodId === process.env.KENNISSHOP_PRODUCT_JAAR_TOEGANG;
  }

  const naam: string = data?.customer_first_name
    ? `${data.customer_first_name} ${data.customer_last_name ?? ""}`.trim()
    : (data?.customer_name ?? data?.name ?? "");

  async function voegToeAanMailerLite(groepId: string) {
    const apiKey = process.env.MAILERLITE_API_KEY;
    if (!apiKey) return;
    try {
      await fetch("https://connect.mailerlite.com/api/subscribers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          email,
          fields: { name: naam },
          groups: [groepId],
        }),
      });
      console.log(`[MailerLite] ${email} toegevoegd aan groep ${groepId}`);
    } catch (err) {
      console.error("[MailerLite] Fout bij toevoegen:", err);
    }
  }

  const webhookSecret = process.env.KENNISSHOP_WEBHOOK_SECRET!;

  try {
    // ——————————————————————————————————————————————
    // OPZEGGING
    // ——————————————————————————————————————————————
    if (isCancellation) {
      await convex.mutation(api.subscriptions.cancelSubscriptionByEmail, {
        webhookSecret,
        email,
        externalSubscriptionId: externalId,
      });

      console.log(`[KennisShop webhook] Abonnement opgezegd: ${email}`);
      return res.status(200).json({ received: true, action: "cancelled" });
    }

    // ——————————————————————————————————————————————
    // AANKOOP → activeer abonnement
    // ——————————————————————————————————————————————
    const subscriptionType = getSubscriptionType(productId);

    if (!subscriptionType) {
      console.warn("[KennisShop webhook] Onbekend product-ID:", productId);
      return res.status(200).json({ received: true, warning: "Onbekend product-ID" });
    }

    // Niet Alleen — aparte activatie flow (profiel + welkomstmail via eigen route)
    if (subscriptionType === "niet_alleen") {
      const naam: string = data?.customer_first_name
        ? `${data.customer_first_name} ${data.customer_last_name ?? ""}`.trim()
        : (data?.customer_name ?? data?.name ?? email);
      const userId: string = data?.user_id ?? email;

      await fetch(`${process.env.NEXTAUTH_URL}/api/niet-alleen/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, naam, userId, webhookSecret }),
      });

      console.log(`[KennisShop webhook] Niet Alleen geactiveerd: ${email}`);
      return res.status(200).json({ received: true, action: "niet_alleen_activated" });
    }

    const billingPeriod = isJaarToegang(productId) ? "yearly" : "monthly";

    await convex.mutation(api.subscriptions.activateSubscriptionByEmail, {
      webhookSecret,
      email,
      subscriptionType,
      billingPeriod,
      externalSubscriptionId: externalId,
      paymentProvider: "kennisshop",
    });

    // MailerLite — voeg toe aan de juiste groep
    if (subscriptionType === "uitgebreid") {
      await voegToeAanMailerLite(process.env.MAILERLITE_GROUP_UITGEBREID!);
    } else if (subscriptionType === "alles_in_1" && !isJaarToegang(productId)) {
      await voegToeAanMailerLite(process.env.MAILERLITE_GROUP_ALLES_IN_1!);
    } else if (isJaarToegang(productId) && process.env.MAILERLITE_GROUP_JAAR_TOEGANG) {
      await voegToeAanMailerLite(process.env.MAILERLITE_GROUP_JAAR_TOEGANG);
    }

    console.log(`[KennisShop webhook] Abonnement geactiveerd: ${email} → ${subscriptionType}`);
    return res.status(200).json({ received: true, action: "activated" });

  } catch (err: any) {
    console.error("[KennisShop webhook] Fout:", err?.message || err);
    // Stuur 200 terug zodat KennisShop niet blijft retrien voor bekende fouten
    // (bijv. account bestaat niet). Pas aan naar 500 als je wil dat KennisShop het opnieuw probeert.
    return res.status(200).json({ received: true, error: err?.message });
  }
}
