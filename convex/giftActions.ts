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

    // Als de code gekoppeld is aan een specifiek e-mailadres, controleer dat
    if (gift.recipientEmail) {
      if (gift.recipientEmail.toLowerCase() !== args.recipientEmail.trim().toLowerCase()) {
        throw new Error("Deze code is voor een ander e-mailadres bestemd.");
      }
    }

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
      const accessDays = gift.accessDays && gift.accessDays > 0 ? gift.accessDays : 30;
      const needsBenji = gift.subscriptionType === "alles_in_1" || gift.subscriptionType === "niet_alleen_plus_benji";
      const needsNietAlleen = gift.subscriptionType === "niet_alleen" || gift.subscriptionType === "niet_alleen_plus_benji";

      // Benji subscription activeren
      if (needsBenji) {
        const existing = await ctx.db
          .query("userSubscriptions")
          .withIndex("by_user", (q) => q.eq("userId", cred.userId.toString()))
          .first();
        const subData = {
          userId: cred.userId.toString(),
          email: emailLower,
          subscriptionType: "alles_in_1",
          billingPeriod: gift.billingPeriod,
          status: "active" as const,
          startedAt: now,
          expiresAt: now + accessDays * 24 * 60 * 60 * 1000,
          pricePaid: 0,
          paymentProvider: "gift",
          updatedAt: now,
        };
        if (existing) {
          await ctx.db.patch(existing._id, subData);
        } else {
          await ctx.db.insert("userSubscriptions", subData);
        }
      }

      // Niet Alleen profiel aanmaken
      if (needsNietAlleen) {
        const user = await ctx.db.get(cred.userId);
        const bestaandProfiel = await ctx.db
          .query("nietAlleenProfiles")
          .withIndex("by_email", (q) => q.eq("email", emailLower))
          .first();
        if (!bestaandProfiel) {
          await ctx.db.insert("nietAlleenProfiles", {
            userId: emailLower,
            email: emailLower,
            naam: user?.name ?? emailLower.split("@")[0],
            startDatum: now,
            dagPrompts: [],
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      // Legacy: niet_alleen had vroeger ook een eigen subscription record
      if (gift.subscriptionType === "niet_alleen" && !needsBenji) {
        const existing = await ctx.db
          .query("userSubscriptions")
          .withIndex("by_user", (q) => q.eq("userId", cred.userId.toString()))
          .first();
        if (existing && existing.subscriptionType !== "alles_in_1") {
          // Niet overschrijven als ze al volledige toegang hebben
        }
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
