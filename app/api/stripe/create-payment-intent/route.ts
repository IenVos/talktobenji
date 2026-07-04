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
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe niet geconfigureerd" }, { status: 500 });
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-02-24.acacia" });
  const {
    slug, email, name, paymentIntentId, optIn,
    isGift, recipientEmail, recipientName, personalMessage, deliveryMethod, scheduledSendDate,
    giftVariantPriceInCents, giftVariantBillingPeriod, giftVariantLabel,
    countryCode, vatNumber, benjiAddon,
    addOnPriceInCents, addOnType,
    source, sessionId,
  } = await req.json();

  if (!slug) {
    return NextResponse.json({ error: "Slug ontbreekt" }, { status: 400 });
  }

  // Update bestaande PaymentIntent met e-mail/naam (bij formulierindiening)
  if (paymentIntentId && email) {
    // Cadeau-variant: prijs en toegangsduur NOOIT uit de browser vertrouwen. We
    // zoeken de gekozen variant op in het product (Convex) en gebruiken díe waarden,
    // zodat niemand via een aangepast verzoek een goedkopere cadeauprijs kan afdwingen.
    let variant: { label?: string; priceInCents: number; billingPeriod: string; accessDays: number } | null = null;
    const wilVariant =
      isGift &&
      (!!giftVariantLabel ||
        !!giftVariantBillingPeriod ||
        (typeof giftVariantPriceInCents === "number" && giftVariantPriceInCents > 0));
    if (wilVariant) {
      const giftProduct = slug ? await convex.query(api.checkoutProducts.getBySlug, { slug }).catch(() => null) : null;
      const varianten: any[] = giftProduct?.giftVariants ?? [];
      variant =
        varianten.find((v) => giftVariantLabel && v.label === giftVariantLabel) ??
        varianten.find((v) => giftVariantBillingPeriod && v.billingPeriod === giftVariantBillingPeriod) ??
        null;
      if (!variant) {
        return NextResponse.json({ error: "Ongeldige cadeau-variant" }, { status: 400 });
      }
    }

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
          ...(variant && {
            giftBillingPeriod: variant.billingPeriod,
            giftAccessDays: String(variant.accessDays),
            giftLabel: variant.label || "",
          }),
        }),
      },
    };
    // Cadeau met variant: bedrag naar de serverside prijs van die variant.
    if (variant) {
      updateParams.amount = variant.priceInCents;
    }
    await stripe.paymentIntents.update(paymentIntentId, updateParams);
    return NextResponse.json({ success: true });
  }

  // Rate limit alleen op het aanmaken van een NIEUWE PaymentIntent (niet op de
  // metadata-updates hierboven). Een gewone bezoeker die de pagina een paar keer
  // herlaadt zit zo niet meteen op slot; het blokkeert wel bulk-misbruik.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed, retryAfterMs } = rateLimit(`stripe:${ip}`, { maxAttempts: 30, windowMs: 60 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json(
      { error: `Te veel verzoeken. ${retryAfterMessage(retryAfterMs)}` },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
    );
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
  // Addon (kassakoopje): de browser mag alleen SIGNALEREN dat het is aangevinkt.
  // Prijs, type en toegangsduur halen we uit het product in Convex, zodat niemand
  // via een aangepast verzoek een goedkoper bedrag kan afdwingen.
  const wilAddon =
    benjiAddon === true ||
    (typeof addOnPriceInCents === "number" && addOnPriceInCents > 0) ||
    (typeof addOnType === "string" && addOnType.length > 0);
  const addonUitProduct =
    product.addOnEnabled === true &&
    typeof product.addOnPriceInCents === "number" &&
    product.addOnPriceInCents > 0;
  const addonPrice = !wilAddon
    ? 0
    : addonUitProduct
      ? product.addOnPriceInCents!
      : benjiAddon === true
        ? 1000 // legacy: /niet-alleen-nl/betalen zonder addon-config op het product
        : 0;
  const addonType = addonPrice > 0
    ? (addonUitProduct ? (product.addOnType ?? "") : "benji_access")
    : "";
  const addonAccessDays = addonPrice > 0
    ? (addonUitProduct ? (product.addOnAccessDays ?? 30) : 30)
    : 30;

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

  // "Checkout bereikt" loggen (server-side = niet door de browser te blokkeren).
  // Fire-and-forget: mag de betaalflow nooit ophouden of laten falen.
  if (typeof source === "string" && source) {
    convex
      .mutation(api.siteAnalytics.trackCheckoutReach, {
        source,
        slug,
        sessionId: typeof sessionId === "string" ? sessionId : "",
      })
      .catch(() => {});
  }

  return NextResponse.json({ clientSecret: paymentIntent.client_secret, invoiceNumber });
}
