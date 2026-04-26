/**
 * Gift code actions — in aparte file om circulaire import met giftCodes.ts te vermijden.
 * giftCodes.ts exporteert internal mutations → giftActions.ts roept die aan via internal.*
 */
import { v } from "convex/values";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";

export const redeemGiftCode = action({
  args: {
    code: v.string(),
    recipientEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const gift = await ctx.runMutation(internal.giftCodes.markRedeemedInternal, {
      code: args.code,
      recipientEmail: args.recipientEmail,
    });

    // Activeer abonnement als account al bestaat; silently fail als dat niet zo is
    try {
      await ctx.runMutation(api.subscriptions.activateSubscriptionByEmail, {
        webhookSecret: process.env.KENNISSHOP_WEBHOOK_SECRET!,
        email: args.recipientEmail,
        subscriptionType: gift.subscriptionType,
        billingPeriod: gift.billingPeriod,
        accessDays: gift.accessDays,
        pricePaid: 0,
        paymentProvider: "gift",
      });
    } catch {
      // Account bestaat nog niet — abonnement wordt geactiveerd bij registratie
    }

    return gift;
  },
});
