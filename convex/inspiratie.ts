/**
 * Inspiratie & troost – admin beheert, klant ziet.
 * Ondersteunt tekst (gedicht, citaat, etc.) én PDF/ebook met coverafbeelding.
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { checkAdmin } from "./adminAuth";

export const list = query({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    if (args.activeOnly) {
      const items = await ctx.db
        .query("inspiratieItems")
        .withIndex("by_active_order", (q) => q.eq("isActive", true))
        .collect();
      return items.sort((a, b) => a.order - b.order);
    }
    const items = await ctx.db.query("inspiratieItems").collect();
    return items.sort((a, b) => a.order - b.order);
  },
});

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db
      .query("inspiratieItems")
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
      .query("inspiratieItems")
      .withIndex("by_active_order", (q) => q.eq("isActive", true))
      .collect();
    const now = Date.now();
    const visible = items.filter((i) => !i.publishFrom || i.publishFrom <= now);
    // Maximaal 10 meest recent gepubliceerde kaarten tonen
    const byRecent = [...visible].sort((a, b) => {
      const aTime = a.publishFrom ?? a.createdAt;
      const bTime = b.publishFrom ?? b.createdAt;
      return bTime - aTime;
    });
    const limited = byRecent.slice(0, 10);
    const sorted = limited.sort((a, b) => a.order - b.order);
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
    const items = await ctx.db.query("inspiratieItems").collect();
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
    type: v.union(
      v.literal("gedicht"),
      v.literal("citaat"),
      v.literal("tekst"),
      v.literal("overig"),
      v.literal("pdf")
    ),
    order: v.number(),
    pdfStorageId: v.optional(v.id("_storage")),
    imageStorageId: v.optional(v.id("_storage")),
    publishFrom: v.optional(v.number()),
    priceCents: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const now = Date.now();
    return await ctx.db.insert("inspiratieItems", {
      title: args.title ?? "",
      content: args.content ?? "",
      type: args.type,
      order: args.order,
      pdfStorageId: args.pdfStorageId,
      imageStorageId: args.imageStorageId,
      publishFrom: args.publishFrom,
      priceCents: args.priceCents,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    adminToken: v.string(),
    id: v.id("inspiratieItems"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal("gedicht"),
        v.literal("citaat"),
        v.literal("tekst"),
        v.literal("overig"),
        v.literal("pdf")
      )
    ),
    order: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    pdfStorageId: v.optional(v.id("_storage")),
    imageStorageId: v.optional(v.id("_storage")),
    publishFrom: v.optional(v.union(v.number(), v.null())),
    priceCents: v.optional(v.union(v.number(), v.null())),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const { id, adminToken: _token, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Item niet gevonden");
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    // Convex: undefined = verwijder veld, null = zet op null
    const patch: Record<string, unknown> = { ...filtered, updatedAt: Date.now() };
    if ("priceCents" in updates && updates.priceCents === null) patch.priceCents = undefined;
    if ("publishFrom" in updates && updates.publishFrom === null) patch.publishFrom = undefined;
    await ctx.db.patch(id, patch);
    return id;
  },
});

export const remove = mutation({
  args: { adminToken: v.string(), id: v.id("inspiratieItems") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    await ctx.db.delete(args.id);
    return args.id;
  },
});
