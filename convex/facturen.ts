/**
 * Oplopende factuurnummers. Het nummer wordt toegekend zodra een betaling slaagt
 * (aangeroepen vanuit de Stripe-webhook), niet bij het aanmaken van een betaalsessie.
 * Zo blijft de nummering doorlopend zonder gaten van niet-afgeronde checkouts.
 * Idempotent per betaling: dezelfde paymentIntentId krijgt altijd hetzelfde nummer,
 * ook als de webhook opnieuw binnenkomt.
 */
import { mutation } from "./_generated/server";
import { v } from "convex/values";

function secretOk(secret: string): boolean {
  return secret === (process.env.STRIPE_INTERNAL_SECRET ?? process.env.KENNISSHOP_WEBHOOK_SECRET);
}

export const wijsFactuurnummerToe = mutation({
  args: { webhookSecret: v.string(), paymentIntentId: v.string() },
  handler: async (ctx, args) => {
    if (!secretOk(args.webhookSecret)) throw new Error("Geen toegang");

    // Al toegekend? Hergebruik (idempotent bij webhook-herhaling).
    const bestaand = await ctx.db
      .query("facturen")
      .withIndex("by_paymentIntent", (q) => q.eq("paymentIntentId", args.paymentIntentId))
      .unique();
    if (bestaand) return bestaand.nummer;

    const jaar = new Date().getFullYear();
    const teller = await ctx.db
      .query("factuurTeller")
      .withIndex("by_jaar", (q) => q.eq("jaar", jaar))
      .unique();

    let volgende: number;
    if (teller) {
      volgende = teller.laatste + 1;
      await ctx.db.patch(teller._id, { laatste: volgende });
    } else {
      volgende = 1;
      await ctx.db.insert("factuurTeller", { jaar, laatste: 1 });
    }

    const nummer = `${jaar}-${String(volgende).padStart(4, "0")}`;
    await ctx.db.insert("facturen", {
      paymentIntentId: args.paymentIntentId,
      nummer,
      createdAt: Date.now(),
    });
    return nummer;
  },
});
