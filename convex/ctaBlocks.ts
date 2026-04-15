import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { checkAdmin } from "./adminAuth";

export const list = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const blocks = await ctx.db.query("ctaBlocks").order("asc").collect();
    return await Promise.all(blocks.map(async (b) => ({
      ...b,
      imageUrl: b.imageStorageId ? await ctx.storage.getUrl(b.imageStorageId).catch(() => null) : null,
    })));
  },
});

export const getByKey = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    return ctx.db.query("ctaBlocks").withIndex("by_key", (q) => q.eq("key", args.key)).first();
  },
});

/** Publiek: alle CTA blokken (voor live pagina's) */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const blocks = await ctx.db.query("ctaBlocks").collect();
    return await Promise.all(blocks.map(async (b) => ({
      ...b,
      imageUrl: b.imageStorageId ? await ctx.storage.getUrl(b.imageStorageId).catch(() => null) : null,
    })));
  },
});

export const generateUploadUrl = mutation({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    return ctx.storage.generateUploadUrl();
  },
});

export const getImageUrl = mutation({
  args: { adminToken: v.string(), storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    return ctx.storage.getUrl(args.storageId);
  },
});

export const save = mutation({
  args: {
    adminToken: v.string(),
    id: v.optional(v.id("ctaBlocks")),
    key: v.string(),
    label: v.string(),
    eyebrow: v.optional(v.string()),
    title: v.string(),
    body: v.string(),
    buttonText: v.string(),
    footnote: v.optional(v.string()),
    showImage: v.boolean(),
    imageStorageId: v.optional(v.id("_storage")),
    bgColor: v.optional(v.string()),
    borderColor: v.optional(v.string()),
    buttonColor: v.optional(v.string()),
    buttonUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const { adminToken, id, ...fields } = args;
    const data = { ...fields, updatedAt: Date.now() };
    if (id) {
      await ctx.db.patch(id, data);
      return id;
    }
    return ctx.db.insert("ctaBlocks", data);
  },
});

export const remove = mutation({
  args: { adminToken: v.string(), id: v.id("ctaBlocks") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    await ctx.db.delete(args.id);
  },
});
