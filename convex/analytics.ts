/**
 * ANALYTICS
 *
 * Dashboard-statistieken voor het admin panel:
 * - Aantal vragen beantwoord
 * - Populairste onderwerpen
 */

import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { checkAdmin } from "./adminAuth";

/**
 * Registreer een vraag waar de AI geen antwoord op had (voor Knowledge Base-aanvulling)
 */
export const recordUnansweredQuestion = mutation({
  args: {
    userQuestion: v.string(),
    sessionId: v.id("chatSessions"),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("unansweredQuestions", {
      userQuestion: args.userQuestion.trim(),
      sessionId: args.sessionId,
      createdAt: Date.now(),
    });
  },
});
