import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { rateLimit, retryAfterMessage } from "@/lib/rate-limit";
import { calculateVat, EU_COUNTRY_CODES } from "@/lib/vat";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `TTB-${year}-${suffix}`;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed, retryAfterMs } = rateLimit(`stripe:${ip}`, { maxAttempts: 10, windowMs: 60 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json(
      { error: `Te veel verzoeken. ${retryAfterMessage(retryAfterMs)}` },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe niet geconfigureerd" }, { status: 500 });
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-02-24.acacia" });
  const {
    slug, email, name, paymentIntentId, optIn,
    isGift, recipientEmail, recipientName, personalMessage, deliveryMethod, scheduledSendDate,
    giftVariantPriceInCents, giftVariantBillingPeriod, giftVariantAccessDays, giftVariantLabel,
    countryCode, vatNumber, benjiAddon,
    addOnPriceInCents, addOnType, addOnAccessDays,
  } = await req.json();

  if (!slug) {
    return NextResponse.json({ error: "Slug ontbreekt" }, { status: 400 });
  }

  // Update bestaande PaymentIntent met e-mail/naam (bij formulierindiening)
  if (paymentIntentId && email) {
    const updateParams: Stripe.PaymentIntentUpdateParams = {
      metadata: {
        email,
        name: name || "",
        optIn: optIn ? "true" : "false",
        ...(isGift && {
          isGift: "true",
          recipientEmail: recipientEmail || "",
          recipientName: recipientName || "",
          personalMessage: personalMessage || "",
          deliveryMethod: deliveryMethod || "manual",
          scheduledSendDate: scheduledSendDate ? String(scheduledSendDate) : "",
          ...(giftVariantBillingPeriod && {
            giftBillingPeriod: giftVariantBillingPeriod,
            giftAccessDays: giftVariantAccessDays ? String(giftVariantAccessDays) : "",
            giftLabel: giftVariantLabel || "",
          }),
        }),
      },
    };
    // Als cadeau met variant: pas ook het bedrag aan
    if (isGift && giftVariantPriceInCents && typeof giftVariantPriceInCents === "number" && giftVariantPriceInCents > 0) {
      updateParams.amount = giftVariantPriceInCents;
    }
    await stripe.paymentIntents.update(paymentIntentId, updateParams);
    return NextResponse.json({ success: true });
  }

  // countryCode is verplicht bij nieuwe PaymentIntent
  if (!countryCode || typeof countryCode !== "string") {
    return NextResponse.json({ error: "Landcode ontbreekt" }, { status: 400 });
  }
  const normalizedCountry = countryCode.toUpperCase();
  const isOutsideEU = normalizedCountry === "OTHER";
  if (!isOutsideEU && !EU_COUNTRY_CODES.includes(normalizedCountry)) {
    return NextResponse.json({ error: "Ongeldige landcode" }, { status: 400 });
  }

  // Haal product op uit Convex
  const product = await convex.query(api.checkoutProducts.getBySlug, { slug });
  if (!product || !product.isLive) {
    return NextResponse.json({ error: "Product niet gevonden" }, { status: 404 });
  }

  const isBusiness = typeof vatNumber === "string" && vatNumber.trim().length >= 4;
  const effectiveCountry = isBusiness ? "OTHER" : (isOutsideEU ? "OTHER" : normalizedCountry);
  // Addon: generiek (addOnPriceInCents) of legacy benjiAddon vlag
  const addonPrice = typeof addOnPriceInCents === "number" && addOnPriceInCents > 0
    ? addOnPriceInCents
    : benjiAddon === true ? 1000 : 0;
  const addonType = addonPrice > 0
    ? (typeof addOnType === "string" && addOnType ? addOnType : benjiAddon === true ? "benji_access" : "")
    : "";
  const addonAccessDays = typeof addOnAccessDays === "number" ? addOnAccessDays : 30;

  const totalPrice = product.priceInCents + addonPrice;
  const vat = calculateVat(totalPrice, effectiveCountry);
  const invoiceNumber = generateInvoiceNumber();

  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalPrice,
    currency: "eur",
    metadata: {
      slug,
      productName: product.name,
      subscriptionType: product.subscriptionType,
      email: "",
      name: "",
      invoice_number: invoiceNumber,
      country_code: normalizedCountry,
      vat_rate: String(vat.vatRate),
      vat_amount_cents: String(vat.vatAmount),
      base_price_cents: String(vat.basePrice),
      ...(isBusiness && {
        is_business: "true",
        vat_number: vatNumber.trim(),
      }),
      ...(addonType && {
        addon: addonType,
        addon_access_days: String(addonAccessDays),
      }),
    },
  });

  return NextResponse.json({ clientSecret: paymentIntent.client_secret, invoiceNumber });
}
