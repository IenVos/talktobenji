import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================================================
// SUBSCRIPTIONS BEHEER (queries + mutations, GEEN "use node")
// ============================================================================

/** Sla een push subscription op voor een gebruiker */
export const subscribe = mutation({
  args: {
    userId: v.string(),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        userId: args.userId,
        p256dh: args.p256dh,
        auth: args.auth,
      });
      return existing._id;
    }

    return await ctx.db.insert("pushSubscriptions", {
      userId: args.userId,
      endpoint: args.endpoint,
      p256dh: args.p256dh,
      auth: args.auth,
      createdAt: Date.now(),
    });
  },
});

/** Verwijder een push subscription (uitschakelen) */
export const unsubscribe = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const subs = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    for (const sub of subs) {
      await ctx.db.delete(sub._id);
    }
  },
});

/** Check of een gebruiker push notificaties heeft ingeschakeld */
export const isSubscribed = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const sub = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    return !!sub;
  },
});

/** Haal het totaal aantal subscribers op (voor admin) */
export const getSubscriberCount = query({
  args: {},
  handler: async (ctx) => {
    const subs = await ctx.db.query("pushSubscriptions").collect();
    const uniqueUsers = new Set(subs.map((s) => s.userId));
    return uniqueUsers.size;
  },
});

/** Haal alle subscribers op met naam/email (voor admin) */
export const listSubscribers = query({
  args: {},
  handler: async (ctx) => {
    const subs = await ctx.db.query("pushSubscriptions").collect();
    // Groepeer per userId (kan meerdere devices hebben)
    const userMap = new Map<string, { userId: string; deviceCount: number; subscribedAt: number }>();
    for (const sub of subs) {
      const existing = userMap.get(sub.userId);
      if (existing) {
        existing.deviceCount++;
        if (sub.createdAt < existing.subscribedAt) existing.subscribedAt = sub.createdAt;
      } else {
        userMap.set(sub.userId, { userId: sub.userId, deviceCount: 1, subscribedAt: sub.createdAt });
      }
    }

    // Haal user info op
    const results = [];
    for (const entry of userMap.values()) {
      const user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("_id"), entry.userId))
        .first();
      results.push({
        userId: entry.userId,
        name: user?.name || "Onbekend",
        email: user?.email || "",
        deviceCount: entry.deviceCount,
        subscribedAt: entry.subscribedAt,
      });
    }
    return results;
  },
});

/** Haal alle verstuurde notificaties op (voor admin) */
export const listSentNotifications = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("pushNotifications")
      .withIndex("by_sent")
      .order("desc")
      .take(50);
  },
});

/** Interne query: haal alle subscriptions op (voor de action) */
export const getAllSubscriptions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("pushSubscriptions").collect();
  },
});

/** Interne mutation: verwijder verlopen subscriptions */
export const removeExpiredSubscriptions = mutation({
  args: {
    endpoints: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    for (const endpoint of args.endpoints) {
      const sub = await ctx.db
        .query("pushSubscriptions")
        .withIndex("by_endpoint", (q) => q.eq("endpoint", endpoint))
        .first();
      if (sub) {
        await ctx.db.delete(sub._id);
      }
    }
  },
});

// ============================================================================
// IN-APP NOTIFICATIES (voor account bell icon)
// ============================================================================

/** Haal notificaties op voor een gebruiker + ongelezen count */
export const getNotificationsForUser = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Haal lastSeenNotificationsAt op uit preferences
    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    const lastSeen = prefs?.lastSeenNotificationsAt ?? 0;

    // Haal recente notificaties op
    const notifications = await ctx.db
      .query("pushNotifications")
      .withIndex("by_sent")
      .order("desc")
      .take(20);

    const unreadCount = notifications.filter((n) => n.sentAt > lastSeen).length;

    return { notifications, unreadCount };
  },
});

/** Markeer notificaties als gelezen */
export const markNotificationsRead = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (prefs) {
      await ctx.db.patch(prefs._id, { lastSeenNotificationsAt: Date.now() });
    } else {
      await ctx.db.insert("userPreferences", {
        userId: args.userId,
        lastSeenNotificationsAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});

/** Interne mutation: sla verstuurde notificatie op */
export const recordNotification = mutation({
  args: {
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
    recipientCount: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("pushNotifications", {
      title: args.title,
      body: args.body,
      url: args.url,
      sentBy: "admin",
      sentAt: Date.now(),
      recipientCount: args.recipientCount,
    });
  },
});
