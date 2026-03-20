import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

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
    const { email, name, subscriptionType, slug } = pi.metadata;

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
    }
  }

  return NextResponse.json({ received: true });
}
