/**
 * Checkout producten — beheerbaar via admin, publiek via /betalen/[slug]
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { checkAdmin } from "./adminAuth";
import { rustigeContentValidator } from "./checkoutValidators";

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
        const extraTextBlocks = product.extraTextBlocks
          ? await Promise.all(product.extraTextBlocks.map(async (block) => {
              let blockImageUrl: string | null = null;
              try {
                if (block.imageStorageId) blockImageUrl = await ctx.storage.getUrl(block.imageStorageId);
              } catch { /* negeer */ }
              return { ...block, imageUrl: blockImageUrl };
            }))
          : undefined;
        const reviews = product.reviews
          ? await Promise.all(product.reviews.map(async (review) => {
              let reviewImageUrl: string | null = null;
              try {
                if (review.imageStorageId) reviewImageUrl = await ctx.storage.getUrl(review.imageStorageId);
              } catch { /* negeer */ }
              return { ...review, imageUrl: reviewImageUrl };
            }))
          : undefined;
        return { ...product, imageUrl, extraTextBlocks, reviews };
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
    const extraTextBlocks = product.extraTextBlocks
      ? await Promise.all(product.extraTextBlocks.map(async (block) => {
          let blockImageUrl: string | null = null;
          try {
            if (block.imageStorageId) blockImageUrl = await ctx.storage.getUrl(block.imageStorageId);
          } catch { /* negeer */ }
          return { ...block, imageUrl: blockImageUrl };
        }))
      : undefined;
    const reviews = product.reviews
      ? await Promise.all(product.reviews.map(async (review) => {
          let reviewImageUrl: string | null = null;
          try {
            if (review.imageStorageId) reviewImageUrl = await ctx.storage.getUrl(review.imageStorageId);
          } catch { /* negeer */ }
          return { ...review, imageUrl: reviewImageUrl };
        }))
      : undefined;
    // Rustige layout: voeg per sectie met een afbeelding de publieke URL toe.
    const resolveUrl = async (storageId?: string): Promise<string | null> => {
      if (!storageId) return null;
      try { return await ctx.storage.getUrl(storageId as any); } catch { return null; }
    };
    let rustigeContent = product.rustigeContent as any;
    if (rustigeContent) {
      const rc = rustigeContent;
      rustigeContent = {
        ...rc,
        hero: rc.hero ? { ...rc.hero, imageUrl: await resolveUrl(rc.hero.imageStorageId) } : undefined,
        watJeKrijgt: rc.watJeKrijgt ? { ...rc.watJeKrijgt, imageUrl: await resolveUrl(rc.watJeKrijgt.imageStorageId) } : undefined,
        herkenning: rc.herkenning ? { ...rc.herkenning, imageUrl: await resolveUrl(rc.herkenning.imageStorageId) } : undefined,
        benjiVerhaal: rc.benjiVerhaal ? { ...rc.benjiVerhaal, imageUrl: await resolveUrl(rc.benjiVerhaal.imageStorageId) } : undefined,
      };
    }
    return { ...product, imageUrl, extraTextBlocks, reviews, rustigeContent };
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
    trustText: v.optional(v.string()),
    quoteText: v.optional(v.string()),
    herroepingTitle: v.optional(v.string()),
    herroepingText: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    isLive: v.boolean(),
    accessDays: v.optional(v.number()),
    followUpEmailSubject: v.optional(v.string()),
    followUpEmailBody: v.optional(v.string()),
    giftEnabled: v.optional(v.boolean()),
    b2bEnabled: v.optional(v.boolean()),
    evenHouvastPopupEnabled: v.optional(v.boolean()),
    evenHouvastPopupTekst: v.optional(v.string()),
    giftVariants: v.optional(v.array(v.object({
      label: v.string(),
      priceInCents: v.number(),
      billingPeriod: v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("half_yearly"), v.literal("yearly")),
      accessDays: v.number(),
    }))),
    addOnEnabled: v.optional(v.boolean()),
    addOnLabel: v.optional(v.string()),
    addOnDescription: v.optional(v.string()),
    addOnPriceInCents: v.optional(v.number()),
    addOnType: v.optional(v.string()),
    addOnAccessDays: v.optional(v.number()),
    benefits: v.optional(v.array(v.string())),
    reviews: v.optional(v.array(v.object({
      author: v.string(),
      role: v.optional(v.string()),
      text: v.string(),
      imageStorageId: v.optional(v.id("_storage")),
    }))),
    extraTextBlocks: v.optional(v.array(v.object({
      title: v.optional(v.string()),
      content: v.string(),
      imageStorageId: v.optional(v.id("_storage")),
    }))),
    checkoutLayout: v.optional(v.string()),
    rustigeContent: v.optional(rustigeContentValidator),
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
      trustText: args.trustText,
      quoteText: args.quoteText,
      herroepingTitle: args.herroepingTitle,
      herroepingText: args.herroepingText,
      imageStorageId: args.imageStorageId,
      isLive: args.isLive,
      accessDays: args.accessDays,
      followUpEmailSubject: args.followUpEmailSubject,
      followUpEmailBody: args.followUpEmailBody,
      giftEnabled: args.giftEnabled,
      b2bEnabled: args.b2bEnabled,
      evenHouvastPopupEnabled: args.evenHouvastPopupEnabled,
      evenHouvastPopupTekst: args.evenHouvastPopupTekst,
      giftVariants: args.giftVariants,
      addOnEnabled: args.addOnEnabled,
      addOnLabel: args.addOnLabel,
      addOnDescription: args.addOnDescription,
      addOnPriceInCents: args.addOnPriceInCents,
      addOnType: args.addOnType,
      addOnAccessDays: args.addOnAccessDays,
      benefits: args.benefits,
      reviews: args.reviews,
      extraTextBlocks: args.extraTextBlocks,
      checkoutLayout: args.checkoutLayout,
      rustigeContent: args.rustigeContent,
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
    clearImage: v.optional(v.boolean()), // true = product-afbeelding expliciet wissen
    slug: v.optional(v.string()),
    name: v.optional(v.string()),
    kortNaam: v.optional(v.string()),
    verliesType: v.optional(v.string()),
    description: v.optional(v.string()),
    priceInCents: v.optional(v.number()),
    stripePriceId: v.optional(v.string()),
    subscriptionType: v.optional(v.string()),
    buttonText: v.optional(v.string()),
    trustText: v.optional(v.string()),
    quoteText: v.optional(v.string()),
    herroepingTitle: v.optional(v.string()),
    herroepingText: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    isLive: v.optional(v.boolean()),
    accessDays: v.optional(v.number()),
    followUpEmailSubject: v.optional(v.string()),
    followUpEmailBody: v.optional(v.string()),
    giftEnabled: v.optional(v.boolean()),
    b2bEnabled: v.optional(v.boolean()),
    evenHouvastPopupEnabled: v.optional(v.boolean()),
    evenHouvastPopupTekst: v.optional(v.string()),
    giftVariants: v.optional(v.array(v.object({
      label: v.string(),
      priceInCents: v.number(),
      billingPeriod: v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("half_yearly"), v.literal("yearly")),
      accessDays: v.number(),
    }))),
    addOnEnabled: v.optional(v.boolean()),
    addOnLabel: v.optional(v.string()),
    addOnDescription: v.optional(v.string()),
    addOnPriceInCents: v.optional(v.number()),
    addOnType: v.optional(v.string()),
    addOnAccessDays: v.optional(v.number()),
    benefits: v.optional(v.array(v.string())),
    reviews: v.optional(v.array(v.object({
      author: v.string(),
      role: v.optional(v.string()),
      text: v.string(),
      imageStorageId: v.optional(v.id("_storage")),
    }))),
    extraTextBlocks: v.optional(v.array(v.object({
      title: v.optional(v.string()),
      content: v.string(),
      imageStorageId: v.optional(v.id("_storage")),
    }))),
    checkoutLayout: v.optional(v.string()),
    rustigeContent: v.optional(rustigeContentValidator),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const { adminToken, id, clearImage, ...fields } = args;
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) patch[key] = val;
    }
    // Afbeelding expliciet verwijderd in de admin → veld wissen (undefined verwijdert het in Convex)
    if (clearImage) patch.imageStorageId = undefined;
    // Kassakoopje uitgezet → velden expliciet wissen (undefined verwijdert het veld in Convex)
    if (args.addOnEnabled === false) {
      patch.addOnLabel = undefined;
      patch.addOnDescription = undefined;
      patch.addOnPriceInCents = undefined;
      patch.addOnType = undefined;
      patch.addOnAccessDays = undefined;
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
