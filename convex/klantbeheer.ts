/**
 * Klantbeheer: zoeken, subscription wijzigen, data resetten.
 * Alleen bruikbaar vanuit het admin panel (adminToken check via context).
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/** Zoek klantinfo op basis van e-mailadres */
export const getCustomerByEmail = query({
  args: {
    adminToken: v.optional(v.string()),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    if (!email) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .unique();

    if (!user) return null;

    const userId = user._id.toString();

    const [subscription, preferences, notes, goals, memories, checkIns] =
      await Promise.all([
        ctx.db
          .query("userSubscriptions")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .first(),
        ctx.db
          .query("userPreferences")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .unique(),
        ctx.db
          .query("notes")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .collect(),
        ctx.db
          .query("goals")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .collect(),
        ctx.db
          .query("memories")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .collect(),
        ctx.db
          .query("checkInEntries")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .collect(),
      ]);

    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const usage = await ctx.db
      .query("conversationUsage")
      .withIndex("by_user_month", (q) =>
        q.eq("userId", userId).eq("month", month)
      )
      .first();

    return {
      userId,
      name: user.name,
      email: user.email,
      subscription: subscription ?? null,
      preferences: {
        hasAccentColor: !!preferences?.accentColor,
        hasBackground: !!preferences?.backgroundImageStorageId,
        hasUserContext: !!preferences?.userContext,
      },
      counts: {
        notes: notes.length,
        goals: goals.length,
        memories: memories.length,
        checkIns: checkIns.length,
        conversationsThisMonth: usage?.conversationCount ?? 0,
      },
    };
  },
});

/** Wijzig abonnement van een klant */
export const setCustomerSubscription = mutation({
  args: {
    adminToken: v.optional(v.string()),
    email: v.string(),
    subscriptionType: v.union(
      v.literal("free"),
      v.literal("trial"),
      v.literal("uitgebreid"),
      v.literal("alles_in_1")
    ),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    const now = Date.now();

    const sub = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!sub) throw new Error("Geen subscription gevonden voor dit e-mailadres");

    if (args.subscriptionType === "trial") {
      await ctx.db.patch(sub._id, {
        subscriptionType: "trial",
        status: "active",
        expiresAt: now + 7 * 24 * 60 * 60 * 1000,
        reminderDay5Sent: false,
        reminderDay7Sent: false,
        updatedAt: now,
      });
    } else {
      const { expiresAt: _exp, reminderDay5Sent: _r5, reminderDay7Sent: _r7, ...rest } = sub;
      await ctx.db.replace(sub._id, {
        ...rest,
        subscriptionType: args.subscriptionType,
        status: "active",
        updatedAt: now,
      });
    }

    return { success: true };
  },
});

/** Reset gesprekslimiet van de huidige maand */
export const resetConversationUsage = mutation({
  args: {
    adminToken: v.optional(v.string()),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .unique();

    if (!user) throw new Error("Gebruiker niet gevonden");

    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const usage = await ctx.db
      .query("conversationUsage")
      .withIndex("by_user_month", (q) =>
        q.eq("userId", user._id.toString()).eq("month", month)
      )
      .first();

    if (usage) {
      await ctx.db.patch(usage._id, { conversationCount: 0 });
    }

    return { success: true };
  },
});

/** Reset accentkleur en achtergrondafbeelding (behoudt 'Jouw verhaal') */
export const resetCustomerPreferences = mutation({
  args: {
    adminToken: v.optional(v.string()),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .unique();

    if (!user) throw new Error("Gebruiker niet gevonden");

    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id.toString()))
      .unique();

    if (!prefs) return { success: true, changed: false };

    const { accentColor: _ac, backgroundImageStorageId: _bg, ...rest } = prefs;
    await ctx.db.replace(prefs._id, { ...rest, updatedAt: Date.now() });

    return { success: true, changed: true };
  },
});

/** Wijzig e-mailadres van een klant (users + credentials + userSubscriptions) */
export const changeCustomerEmail = mutation({
  args: {
    adminToken: v.optional(v.string()),
    currentEmail: v.string(),
    newEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const current = args.currentEmail.toLowerCase().trim();
    const next = args.newEmail.toLowerCase().trim();

    if (!next || !next.includes("@")) throw new Error("Ongeldig e-mailadres");
    if (current === next) throw new Error("Nieuw e-mailadres is hetzelfde als het huidige");

    // Check of nieuw e-mailadres al in gebruik is
    const existing = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", next))
      .unique();
    if (existing) throw new Error("Dit e-mailadres is al in gebruik");

    // Update users
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", current))
      .unique();
    if (!user) throw new Error("Gebruiker niet gevonden");
    await ctx.db.patch(user._id, { email: next });

    // Update credentials
    const cred = await ctx.db
      .query("credentials")
      .withIndex("email", (q) => q.eq("email", current))
      .unique();
    if (cred) await ctx.db.patch(cred._id, { email: next });

    // Update userSubscriptions
    const sub = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_email", (q) => q.eq("email", current))
      .first();
    if (sub) await ctx.db.patch(sub._id, { email: next });

    return { success: true };
  },
});

/** Wis 'Jouw verhaal' (userContext) */
export const clearCustomerContext = mutation({
  args: {
    adminToken: v.optional(v.string()),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .unique();

    if (!user) throw new Error("Gebruiker niet gevonden");

    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id.toString()))
      .unique();

    if (!prefs || !prefs.userContext) return { success: true, changed: false };

    const { userContext: _uc, ...rest } = prefs;
    await ctx.db.replace(prefs._id, { ...rest, updatedAt: Date.now() });

    return { success: true, changed: true };
  },
});
