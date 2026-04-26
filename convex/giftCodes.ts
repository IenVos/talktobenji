import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { checkAdmin } from "./adminAuth";

export const createGiftCode = mutation({
  args: {
    webhookSecret: v.string(),
    code: v.string(),
    slug: v.string(),
    productName: v.string(),
    subscriptionType: v.string(),
    billingPeriod: v.optional(v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("yearly"))),
    accessDays: v.optional(v.number()),
    pricePaid: v.optional(v.number()),
    giverName: v.string(),
    giverEmail: v.string(),
    recipientEmail: v.optional(v.string()),
    personalMessage: v.optional(v.string()),
    deliveryMethod: v.union(v.literal("direct"), v.literal("manual")),
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
      personalMessage: args.personalMessage,
      deliveryMethod: args.deliveryMethod,
      status: "pending",
      paymentIntentId: args.paymentIntentId,
      createdAt: Date.now(),
    });
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

