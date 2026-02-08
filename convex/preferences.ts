/**
 * Gebruikersvoorkeuren: hoofdkleur, achtergrondafbeelding.
 * Per gebruiker (userId van NextAuth).
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getPreferences = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
    return prefs;
  },
});

/** Voorkeuren inclusief storage URL voor achtergrond */
export const getPreferencesWithUrl = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
    if (!prefs) return null;
    const backgroundImageUrl =
      prefs.backgroundImageStorageId
        ? await ctx.storage.getUrl(prefs.backgroundImageStorageId)
        : null;
    return { ...prefs, backgroundImageUrl };
  },
});

/** Genereer upload-URL voor achtergrondafbeelding */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const setPreferences = mutation({
  args: {
    userId: v.string(),
    accentColor: v.optional(v.string()),
    backgroundImageStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    const updates = {
      userId: args.userId,
      updatedAt: now,
      ...(args.accentColor !== undefined && { accentColor: args.accentColor }),
      ...(args.backgroundImageStorageId !== undefined && {
        backgroundImageStorageId: args.backgroundImageStorageId,
      }),
    };

    if (existing) {
      await ctx.db.patch(existing._id, updates);
      return existing._id;
    }
    return await ctx.db.insert("userPreferences", updates);
  },
});
