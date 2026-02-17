/**
 * Feedback & Support mutations
 */
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { internal } from "./_generated/api";

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

    // Verstuur email notificatie voor support berichten
    if (args.feedbackType === "support") {
      try {
        // Haal image URL op als er een afbeelding is
        let imageUrl: string | undefined;
        if (storageId) {
          imageUrl = await ctx.storage.getUrl(storageId);
        }

        // Parse onderwerp en bericht uit comment
        const commentParts = args.comment.split("\n\n");
        const onderwerp = commentParts[0]?.replace("Onderwerp: ", "") || "Geen onderwerp";
        const bericht = commentParts.slice(1).join("\n\n") || args.comment;

        // Verstuur email via action
        await ctx.scheduler.runAfter(0, internal.emails.sendSupportEmail, {
          userEmail: args.userEmail,
          feedbackType: args.feedbackType,
          onderwerp,
          bericht,
          imageUrl,
        });
      } catch (error) {
        console.error("Error scheduling email:", error);
        // We willen de feedback wel opslaan, ook als email mislukt
      }
    }

    return feedbackId;
  },
});
