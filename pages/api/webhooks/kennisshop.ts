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
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Alleen POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Controleer webhook secret (KennisShop stuurt dit mee als header of query param)
  // Pas aan naar wat KennisShop exact stuurt — check hun documentatie
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

  function getSubscriptionType(prodId?: string): "uitgebreid" | "alles_in_1" | null {
    if (!prodId) return null;
    if (prodId === process.env.KENNISSHOP_PRODUCT_UITGEBREID) return "uitgebreid";
    if (prodId === process.env.KENNISSHOP_PRODUCT_ALLES_IN_1) return "alles_in_1";
    return null;
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

    await convex.mutation(api.subscriptions.activateSubscriptionByEmail, {
      webhookSecret,
      email,
      subscriptionType,
      billingPeriod: "monthly",
      externalSubscriptionId: externalId,
      paymentProvider: "kennisshop",
    });

    console.log(`[KennisShop webhook] Abonnement geactiveerd: ${email} → ${subscriptionType}`);
    return res.status(200).json({ received: true, action: "activated" });

  } catch (err: any) {
    console.error("[KennisShop webhook] Fout:", err?.message || err);
    // Stuur 200 terug zodat KennisShop niet blijft retrien voor bekende fouten
    // (bijv. account bestaat niet). Pas aan naar 500 als je wil dat KennisShop het opnieuw probeert.
    return res.status(200).json({ received: true, error: err?.message });
  }
}
