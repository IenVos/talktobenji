import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Tekent een verwerkt Stripe-webhookevent af en zegt of het al eerder is verwerkt.
 * Stripe kan eenzelfde event meer dan eens afleveren (retries / at-least-once).
 * De webhook roept dit aan vóór de verwerking; is `alreadyProcessed` true, dan slaat
 * de webhook de rest over. Zo geen dubbele mails, cadeaucodes of activaties.
 *
 * Beveiligd met dezelfde webhook-secret als de andere betaal-mutations, zodat alleen
 * de server-side betaalflow dit kan aanroepen.
 */
export const markProcessed = mutation({
  args: { webhookSecret: v.string(), eventId: v.string() },
  handler: async (ctx, args) => {
    if (args.webhookSecret !== (process.env.STRIPE_INTERNAL_SECRET ?? process.env.KENNISSHOP_WEBHOOK_SECRET)) {
      throw new Error("Ongeldig webhook secret");
    }
    const bestaand = await ctx.db
      .query("processedStripeEvents")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .first();
    if (bestaand) return { alreadyProcessed: true };

    await ctx.db.insert("processedStripeEvents", {
      eventId: args.eventId,
      processedAt: Date.now(),
    });
    return { alreadyProcessed: false };
  },
});
