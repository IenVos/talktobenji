/**
 * Checkout producten — beheerbaar via admin, publiek via /betalen/[slug]
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { checkAdmin } from "./adminAuth";

/** Haal alle checkout producten op (admin only). */
export const list = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const products = await ctx.db.query("checkoutProducts").collect();
    return await Promise.all(
      products.map(async (product) => {
        let imageUrl: string | null = null;
        try {
          if (product.imageStorageId) imageUrl = await ctx.storage.getUrl(product.imageStorageId);
        } catch { /* negeer */ }
        return { ...product, imageUrl };
      })
    );
  },
});

/** Haal één live product op via slug (publiek, geen auth). */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const product = await ctx.db
      .query("checkoutProducts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (!product || !product.isLive) return null;
    let imageUrl: string | null = null;
    try {
      if (product.imageStorageId) imageUrl = await ctx.storage.getUrl(product.imageStorageId);
    } catch { /* negeer */ }
    return { ...product, imageUrl };
  },
});

/** Admin: genereer upload URL voor afbeeldingen */
export const generateUploadUrl = mutation({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    return ctx.storage.generateUploadUrl();
  },
});

/** Maak een nieuw checkout product aan (admin only). */
export const create = mutation({
  args: {
    adminToken: v.string(),
    slug: v.string(),
    name: v.string(),
    kortNaam: v.optional(v.string()),
    verliesType: v.optional(v.string()),
    description: v.optional(v.string()),
    priceInCents: v.number(),
    stripePriceId: v.optional(v.string()),
    subscriptionType: v.string(),
    buttonText: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    isLive: v.boolean(),
    accessDays: v.optional(v.number()),
    followUpEmailSubject: v.optional(v.string()),
    followUpEmailBody: v.optional(v.string()),
    giftEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const now = Date.now();
    return await ctx.db.insert("checkoutProducts", {
      slug: args.slug,
      name: args.name,
      kortNaam: args.kortNaam,
      verliesType: args.verliesType,
      description: args.description,
      priceInCents: args.priceInCents,
      stripePriceId: args.stripePriceId,
      subscriptionType: args.subscriptionType,
      buttonText: args.buttonText,
      imageStorageId: args.imageStorageId,
      isLive: args.isLive,
      accessDays: args.accessDays,
      followUpEmailSubject: args.followUpEmailSubject,
      followUpEmailBody: args.followUpEmailBody,
      giftEnabled: args.giftEnabled,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/** Pas een bestaand checkout product aan (admin only). */
export const update = mutation({
  args: {
    adminToken: v.string(),
    id: v.id("checkoutProducts"),
    slug: v.optional(v.string()),
    name: v.optional(v.string()),
    kortNaam: v.optional(v.string()),
    verliesType: v.optional(v.string()),
    description: v.optional(v.string()),
    priceInCents: v.optional(v.number()),
    stripePriceId: v.optional(v.string()),
    subscriptionType: v.optional(v.string()),
    buttonText: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    isLive: v.optional(v.boolean()),
    accessDays: v.optional(v.number()),
    followUpEmailSubject: v.optional(v.string()),
    followUpEmailBody: v.optional(v.string()),
    giftEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const { adminToken, id, ...fields } = args;
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) patch[key] = val;
    }
    await ctx.db.patch(id, patch);
  },
});

/** Verwijder een checkout product (admin only). */
export const remove = mutation({
  args: {
    adminToken: v.string(),
    id: v.id("checkoutProducts"),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    await ctx.db.delete(args.id);
  },
});
