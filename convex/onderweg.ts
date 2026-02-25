/**
 * Iets voor onderweg – admin beheert, klant ziet.
 * Ondersteunt tekst, afbeelding, prijs én betaallink.
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { checkAdmin } from "./adminAuth";

export const list = query({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    if (args.activeOnly) {
      const items = await ctx.db
        .query("onderwegItems")
        .withIndex("by_active_order", (q) => q.eq("isActive", true))
        .collect();
      return items.sort((a, b) => a.order - b.order);
    }
    const items = await ctx.db.query("onderwegItems").collect();
    return items.sort((a, b) => a.order - b.order);
  },
});

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db
      .query("onderwegItems")
      .withIndex("by_active_order", (q) => q.eq("isActive", true))
      .collect();
    return items.sort((a, b) => a.order - b.order);
  },
});

/** Lijst actieve items met URLs voor afbeelding. Drip: alleen items waar publishFrom <= now of niet gezet. */
export const listActiveWithUrls = query({
  args: {},
  handler: async (ctx) => {
    // Tijdelijk: haal ALLE items op om te debuggen
    const items = await ctx.db.query("onderwegItems").collect();
    console.log("All onderweg items:", items);

    const activeItems = items.filter(i => i.isActive);
    console.log("Active items:", activeItems);

    const now = Date.now();
    const visible = activeItems.filter((i) => !i.publishFrom || i.publishFrom <= now);
    console.log("Visible items:", visible);

    // Nieuwste eerst (op publishFrom, fallback createdAt), max 10
    const byRecent = [...visible].sort((a, b) => {
      const aTime = a.publishFrom ?? a.createdAt;
      const bTime = b.publishFrom ?? b.createdAt;
      return bTime - aTime;
    });
    const sorted = byRecent.slice(0, 10);
    const result = [];
    for (const item of sorted) {
      let imageUrl: string | null = null;
      try {
        if (item.imageStorageId) imageUrl = await ctx.storage.getUrl(item.imageStorageId);
      } catch {
        // Storage URL ophalen mislukt – negeer
      }
      result.push({ ...item, imageUrl });
    }
    return result;
  },
});

/** Admin: lijst alle items met URLs (voor preview bij bewerken) */
export const listWithUrls = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const items = await ctx.db.query("onderwegItems").collect();
    const sorted = items.sort((a, b) => a.order - b.order);
    const result = [];
    for (const item of sorted) {
      let imageUrl: string | null = null;
      try {
        if (item.imageStorageId) imageUrl = await ctx.storage.getUrl(item.imageStorageId);
      } catch {
        // negeer
      }
      result.push({ ...item, imageUrl });
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
    imageStorageId: v.optional(v.id("_storage")),
    publishFrom: v.optional(v.number()),
    priceCents: v.optional(v.number()),
    paymentUrl: v.optional(v.string()),
    buttonLabel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const now = Date.now();
    return await ctx.db.insert("onderwegItems", {
      title: args.title ?? "",
      content: args.content ?? "",
      order: args.order,
      imageStorageId: args.imageStorageId,
      publishFrom: args.publishFrom,
      priceCents: args.priceCents,
      paymentUrl: args.paymentUrl,
      buttonLabel: args.buttonLabel,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    adminToken: v.string(),
    id: v.id("onderwegItems"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    order: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    imageStorageId: v.optional(v.id("_storage")),
    publishFrom: v.optional(v.union(v.number(), v.null())),
    priceCents: v.optional(v.union(v.number(), v.null())),
    paymentUrl: v.optional(v.union(v.string(), v.null())),
    buttonLabel: v.optional(v.union(v.string(), v.null())),
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
    if ("paymentUrl" in updates && updates.paymentUrl === null) patch.paymentUrl = undefined;
    if ("buttonLabel" in updates && updates.buttonLabel === null) patch.buttonLabel = undefined;
    await ctx.db.patch(id, patch);
    return id;
  },
});

export const remove = mutation({
  args: { adminToken: v.string(), id: v.id("onderwegItems") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    await ctx.db.delete(args.id);
    return args.id;
  },
});
