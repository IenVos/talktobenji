import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Haal alle herinneringen op voor een gebruiker (nieuwste eerst)
 */
export const getMemories = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const memories = await ctx.db
      .query("memories")
      .withIndex("by_user_created", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    return Promise.all(
      memories.map(async (m) => ({
        ...m,
        imageUrl: m.imageStorageId
          ? await ctx.storage.getUrl(m.imageStorageId)
          : undefined,
      }))
    );
  },
});

/**
 * Haal een willekeurige herinnering op (voor Benji om aan te bieden)
 */
export const getRandomMemory = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const memories = await ctx.db
      .query("memories")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    if (memories.length === 0) return null;

    const random = memories[Math.floor(Math.random() * memories.length)];
    return {
      ...random,
      imageUrl: random.imageStorageId
        ? await ctx.storage.getUrl(random.imageStorageId)
        : undefined,
    };
  },
});

/**
 * Voeg een herinnering toe
 */
export const addMemory = mutation({
  args: {
    userId: v.string(),
    text: v.string(),
    imageStorageId: v.optional(v.id("_storage")),
    emotion: v.optional(v.string()),
    memoryDate: v.optional(v.string()),
    source: v.union(v.literal("manual"), v.literal("chat")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("memories", {
      userId: args.userId,
      text: args.text,
      imageStorageId: args.imageStorageId,
      emotion: args.emotion,
      memoryDate: args.memoryDate,
      source: args.source,
      createdAt: Date.now(),
    });
  },
});

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Bewerk een herinnering
 */
export const updateMemory = mutation({
  args: {
    memoryId: v.id("memories"),
    userId: v.string(),
    text: v.optional(v.string()),
    emotion: v.optional(v.string()),
    memoryDate: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    removeImage: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const memory = await ctx.db.get(args.memoryId);
    if (!memory || memory.userId !== args.userId) return;

    const updates: Record<string, any> = {};
    if (args.text !== undefined) updates.text = args.text;
    if (args.emotion !== undefined) updates.emotion = args.emotion;
    if (args.memoryDate !== undefined) updates.memoryDate = args.memoryDate;

    if (args.removeImage && memory.imageStorageId) {
      await ctx.storage.delete(memory.imageStorageId);
      updates.imageStorageId = undefined;
    } else if (args.imageStorageId) {
      if (memory.imageStorageId) {
        await ctx.storage.delete(memory.imageStorageId);
      }
      updates.imageStorageId = args.imageStorageId;
    }

    await ctx.db.patch(args.memoryId, updates);
  },
});

/**
 * Verwijder een herinnering (inclusief eventuele afbeelding)
 */
export const deleteMemory = mutation({
  args: { memoryId: v.id("memories"), userId: v.string() },
  handler: async (ctx, args) => {
    const memory = await ctx.db.get(args.memoryId);
    if (!memory || memory.userId !== args.userId) return;
    if (memory.imageStorageId) {
      await ctx.storage.delete(memory.imageStorageId);
    }
    await ctx.db.delete(args.memoryId);
  },
});
