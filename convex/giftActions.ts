/**
 * Gift code mutations — aparte file zodat giftCodes.ts schoon blijft.
 */
import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const redeemGiftCode = mutation({
  args: {
    code: v.string(),
    recipientEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const normalized = args.code.trim().toUpperCase();

    const gift = await ctx.db
      .query("giftCodes")
      .withIndex("by_code", (q) => q.eq("code", normalized))
      .first();

    if (!gift) throw new Error("Code niet gevonden");
    if (gift.status === "redeemed") throw new Error("Deze code is al gebruikt");

    await ctx.db.patch(gift._id, {
      status: "redeemed",
      redeemedByEmail: args.recipientEmail.trim().toLowerCase(),
      redeemedAt: Date.now(),
    });

    // Abonnement activeren als dit e-mailadres al een account heeft
    const emailLower = args.recipientEmail.trim().toLowerCase();
    const cred = await ctx.db
      .query("credentials")
      .withIndex("email", (q) => q.eq("email", emailLower))
      .unique();

    if (cred) {
      const now = Date.now();
      const accessDays = gift.accessDays ?? 365;
      const existing = await ctx.db
        .query("userSubscriptions")
        .withIndex("by_user", (q) => q.eq("userId", cred.userId.toString()))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          subscriptionType: gift.subscriptionType,
          billingPeriod: gift.billingPeriod,
          status: "active",
          startedAt: now,
          expiresAt: now + accessDays * 24 * 60 * 60 * 1000,
          pricePaid: 0,
          paymentProvider: "gift",
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("userSubscriptions", {
          userId: cred.userId.toString(),
          email: emailLower,
          subscriptionType: gift.subscriptionType,
          billingPeriod: gift.billingPeriod,
          status: "active",
          startedAt: now,
          expiresAt: now + accessDays * 24 * 60 * 60 * 1000,
          pricePaid: 0,
          paymentProvider: "gift",
          updatedAt: now,
        });
      }
    }
    // Geen account → activatie volgt automatisch bij registratie via credentials.ts

    return {
      productName: gift.productName,
      giverName: gift.giverName,
      personalMessage: gift.personalMessage,
    };
  },
});
