import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================================================
// SUBSCRIPTIONS BEHEER (queries + mutations, GEEN "use node")
// ============================================================================

async function requireAuth(ctx: any, userId: string) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Niet ingelogd");
  if (identity.subject !== userId) throw new Error("Geen toegang");
}

/** Sla een push subscription op voor een gebruiker */
export const subscribe = mutation({
  args: {
    userId: v.string(),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.userId);
    // Check of deze user+endpoint combinatie al bestaat
    const allForEndpoint = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .collect();

    const existingForUser = allForEndpoint.find((s) => s.userId === args.userId);

    if (existingForUser) {
      // Update bestaande subscription voor deze user
      await ctx.db.patch(existingForUser._id, {
        p256dh: args.p256dh,
        auth: args.auth,
      });
      return existingForUser._id;
    }

    // Maak nieuwe subscription aan (ook als andere users dezelfde endpoint hebben)
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
    await requireAuth(ctx, args.userId);
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
    await requireAuth(ctx, args.userId);
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

    // Haal user info op via db.get (directe ID lookup)
    const results = [];
    for (const entry of userMap.values()) {
      let name = "Onbekend";
      let email = "";
      try {
        const user = await ctx.db.get(entry.userId as any);
        if (user) {
          name = (user as any).name || "Onbekend";
          email = (user as any).email || "";
        }
      } catch {
        // userId is geen geldig document ID, probeer via email index
        const user = await ctx.db
          .query("users")
          .withIndex("email", (q) => q.eq("email", entry.userId))
          .first();
        if (user) {
          name = user.name || "Onbekend";
          email = user.email || "";
        }
      }
      results.push({
        userId: entry.userId,
        name,
        email,
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
    await requireAuth(ctx, args.userId);
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
    await requireAuth(ctx, args.userId);
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
    recipients: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("pushNotifications", {
      title: args.title,
      body: args.body,
      url: args.url,
      sentBy: "admin",
      sentAt: Date.now(),
      recipientCount: args.recipientCount,
      recipients: args.recipients,
    });
  },
});

/** Haal alle userIds op die ooit een notificatie hebben ontvangen */
export const getAllNotifiedUserIds = query({
  args: {},
  handler: async (ctx) => {
    const allNotifs = await ctx.db.query("pushNotifications").collect();
    const userIds = new Set<string>();
    for (const n of allNotifs) {
      if (n.recipients) {
        for (const uid of n.recipients) {
          userIds.add(uid);
        }
      }
    }
    return Array.from(userIds);
  },
});

/** Verwijder een notificatie (admin) */
export const deleteNotification = mutation({
  args: {
    notificationId: v.id("pushNotifications"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.notificationId);
  },
});
