import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { checkAdmin } from "./adminAuth";

/** Alleen goedgekeurde reviews zichtbaar op homepage */
export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db
      .query("testimonials")
      .withIndex("by_active_order", (q) => q.eq("isActive", true))
      .collect();
    return items
      .filter((i) => !i.status || i.status === "approved")
      .sort((a, b) => a.order - b.order);
  },
});

/** Admin: alle reviews inclusief pending */
export const list = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const items = await ctx.db.query("testimonials").collect();
    return items.sort((a, b) => {
      // Pending bovenaan
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (b.status === "pending" && a.status !== "pending") return 1;
      return a.order - b.order;
    });
  },
});

/** Admin: maak nieuwe review aan */
export const create = mutation({
  args: {
    adminToken: v.string(),
    name: v.string(),
    quote: v.string(),
    stars: v.number(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const now = Date.now();
    return await ctx.db.insert("testimonials", {
      name: args.name,
      quote: args.quote,
      stars: Math.min(5, Math.max(1, Math.round(args.stars))),
      order: args.order,
      isActive: true,
      status: "approved",
      createdAt: now,
      updatedAt: now,
    });
  },
});

/** Admin: update review */
export const update = mutation({
  args: {
    adminToken: v.string(),
    id: v.id("testimonials"),
    name: v.optional(v.string()),
    quote: v.optional(v.string()),
    stars: v.optional(v.number()),
    order: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    status: v.optional(v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"))),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const { id, adminToken: _token, ...updates } = args;
    const patch = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    if (patch.stars) patch.stars = Math.min(5, Math.max(1, Math.round(patch.stars as number)));
    await ctx.db.patch(id, { ...patch, updatedAt: Date.now() });
    return id;
  },
});

/** Admin: goedkeuren (zet actief + approved) */
export const approve = mutation({
  args: { adminToken: v.string(), id: v.id("testimonials") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    // Bepaal volgorde: na laatste actieve item
    const active = await ctx.db
      .query("testimonials")
      .withIndex("by_active_order", (q) => q.eq("isActive", true))
      .collect();
    const maxOrder = active.length > 0 ? Math.max(...active.map((i) => i.order)) : -1;
    await ctx.db.patch(args.id, {
      isActive: true,
      status: "approved",
      order: maxOrder + 1,
      updatedAt: Date.now(),
    });
  },
});

/** Admin: afwijzen */
export const reject = mutation({
  args: { adminToken: v.string(), id: v.id("testimonials") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    await ctx.db.patch(args.id, { isActive: false, status: "rejected", updatedAt: Date.now() });
  },
});

/** Admin: verwijderen */
export const remove = mutation({
  args: { adminToken: v.string(), id: v.id("testimonials") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    await ctx.db.delete(args.id);
    return args.id;
  },
});

/** Publiek: klant dient review in — wacht op goedkeuring */
export const submitPending = mutation({
  args: {
    name: v.string(),
    quote: v.string(),
    stars: v.number(),
  },
  handler: async (ctx, args) => {
    if (!args.name.trim() || !args.quote.trim()) throw new Error("Naam en review zijn verplicht");
    if (args.name.trim().length > 60) throw new Error("Naam te lang");
    if (args.quote.trim().length > 500) throw new Error("Review te lang (max 500 tekens)");
    const now = Date.now();
    return await ctx.db.insert("testimonials", {
      name: args.name.trim(),
      quote: args.quote.trim(),
      stars: Math.min(5, Math.max(1, Math.round(args.stars))),
      order: 999,
      isActive: false,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
  },
});
