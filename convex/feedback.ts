/**
 * Feedback & Support mutations
 */
import { v } from "convex/values";
import { mutation } from "./_generated/server";

/** Genereer upload-URL voor afbeelding */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const submitFeedback = mutation({
  args: {
    userId: v.optional(v.string()),
    userEmail: v.optional(v.string()),
    feedbackType: v.union(
      v.literal("bug"),
      v.literal("suggestion"),
      v.literal("compliment"),
      v.literal("complaint"),
      v.literal("feature_request"),
      v.literal("support")
    ),
    comment: v.string(),
    imageStorageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Converteer type "support" naar een bestaand type voor de database
    const dbType = args.feedbackType === "support" ? "bug" : args.feedbackType;

    // Converteer string naar storage ID als het er is
    const storageId = args.imageStorageId ? (args.imageStorageId as any) : undefined;

    const feedbackId = await ctx.db.insert("userFeedback", {
      userId: args.userId,
      userEmail: args.userEmail,
      feedbackType: dbType,
      comment: args.comment,
      imageStorageId: storageId,
      status: "new",
      createdAt: now,
    });

    return feedbackId;
  },
});
