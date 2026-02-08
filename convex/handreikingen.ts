/**
 * Handreikingen – admin beheert, klant ziet.
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    if (args.activeOnly) {
      return await ctx.db
        .query("handreikingenItems")
        .withIndex("by_active_order", (q) => q.eq("isActive", true))
        .collect();
    }
    return await ctx.db.query("handreikingenItems").order("asc").collect();
  },
});

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db
      .query("handreikingenItems")
      .withIndex("by_active_order", (q) => q.eq("isActive", true))
      .collect();
    return items.sort((a, b) => a.order - b.order);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("handreikingenItems", {
      ...args,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("handreikingenItems"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    order: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Item niet gevonden");
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(id, { ...filtered, updatedAt: Date.now() });
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("handreikingenItems") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});
