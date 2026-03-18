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

/** Voorkeuren inclusief storage URLs voor achtergrond en profielfoto */
export const getPreferencesWithUrl = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
    if (!prefs) return null;
    const [backgroundImageUrl, profileImageUrl] = await Promise.all([
      prefs.backgroundImageStorageId
        ? ctx.storage.getUrl(prefs.backgroundImageStorageId)
        : null,
      prefs.profileImageStorageId
        ? ctx.storage.getUrl(prefs.profileImageStorageId)
        : null,
    ]);
    return { ...prefs, backgroundImageUrl, profileImageUrl };
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
    userContext: v.optional(v.string()),
    accentColor: v.optional(v.string()),
    backgroundImageStorageId: v.optional(v.id("_storage")),
    profileImageStorageId: v.optional(v.id("_storage")),
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
      ...(args.userContext !== undefined && { userContext: args.userContext }),
      ...(args.accentColor !== undefined && { accentColor: args.accentColor }),
      ...(args.backgroundImageStorageId !== undefined && {
        backgroundImageStorageId: args.backgroundImageStorageId,
      }),
      ...(args.profileImageStorageId !== undefined && {
        profileImageStorageId: args.profileImageStorageId,
      }),
    };

    if (existing) {
      await ctx.db.patch(existing._id, updates);
      return existing._id;
    }
    return await ctx.db.insert("userPreferences", updates);
  },
});

/** Verwijder profielfoto */
export const removeProfileImage = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
    if (!existing || !existing.profileImageStorageId) return existing?._id ?? null;
    await ctx.db.patch(existing._id, { profileImageStorageId: undefined, updatedAt: Date.now() });
    return existing._id;
  },
});

/** Verwijder achtergrondafbeelding */
export const removeBackgroundImage = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
    if (!existing || !existing.backgroundImageStorageId) return existing?._id ?? null;
    const { backgroundImageStorageId: _bg, ...rest } = existing;
    await ctx.db.replace(existing._id, {
      ...rest,
      updatedAt: Date.now(),
    });
    return existing._id;
  },
});
