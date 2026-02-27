/**
 * Handreikingen – admin beheert, klant ziet.
 * Ondersteunt tekst én PDF/ebook met coverafbeelding.
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { checkAdmin } from "./adminAuth";

export const list = query({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    if (args.activeOnly) {
      const items = await ctx.db
        .query("handreikingenItems")
        .withIndex("by_active_order", (q) => q.eq("isActive", true))
        .collect();
      return items.sort((a, b) => a.order - b.order);
    }
    const items = await ctx.db.query("handreikingenItems").collect();
    return items.sort((a, b) => a.order - b.order);
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

/** Lijst actieve items met URLs voor PDF en coverafbeelding. Drip: alleen items waar publishFrom <= now of niet gezet. */
export const listActiveWithUrls = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db
      .query("handreikingenItems")
      .withIndex("by_active_order", (q) => q.eq("isActive", true))
      .collect();
    const now = Date.now();
    const visible = items.filter((i) => !i.publishFrom || i.publishFrom <= now);
    const sorted = visible.sort((a, b) => a.order - b.order);
    const result = [];
    for (const item of sorted) {
      let pdfUrl: string | null = null;
      let imageUrl: string | null = null;
      try {
        if (item.pdfStorageId) pdfUrl = await ctx.storage.getUrl(item.pdfStorageId);
        if (item.imageStorageId) imageUrl = await ctx.storage.getUrl(item.imageStorageId);
      } catch {
        // Storage URL ophalen mislukt – negeer
      }
      result.push({ ...item, pdfUrl, imageUrl });
    }
    return result;
  },
});

/** Admin: lijst alle items met URLs (voor preview bij bewerken) */
export const listWithUrls = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const items = await ctx.db.query("handreikingenItems").collect();
    const sorted = items.sort((a, b) => a.order - b.order);
    const result = [];
    for (const item of sorted) {
      let pdfUrl: string | null = null;
      let imageUrl: string | null = null;
      try {
        if (item.pdfStorageId) pdfUrl = await ctx.storage.getUrl(item.pdfStorageId);
        if (item.imageStorageId) imageUrl = await ctx.storage.getUrl(item.imageStorageId);
      } catch {
        // negeer
      }
      result.push({ ...item, pdfUrl, imageUrl });
    }
    return result;
  },
});

export const generateUploadUrl = mutation({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    return ctx.storage.generateUploadUrl();
  },
});

export const create = mutation({
  args: {
    adminToken: v.string(),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    order: v.number(),
    pdfStorageId: v.optional(v.id("_storage")),
    imageStorageId: v.optional(v.id("_storage")),
    publishFrom: v.optional(v.number()),
    priceCents: v.optional(v.number()),
    exerciseSlug: v.optional(v.string()),
    exerciseButtonLabel: v.optional(v.string()),
    icon: v.optional(v.string()),
    isFree: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const now = Date.now();
    return await ctx.db.insert("handreikingenItems", {
      title: args.title ?? "",
      content: args.content ?? "",
      order: args.order,
      pdfStorageId: args.pdfStorageId,
      imageStorageId: args.imageStorageId,
      publishFrom: args.publishFrom,
      priceCents: args.priceCents,
      exerciseSlug: args.exerciseSlug,
      exerciseButtonLabel: args.exerciseButtonLabel,
      icon: args.icon,
      isFree: args.isFree,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    adminToken: v.string(),
    id: v.id("handreikingenItems"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    order: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    pdfStorageId: v.optional(v.id("_storage")),
    imageStorageId: v.optional(v.id("_storage")),
    publishFrom: v.optional(v.union(v.number(), v.null())),
    priceCents: v.optional(v.union(v.number(), v.null())),
    exerciseSlug: v.optional(v.union(v.string(), v.null())),
    exerciseButtonLabel: v.optional(v.union(v.string(), v.null())),
    icon: v.optional(v.union(v.string(), v.null())),
    isFree: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const { id, adminToken: _token, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Item niet gevonden");
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    const patch: Record<string, unknown> = { ...filtered, updatedAt: Date.now() };
    if ("priceCents" in updates && updates.priceCents === null) patch.priceCents = undefined;
    if ("publishFrom" in updates && updates.publishFrom === null) patch.publishFrom = undefined;
    if ("exerciseSlug" in updates && updates.exerciseSlug === null) patch.exerciseSlug = undefined;
    if ("exerciseButtonLabel" in updates && updates.exerciseButtonLabel === null) patch.exerciseButtonLabel = undefined;
    if ("icon" in updates && updates.icon === null) patch.icon = undefined;
    await ctx.db.patch(id, patch);
    return id;
  },
});

export const remove = mutation({
  args: { adminToken: v.string(), id: v.id("handreikingenItems") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    await ctx.db.delete(args.id);
    return args.id;
  },
});
