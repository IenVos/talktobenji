import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { checkAdmin } from "./adminAuth";

export const createGiftCode = mutation({
  args: {
    webhookSecret: v.string(),
    code: v.string(),
    slug: v.string(),
    productName: v.string(),
    subscriptionType: v.string(),
    billingPeriod: v.optional(v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("half_yearly"), v.literal("yearly"))),
    accessDays: v.optional(v.number()),
    pricePaid: v.optional(v.number()),
    giverName: v.string(),
    giverEmail: v.string(),
    recipientEmail: v.optional(v.string()),
    recipientName: v.optional(v.string()),
    personalMessage: v.optional(v.string()),
    deliveryMethod: v.union(v.literal("direct"), v.literal("manual")),
    scheduledSendDate: v.optional(v.number()),
    paymentIntentId: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.webhookSecret !== process.env.KENNISSHOP_WEBHOOK_SECRET) {
      throw new Error("Unauthorized");
    }
    const existing = await ctx.db
      .query("giftCodes")
      .withIndex("by_payment_intent", (q) => q.eq("paymentIntentId", args.paymentIntentId))
      .first();
    if (existing) return existing._id;

    return await ctx.db.insert("giftCodes", {
      code: args.code,
      slug: args.slug,
      productName: args.productName,
      subscriptionType: args.subscriptionType,
      billingPeriod: args.billingPeriod,
      accessDays: args.accessDays,
      pricePaid: args.pricePaid,
      giverName: args.giverName,
      giverEmail: args.giverEmail,
      recipientEmail: args.recipientEmail,
      recipientName: args.recipientName,
      personalMessage: args.personalMessage,
      deliveryMethod: args.deliveryMethod,
      scheduledSendDate: args.scheduledSendDate,
      status: "pending",
      paymentIntentId: args.paymentIntentId,
      createdAt: Date.now(),
    });
  },
});

/** Admin: maak een testcode aan zonder Stripe (voor testen) */
export const adminCreateTestCode = mutation({
  args: {
    adminToken: v.string(),
    productName: v.string(),
    subscriptionType: v.string(),
    accessDays: v.number(),
    giverName: v.string(),
    giverEmail: v.string(),
    recipientEmail: v.optional(v.string()),
    personalMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const codeRaw =
      Math.random().toString(36).slice(2, 6).toUpperCase() +
      Math.random().toString(36).slice(2, 6).toUpperCase();
    const code = `TEST-${codeRaw.slice(0, 4)}-${codeRaw.slice(4, 8)}`;
    await ctx.db.insert("giftCodes", {
      code,
      slug: "test",
      productName: args.productName,
      subscriptionType: args.subscriptionType,
      billingPeriod: "yearly",
      accessDays: args.accessDays,
      pricePaid: 0,
      giverName: args.giverName,
      giverEmail: args.giverEmail,
      recipientEmail: args.recipientEmail,
      personalMessage: args.personalMessage,
      deliveryMethod: "manual",
      status: "pending",
      paymentIntentId: `test_${Date.now()}`,
      createdAt: Date.now(),
    });
    return code;
  },
});

export const listAll = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    return await ctx.db.query("giftCodes").order("desc").collect();
  },
});

export const markRedeemedAdmin = mutation({
  args: {
    adminToken: v.string(),
    id: v.id("giftCodes"),
    recipientEmail: v.string(),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    await ctx.db.patch(args.id, {
      status: "redeemed",
      redeemedByEmail: args.recipientEmail,
      redeemedAt: Date.now(),
    });
  },
});

export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("giftCodes")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();
  },
});

/** Admin: reset een testcode terug naar 'pending' zodat je hem opnieuw kunt testen */
export const adminResetTestCode = mutation({
  args: {
    adminToken: v.string(),
    id: v.id("giftCodes"),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const gc = await ctx.db.get(args.id);
    if (!gc) throw new Error("Code niet gevonden");
    if (!gc.code.startsWith("TEST-")) throw new Error("Alleen testcodes kunnen worden gereset");
    await ctx.db.patch(args.id, {
      status: "pending",
      redeemedByEmail: undefined,
      redeemedAt: undefined,
    });
  },
});

/** Intern: haal alle cadeau-codes op die vandaag verstuurd moeten worden */
export const getPendingScheduledGifts = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const all = await ctx.db.query("giftCodes").collect();
    return all.filter(
      (g) =>
        g.scheduledSendDate !== undefined &&
        g.scheduledSendDate <= now &&
        !g.recipientEmailSentAt &&
        g.recipientEmail &&
        g.deliveryMethod === "direct" &&
        g.status === "pending"
    );
  },
});

/** Intern: markeer dat de ontvanger-mail verstuurd is */
export const markRecipientEmailSent = internalMutation({
  args: { id: v.id("giftCodes") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { recipientEmailSentAt: Date.now() });
  },
});

