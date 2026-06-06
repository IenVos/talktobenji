import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { addToMailerLite } from "@/lib/mailerlite";
import { rateLimit, retryAfterMessage } from "@/lib/rate-limit";

/**
 * Nieuwsbrief-opt-in vanaf de bedankt-pagina (na de betaling).
 * Het e-mailadres halen we uit de PaymentIntent-metadata (server-side), zodat we
 * geen door de browser opgegeven adres hoeven te vertrouwen.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed, retryAfterMs } = rateLimit(`newsletter:${ip}`, { maxAttempts: 15, windowMs: 60 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json(
      { error: `Te veel verzoeken. ${retryAfterMessage(retryAfterMs)}` },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe niet geconfigureerd" }, { status: 500 });
  }
  const mailerLiteGroep = process.env.MAILERLITE_GROUP_GRATIS;
  if (!mailerLiteGroep) {
    return NextResponse.json({ error: "Nieuwsbrief niet geconfigureerd" }, { status: 500 });
  }

  const { paymentIntentId } = await req.json().catch(() => ({}));
  if (!paymentIntentId || typeof paymentIntentId !== "string") {
    return NextResponse.json({ error: "Betaling onbekend" }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-02-24.acacia" });

  let email = "";
  let name = "";
  try {
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    // Alleen geslaagde betalingen mogen een opt-in opleveren
    if (pi.status !== "succeeded") {
      return NextResponse.json({ error: "Betaling niet voltooid" }, { status: 400 });
    }
    email = (pi.metadata?.email ?? "").trim();
    name = (pi.metadata?.name ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Betaling niet gevonden" }, { status: 404 });
  }

  if (!email) {
    return NextResponse.json({ error: "Geen e-mailadres bij deze betaling" }, { status: 400 });
  }

  const ok = await addToMailerLite({
    email,
    name,
    groups: [mailerLiteGroep],
    context: "bedankt-optin",
  });

  if (!ok) {
    return NextResponse.json({ error: "Aanmelden mislukt, probeer het later opnieuw." }, { status: 502 });
  }
  return NextResponse.json({ success: true });
}
