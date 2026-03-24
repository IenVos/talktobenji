import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe niet geconfigureerd" }, { status: 500 });
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-02-24.acacia" });
  const { slug, email, name, paymentIntentId } = await req.json();

  if (!slug) {
    return NextResponse.json({ error: "Slug ontbreekt" }, { status: 400 });
  }

  // Update bestaande PaymentIntent met e-mail/naam (bij formulierindiening)
  if (paymentIntentId && email) {
    await stripe.paymentIntents.update(paymentIntentId, {
      metadata: { email, name: name || "" },
      receipt_email: email,
    });
    return NextResponse.json({ success: true });
  }

  // Haal product op uit Convex
  const product = await convex.query(api.checkoutProducts.getBySlug, { slug });
  if (!product || !product.isLive) {
    return NextResponse.json({ error: "Product niet gevonden" }, { status: 404 });
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: product.priceInCents,
    currency: "eur",
    metadata: {
      slug,
      productName: product.name,
      subscriptionType: product.subscriptionType,
      email: "",
      name: "",
    },
  });

  return NextResponse.json({ clientSecret: paymentIntent.client_secret });
}
