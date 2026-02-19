import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { checkAdmin } from "./adminAuth";

/** Publiek: actieve wensen voor een specifieke sectie */
export const listBySection = query({
  args: { section: v.string() },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("comingSoonFeatures")
      .withIndex("by_section", (q) =>
        q.eq("section", args.section).eq("isActive", true)
      )
      .collect();
    return rows.sort((a, b) => a.order - b.order);
  },
});

/** Admin: alle wensen */
export const listAll = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const rows = await ctx.db.query("comingSoonFeatures").collect();
    return rows.sort((a, b) => a.order - b.order);
  },
});

/** Admin: aanmaken */
export const create = mutation({
  args: {
    adminToken: v.string(),
    featureId: v.string(),
    iconName: v.string(),
    title: v.string(),
    description: v.string(),
    section: v.string(),
    order: v.number(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const now = Date.now();
    const { adminToken, ...fields } = args;
    return await ctx.db.insert("comingSoonFeatures", {
      ...fields,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/** Admin: bijwerken */
export const update = mutation({
  args: {
    adminToken: v.string(),
    id: v.id("comingSoonFeatures"),
    featureId: v.optional(v.string()),
    iconName: v.optional(v.string()),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    section: v.optional(v.string()),
    order: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const { adminToken, id, ...rest } = args;
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [key, val] of Object.entries(rest)) {
      if (val !== undefined) patch[key] = val;
    }
    await ctx.db.patch(id, patch);
  },
});

/** Admin: verwijderen */
export const remove = mutation({
  args: {
    adminToken: v.string(),
    id: v.id("comingSoonFeatures"),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    await ctx.db.delete(args.id);
  },
});
