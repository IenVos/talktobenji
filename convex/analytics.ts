/**
 * ANALYTICS
 *
 * Dashboard-statistieken voor het admin panel:
 * - Aantal vragen beantwoord
 * - Populairste onderwerpen
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
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

/**
 * Haal analytics-overzicht op voor het admin dashboard
 * @param fromMonth - Optioneel: startmaand "YYYY-MM"
 * @param toMonth - Optioneel: eindmaand "YYYY-MM"
 */
export const getDashboardStats = query({
  args: {
    fromMonth: v.optional(v.string()),
    toMonth: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db.query("chatMessages").collect();
    const sessions = await ctx.db.query("chatSessions").collect();
    const questions = await ctx.db.query("knowledgeBase").collect();

    // Datumbereik: eerste dag van fromMonth 00:00 tot laatste dag van toMonth 23:59:59
    let fromTs: number | null = null;
    let toTs: number | null = null;
    if (args.fromMonth) {
      const [y, m] = args.fromMonth.split("-").map(Number);
      fromTs = new Date(y, m - 1, 1).getTime();
    }
    if (args.toMonth) {
      const [y, m] = args.toMonth.split("-").map(Number);
      toTs = new Date(y, m, 0, 23, 59, 59, 999).getTime();
    }

    const inRange = (ts: number) => {
      if (fromTs !== null && ts < fromTs) return false;
      if (toTs !== null && ts > toTs) return false;
      return true;
    };

    // Filter berichten en sessies op datum
    const filteredMessages = fromTs !== null || toTs !== null
      ? messages.filter((m) => inRange(m.createdAt))
      : messages;
    const filteredSessions = fromTs !== null || toTs !== null
      ? sessions.filter((s) => inRange(s.startedAt))
      : sessions;

    // Aantal vragen beantwoord = aantal bot-berichten (elk antwoord op een vraag)
    const questionsAnswered = filteredMessages.filter((m) => m.role === "bot").length;

    // Populairste onderwerpen uit sessies (topic waarop gebruiker klikte)
    const topicCounts: Record<string, number> = {};
    for (const s of filteredSessions) {
      const topic = s.topic || "Overig";
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    }
    const popularTopics = Object.entries(topicCounts)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Populairste categorieën uit knowledge base (meest gebruikte Q&A's)
    const categoryUsage: Record<string, number> = {};
    for (const q of questions) {
      const cat = q.category || "Overig";
      categoryUsage[cat] = (categoryUsage[cat] || 0) + (q.usageCount || 0);
    }
    const popularCategories = Object.entries(categoryUsage)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Onbeantwoorde vragen (binnen datumfilter)
    const allUnanswered = await ctx.db.query("unansweredQuestions").collect();
    const filteredUnanswered = fromTs !== null || toTs !== null
      ? allUnanswered.filter((u) => inRange(u.createdAt))
      : allUnanswered;
    // Groepeer op vraag (zelfde vraag meerdere keren = belangrijk om toe te voegen)
    const questionMap: Record<string, { question: string; count: number; lastAt: number }> = {};
    for (const u of filteredUnanswered) {
      const q = u.userQuestion.trim();
      if (!q) continue;
      const key = q.toLowerCase().slice(0, 150);
      if (!questionMap[key]) {
        questionMap[key] = { question: q, count: 0, lastAt: u.createdAt };
      }
      questionMap[key].count += 1;
      questionMap[key].lastAt = Math.max(questionMap[key].lastAt, u.createdAt);
    }
    const unansweredQuestions = Object.values(questionMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)
      .map(({ question, count, lastAt }) => ({ question, count, lastAt }));

    return {
      questionsAnswered,
      totalSessions: filteredSessions.length,
      popularTopics,
      popularCategories,
      unansweredQuestions,
      fromMonth: args.fromMonth ?? null,
      toMonth: args.toMonth ?? null,
    };
  },
});
