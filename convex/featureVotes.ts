import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { checkAdmin } from "./adminAuth";

/** Sla een stem op voor een aankomende functie. Eén stem per gebruiker per functie. */
export const vote = mutation({
  args: {
    featureId: v.string(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Voorkom dubbele stemmen per gebruiker
    if (args.userId) {
      const existing = await ctx.db
        .query("featureVotes")
        .withIndex("by_user_feature", (q) =>
          q.eq("userId", args.userId!).eq("featureId", args.featureId)
        )
        .first();
      if (existing) return null;
    }

    return await ctx.db.insert("featureVotes", {
      featureId: args.featureId,
      userId: args.userId,
      createdAt: Date.now(),
    });
  },
});

/** Haal stemtotalen op per functie (alleen voor admin). */
export const getVoteCounts = query({
  args: {
    adminToken: v.string(),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const allVotes = await ctx.db.query("featureVotes").collect();

    const counts: Record<string, number> = {};
    for (const row of allVotes) {
      counts[row.featureId] = (counts[row.featureId] || 0) + 1;
    }

    return counts;
  },
});
