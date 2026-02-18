/**
 * Subscription & feature access management
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Admin email met volledige toegang
const ADMIN_EMAIL = "annadelapierre@icloud.com";

/**
 * Haal subscription info op voor een user
 */
export const getUserSubscription = query({
  args: {
    userId: v.string(),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Admin krijgt altijd volledige toegang
    if (args.email === ADMIN_EMAIL) {
      return {
        subscriptionType: "alles_in_1" as const,
        status: "active" as const,
        isAdmin: true,
        trialDaysLeft: null as number | null,
      };
    }

    const subscription = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!subscription) {
      // Geen subscription = free tier
      return {
        subscriptionType: "free" as const,
        status: "active" as const,
        isAdmin: false,
        trialDaysLeft: null as number | null,
      };
    }

    const trialDaysLeft =
      subscription.subscriptionType === "trial" && subscription.expiresAt
        ? Math.max(0, Math.ceil((subscription.expiresAt - Date.now()) / (1000 * 60 * 60 * 24)))
        : null;

    return {
      ...subscription,
      isAdmin: false,
      trialDaysLeft,
    };
  },
});

/**
 * Check of user toegang heeft tot een feature
 */
export const hasFeatureAccess = query({
  args: {
    userId: v.string(),
    email: v.optional(v.string()),
    feature: v.union(
      v.literal("unlimited_conversations"),
      v.literal("check_ins"),
      v.literal("goals"),
      v.literal("reflections"),
      v.literal("memories"),
      v.literal("inspiration"),
      v.literal("handreikingen"),
      v.literal("personalization")
    ),
  },
  handler: async (ctx, args) => {
    // Admin krijgt altijd toegang
    if (args.email === ADMIN_EMAIL) {
      return true;
    }

    const subscription = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const subType = subscription?.subscriptionType || "free";
    const isActive = subscription?.status === "active" || !subscription;

    if (!isActive) return false;

    // Trial verlopen → geen toegang
    if (subType === "trial" && subscription?.expiresAt && subscription.expiresAt < Date.now()) {
      return false;
    }

    // Feature matrix
    const features: Record<string, string[]> = {
      free: [],
      trial: [
        "unlimited_conversations",
        "check_ins",
        "goals",
        "reflections",
        "memories",
        "inspiration",
        "handreikingen",
        "personalization",
      ],
      uitgebreid: [
        "unlimited_conversations",
        "check_ins",
        "goals",
        "reflections",
        "personalization",
      ],
      alles_in_1: [
        "unlimited_conversations",
        "check_ins",
        "goals",
        "reflections",
        "memories",
        "inspiration",
        "handreikingen",
        "personalization",
      ],
    };

    return features[subType]?.includes(args.feature) ?? false;
  },
});

/**
 * Tel aantal gesprekken deze maand voor een user
 */
export const getConversationCount = query({
  args: {
    userId: v.string(),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Admin heeft geen limiet
    if (args.email === ADMIN_EMAIL) {
      return {
        count: 0,
        limit: null,
        hasUnlimited: true,
      };
    }

    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const usage = await ctx.db
      .query("conversationUsage")
      .withIndex("by_user_month", (q) =>
        q.eq("userId", args.userId).eq("month", month)
      )
      .first();

    const count = usage?.conversationCount || 0;

    // Check subscription voor limiet
    const subscription = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const subType = subscription?.subscriptionType || "free";
    const isActiveTrial =
      subType === "trial" &&
      (!subscription?.expiresAt || subscription.expiresAt >= Date.now());

    if (subType === "uitgebreid" || subType === "alles_in_1" || isActiveTrial) {
      return {
        count,
        limit: null,
        hasUnlimited: true,
      };
    }

    // Free tier: 10 gesprekken per maand
    return {
      count,
      limit: 10,
      hasUnlimited: false,
    };
  },
});

/**
 * Increment conversation count (call dit bij elke nieuwe conversatie)
 */
export const incrementConversationCount = mutation({
  args: {
    userId: v.string(),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Admin hoeft niet geteld te worden
    if (args.email === ADMIN_EMAIL) {
      return;
    }

    const now = Date.now();
    const month = `${new Date(now).getFullYear()}-${String(new Date(now).getMonth() + 1).padStart(2, "0")}`;

    const existing = await ctx.db
      .query("conversationUsage")
      .withIndex("by_user_month", (q) =>
        q.eq("userId", args.userId).eq("month", month)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        conversationCount: existing.conversationCount + 1,
        lastConversationAt: now,
      });
    } else {
      await ctx.db.insert("conversationUsage", {
        userId: args.userId,
        month,
        conversationCount: 1,
        lastConversationAt: now,
        createdAt: now,
      });
    }
  },
});


/**
 * Maak of update subscription (voor admin of na betaling)
 */
export const upsertSubscription = mutation({
  args: {
    userId: v.string(),
    email: v.string(),
    subscriptionType: v.union(
      v.literal("free"),
      v.literal("uitgebreid"),
      v.literal("alles_in_1")
    ),
    billingPeriod: v.optional(v.union(v.literal("monthly"), v.literal("yearly"))),
    externalSubscriptionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const existing = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const subscriptionData = {
      userId: args.userId,
      email: args.email,
      subscriptionType: args.subscriptionType,
      billingPeriod: args.billingPeriod,
      status: "active" as const,
      startedAt: existing?.startedAt || now,
      externalSubscriptionId: args.externalSubscriptionId,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, subscriptionData);
      return existing._id;
    }

    return await ctx.db.insert("userSubscriptions", subscriptionData);
  },
});
