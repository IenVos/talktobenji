import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { checkAdmin } from "./adminAuth";

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db
      .query("testimonials")
      .withIndex("by_active_order", (q) => q.eq("isActive", true))
      .collect();
    return items.sort((a, b) => a.order - b.order);
  },
});

export const list = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const items = await ctx.db.query("testimonials").collect();
    return items.sort((a, b) => a.order - b.order);
  },
});

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
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    adminToken: v.string(),
    id: v.id("testimonials"),
    name: v.optional(v.string()),
    quote: v.optional(v.string()),
    stars: v.optional(v.number()),
    order: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
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

export const remove = mutation({
  args: { adminToken: v.string(), id: v.id("testimonials") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    await ctx.db.delete(args.id);
    return args.id;
  },
});
