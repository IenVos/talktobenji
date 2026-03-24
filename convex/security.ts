import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const KEEP_DAYS = 30; // Bewaar events 30 dagen

// ── Loggen van beveiligingsgebeurtenissen (server-side via secret) ──
export const logEvent = mutation({
  args: {
    secret: v.string(),
    type: v.union(
      v.literal("failed_login"),
      v.literal("login_success"),
      v.literal("rate_limited"),
      v.literal("suspicious_activity"),
      v.literal("admin_action")
    ),
    ip: v.string(),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const expectedSecret = process.env.ADMIN_SESSION_SECRET;
    if (!expectedSecret || args.secret !== expectedSecret) {
      throw new Error("Unauthorized");
    }

    await ctx.db.insert("securityEvents", {
      type: args.type,
      ip: args.ip,
      timestamp: Date.now(),
      details: args.details,
    });

    // Ruim oude events op (ouder dan 30 dagen)
    const cutoff = Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000;
    const old = await ctx.db
      .query("securityEvents")
      .withIndex("by_timestamp", (q) => q.lt("timestamp", cutoff))
      .take(50);
    for (const e of old) await ctx.db.delete(e._id);
  },
});

// ── Recente events ophalen (alleen admin) ──
export const getRecentEvents = query({
  args: {
    adminToken: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Valideer admin sessie
    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_token", (q) => q.eq("token", args.adminToken))
      .first();
    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Unauthorized");
    }

    const limit = args.limit ?? 50;
    const events = await ctx.db
      .query("securityEvents")
      .withIndex("by_timestamp")
      .order("desc")
      .take(limit);

    return events;
  },
});

// ── Samenvatting voor badge in navigatie ──
export const getAlertCount = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_token", (q) => q.eq("token", args.adminToken))
      .first();
    if (!session || session.expiresAt < Date.now()) return 0;

    const since = Date.now() - 60 * 60 * 1000; // Laatste uur
    const recent = await ctx.db
      .query("securityEvents")
      .withIndex("by_timestamp", (q) => q.gt("timestamp", since))
      .collect();

    // Tel alleen mislukte logins en rate limiting (niet succesvolle logins)
    return recent.filter(
      (e) => e.type === "failed_login" || e.type === "rate_limited"
    ).length;
  },
});
