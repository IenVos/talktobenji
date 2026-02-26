/**
 * ADMIN FUNCTIES
 *
 * Dit bestand bevat alle functies voor admin/support medewerkers:
 * - Escalations beheren
 * - Analytics bekijken
 * - Feedback modereren
 * - Dashboard statistieken
 */

import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { checkAdmin } from "./adminAuth";
import { api } from "./_generated/api";

// ============================================================================
// CHAT HISTORY QUERIES (voor admin overzicht)
// ============================================================================

/**
 * Haal alle chat-sessies op voor admin (nieuwste eerst)
 */
export const listChatHistory = query({
  args: {
    adminToken: v.string(),
    limit: v.optional(v.number()),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("resolved"),
        v.literal("escalated"),
        v.literal("abandoned")
      )
    ),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const allSessions = await ctx.db.query("chatSessions").collect();
    let sessions = allSessions.filter(
      (s) => typeof s.lastActivityAt === "number"
    );

    if (args.status) {
      sessions = sessions.filter((s) => s.status === args.status);
    }

    const sorted = [...sessions].sort(
      (a, b) => (b.lastActivityAt ?? 0) - (a.lastActivityAt ?? 0)
    );

    const limit = Math.min(args.limit ?? 100, 200);
    return sorted.slice(0, limit);
  },
});

/**
 * Haal sessie + berichten op voor admin detailweergave
 */
export const getChatHistoryDetail = query({
  args: { adminToken: v.string(), sessionId: v.id("chatSessions") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;

    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("asc")
      .collect();

    return { session, messages };
  },
});

// ============================================================================
// ESCALATION QUERIES
// ============================================================================

/**
 * Haal alle escalations op met filters
 */
export const getEscalations = query({
  args: {
    adminToken: v.string(),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("assigned"),
        v.literal("in_progress"),
        v.literal("resolved"),
        v.literal("closed")
      )
    ),
    priority: v.optional(
      v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("urgent")
      )
    ),
    assignedTo: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    // Fetch all escalations and filter in memory for complex conditions
    let escalations = await ctx.db.query("escalations").collect();

    // Filter op status
    if (args.status) {
      escalations = escalations.filter((e) => e.status === args.status);
    }

    // Filter op priority
    if (args.priority) {
      escalations = escalations.filter((e) => e.priority === args.priority);
    }

    // Extra filters
    if (args.assignedTo) {
      escalations = escalations.filter((e) => e.assignedTo === args.assignedTo);
    }

    // Sorteer op priority en createdAt
    const sorted = escalations.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff =
        priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.createdAt - a.createdAt;
    });

    // Limiteer als opgegeven
    return args.limit ? sorted.slice(0, args.limit) : sorted;
  },
});

/**
 * Haal escalation met complete sessie info
 */
export const getEscalationWithSession = query({
  args: { adminToken: v.string(), escalationId: v.id("escalations") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const escalation = await ctx.db.get(args.escalationId);
    if (!escalation) {
      throw new Error("Escalation niet gevonden");
    }

    // Haal sessie op
    const session = await ctx.db.get(escalation.sessionId);

    // Haal alle berichten op
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_session", (q) => q.eq("sessionId", escalation.sessionId))
      .order("asc")
      .collect();

    return {
      escalation,
      session,
      messages,
    };
  },
});

// ============================================================================
// ESCALATION MUTATIONS
// ============================================================================

/**
 * Creëer een nieuwe escalation
 */
export const createEscalation = mutation({
  args: {
    adminToken: v.string(),
    sessionId: v.id("chatSessions"),
    originalQuestion: v.string(),
    reason: v.union(
      v.literal("low_confidence"),
      v.literal("no_match"),
      v.literal("user_request"),
      v.literal("complex_issue"),
      v.literal("complaint")
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    ),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const escalationId = await ctx.db.insert("escalations", {
      sessionId: args.sessionId,
      originalQuestion: args.originalQuestion,
      reason: args.reason,
      priority: args.priority,
      status: "pending",
      shouldAddToKnowledgeBase: false,
      createdAt: Date.now(),
    });

    // Update sessie status naar escalated
    await ctx.db.patch(args.sessionId, {
      status: "escalated",
      wasResolved: false,
      lastActivityAt: Date.now(),
    });

    return escalationId;
  },
});

/**
 * Wijs escalation toe aan een support agent
 */
export const assignEscalation = mutation({
  args: {
    adminToken: v.string(),
    escalationId: v.id("escalations"),
    assignedTo: v.string(),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    await ctx.db.patch(args.escalationId, {
      assignedTo: args.assignedTo,
      status: "assigned",
      assignedAt: Date.now(),
    });

    return args.escalationId;
  },
});

/**
 * Update escalation status
 */
export const updateEscalationStatus = mutation({
  args: {
    adminToken: v.string(),
    escalationId: v.id("escalations"),
    status: v.union(
      v.literal("pending"),
      v.literal("assigned"),
      v.literal("in_progress"),
      v.literal("resolved"),
      v.literal("closed")
    ),
    agentNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const updates: any = {
      status: args.status,
    };

    if (args.agentNotes) {
      updates.agentNotes = args.agentNotes;
    }

    // Als resolved, zet resolvedAt timestamp
    if (args.status === "resolved" || args.status === "closed") {
      updates.resolvedAt = Date.now();
    }

    await ctx.db.patch(args.escalationId, updates);

    return args.escalationId;
  },
});

/**
 * Los escalation op met resolutie
 */
export const resolveEscalation = mutation({
  args: {
    adminToken: v.string(),
    escalationId: v.id("escalations"),
    resolution: v.string(),
    shouldAddToKnowledgeBase: v.boolean(),
    agentNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const escalation = await ctx.db.get(args.escalationId);
    if (!escalation) {
      throw new Error("Escalation niet gevonden");
    }

    // Update escalation
    await ctx.db.patch(args.escalationId, {
      status: "resolved",
      resolution: args.resolution,
      shouldAddToKnowledgeBase: args.shouldAddToKnowledgeBase,
      agentNotes: args.agentNotes,
      resolvedAt: Date.now(),
    });

    // Update sessie naar resolved
    await ctx.db.patch(escalation.sessionId, {
      status: "resolved",
      wasResolved: true,
      lastActivityAt: Date.now(),
    });

    return args.escalationId;
  },
});

// ============================================================================
// FEEDBACK QUERIES & MUTATIONS
// ============================================================================

/**
 * Haal alle feedback op
 */
export const getAllFeedback = query({
  args: {
    adminToken: v.string(),
    feedbackType: v.optional(
      v.union(
        v.literal("bug"),
        v.literal("suggestion"),
        v.literal("compliment"),
        v.literal("complaint"),
        v.literal("feature_request")
      )
    ),
    status: v.optional(
      v.union(
        v.literal("new"),
        v.literal("reviewed"),
        v.literal("implemented"),
        v.literal("declined")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    // Fetch all feedback and filter in memory
    let feedback = await ctx.db.query("userFeedback").collect();

    // Filter op type
    if (args.feedbackType) {
      feedback = feedback.filter((f) => f.feedbackType === args.feedbackType);
    }

    // Filter op status
    if (args.status) {
      feedback = feedback.filter((f) => f.status === args.status);
    }

    // Sorteer op createdAt (nieuwste eerst)
    const sorted = feedback.sort((a, b) => b.createdAt - a.createdAt);

    // Limiteer als opgegeven
    const limited = args.limit ? sorted.slice(0, args.limit) : sorted;

    // Voeg image URLs toe
    return Promise.all(
      limited.map(async (f) => ({
        ...f,
        imageUrl: f.imageStorageId
          ? await ctx.storage.getUrl(f.imageStorageId)
          : undefined,
      }))
    );
  },
});

/**
 * Update feedback status
 */
export const updateFeedbackStatus = mutation({
  args: {
    adminToken: v.string(),
    feedbackId: v.id("userFeedback"),
    status: v.union(
      v.literal("new"),
      v.literal("reviewed"),
      v.literal("implemented"),
      v.literal("declined")
    ),
    adminResponse: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const updates: any = {
      status: args.status,
    };

    if (args.adminResponse) {
      updates.adminResponse = args.adminResponse;
    }

    await ctx.db.patch(args.feedbackId, updates);

    return args.feedbackId;
  },
});

/**
 * Verwijder feedback volledig
 */
export const deleteFeedback = mutation({
  args: { adminToken: v.string(), feedbackId: v.id("userFeedback") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) return;
    if (feedback.imageStorageId) {
      try { await ctx.storage.delete(feedback.imageStorageId); } catch {}
    }
    await ctx.db.delete(args.feedbackId);
  },
});

/**
 * Verwijder alleen de afbeelding van feedback (tekst blijft behouden)
 */
export const deleteFeedbackImage = mutation({
  args: { adminToken: v.string(), feedbackId: v.id("userFeedback") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback?.imageStorageId) return;
    try { await ctx.storage.delete(feedback.imageStorageId); } catch {}
    await ctx.db.patch(args.feedbackId, { imageStorageId: undefined });
  },
});

// ============================================================================
// ANALYTICS QUERIES
// ============================================================================

/**
 * Haal analytics voor een specifieke periode
 */
export const getAnalytics = query({
  args: {
    adminToken: v.string(),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const analytics = await ctx.db
      .query("analytics")
      .withIndex("by_date", (q) =>
        q.gte("date", args.startDate).lte("date", args.endDate)
      )
      .collect();

    return analytics.sort((a, b) => a.date - b.date);
  },
});

/**
 * Genereer realtime statistieken (niet opgeslagen in analytics tabel)
 */
export const getRealtimeStats = query({
  args: {
    adminToken: v.string(),
    periodDays: v.optional(v.number()), // Aantal dagen terug
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const days = args.periodDays || 7;
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;

    // Haal alle sessies in de periode op
    const sessions = await ctx.db.query("chatSessions").collect();
    const recentSessions = sessions.filter((s) => s.startedAt >= cutoffTime);

    // Haal alle berichten in de periode op
    const allMessages = await ctx.db.query("chatMessages").collect();
    const recentMessages = allMessages.filter((m) => m.createdAt >= cutoffTime);

    // Haal escalations op
    const escalations = await ctx.db.query("escalations").collect();
    const recentEscalations = escalations.filter(
      (e) => e.createdAt >= cutoffTime
    );

    // Bereken statistieken
    const totalSessions = recentSessions.length;
    const activeSessions = recentSessions.filter(
      (s) => s.status === "active"
    ).length;
    const resolvedSessions = recentSessions.filter(
      (s) => s.status === "resolved"
    ).length;
    const escalatedSessions = recentSessions.filter(
      (s) => s.status === "escalated"
    ).length;

    // Bereken gemiddeldes
    const ratingsessions = recentSessions.filter((s) => s.rating !== undefined);
    const avgRating =
      ratingsessions.length > 0
        ? ratingsessions.reduce((sum, s) => sum + (s.rating || 0), 0) /
          ratingsessions.length
        : 0;

    // Bereken gemiddelde sessieduur
    const completedSessions = recentSessions.filter((s) => s.endedAt);
    const avgDuration =
      completedSessions.length > 0
        ? completedSessions.reduce(
            (sum, s) => sum + ((s.endedAt || 0) - s.startedAt),
            0
          ) /
          completedSessions.length /
          1000
        : 0; // in seconden

    // Bereken confidence scores
    const botMessages = recentMessages.filter((m) => m.role === "bot");
    const messagesWithConfidence = botMessages.filter(
      (m) => m.confidenceScore !== undefined
    );
    const avgConfidence =
      messagesWithConfidence.length > 0
        ? messagesWithConfidence.reduce(
            (sum, m) => sum + (m.confidenceScore || 0),
            0
          ) / messagesWithConfidence.length
        : 0;

    // Top knowledge base items
    const kbUsage = new Map<string, number>();
    botMessages.forEach((m) => {
      if (m.knowledgeBaseId) {
        const count = kbUsage.get(m.knowledgeBaseId) || 0;
        kbUsage.set(m.knowledgeBaseId, count + 1);
      }
    });

    const topKbItems = Array.from(kbUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, count]) => ({ knowledgeBaseId: id, usageCount: count }));

    return {
      period: {
        days,
        startDate: cutoffTime,
        endDate: Date.now(),
      },
      sessions: {
        total: totalSessions,
        active: activeSessions,
        resolved: resolvedSessions,
        escalated: escalatedSessions,
        avgDurationSeconds: Math.round(avgDuration),
        avgRating: Math.round(avgRating * 10) / 10,
      },
      messages: {
        total: recentMessages.length,
        user: recentMessages.filter((m) => m.role === "user").length,
        bot: recentMessages.filter((m) => m.role === "bot").length,
        avgConfidenceScore: Math.round(avgConfidence * 100) / 100,
      },
      escalations: {
        total: recentEscalations.length,
        pending: recentEscalations.filter((e) => e.status === "pending").length,
        inProgress: recentEscalations.filter((e) => e.status === "in_progress")
          .length,
        resolved: recentEscalations.filter((e) => e.status === "resolved")
          .length,
      },
      topKnowledgeBaseItems: topKbItems,
    };
  },
});

/**
 * Genereer dashboard overview (voor admin home)
 */
export const getDashboardOverview = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;
    const last7d = now - 7 * 24 * 60 * 60 * 1000;

    // Haal data op
    const allSessions = await ctx.db.query("chatSessions").collect();
    const allEscalations = await ctx.db.query("escalations").collect();
    const allFeedback = await ctx.db.query("userFeedback").collect();

    // Filter op tijd
    const sessions24h = allSessions.filter((s) => s.startedAt >= last24h);
    const sessions7d = allSessions.filter((s) => s.startedAt >= last7d);
    const escalations24h = allEscalations.filter((e) => e.createdAt >= last24h);
    const newFeedback = allFeedback.filter((f) => f.status === "new");

    // Actieve sessies
    const activeSessions = allSessions.filter((s) => s.status === "active");

    // Pending escalations
    const pendingEscalations = allEscalations.filter(
      (e) => e.status === "pending"
    );

    // Resolution rate (laatste 7 dagen)
    const resolved7d = sessions7d.filter((s) => s.status === "resolved").length;
    const resolutionRate =
      sessions7d.length > 0 ? (resolved7d / sessions7d.length) * 100 : 0;

    return {
      current: {
        activeSessions: activeSessions.length,
        pendingEscalations: pendingEscalations.length,
        newFeedback: newFeedback.length,
      },
      last24h: {
        sessions: sessions24h.length,
        escalations: escalations24h.length,
        resolutionRate: Math.round(resolutionRate),
      },
      last7d: {
        sessions: sessions7d.length,
        resolutionRate: Math.round(resolutionRate),
      },
    };
  },
});

/**
 * Genereer dagelijkse analytics (run als scheduled functie)
 */
export const generateDailyAnalytics = mutation({
  args: {
    adminToken: v.string(),
    date: v.optional(v.number()), // Default: gisteren
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    // Bepaal de datum (default: gisteren)
    const targetDate = args.date || Date.now() - 24 * 60 * 60 * 1000;
    const dayStart = new Date(targetDate).setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate).setHours(23, 59, 59, 999);

    // Haal data op voor deze dag
    const sessions = await ctx.db.query("chatSessions").collect();
    const daySessions = sessions.filter(
      (s) => s.startedAt >= dayStart && s.startedAt <= dayEnd
    );

    const messages = await ctx.db.query("chatMessages").collect();
    const dayMessages = messages.filter(
      (m) => m.createdAt >= dayStart && m.createdAt <= dayEnd
    );

    // Bereken stats
    const totalSessions = daySessions.length;
    const resolvedSessions = daySessions.filter(
      (s) => s.status === "resolved"
    ).length;
    const escalatedSessions = daySessions.filter(
      (s) => s.status === "escalated"
    ).length;

    const totalMessages = dayMessages.filter((m) => m.role === "user").length;

    // Gemiddelde sessie duur
    const completedSessions = daySessions.filter((s) => s.endedAt);
    const avgSessionDuration =
      completedSessions.length > 0
        ? completedSessions.reduce(
            (sum, s) => sum + ((s.endedAt || 0) - s.startedAt),
            0
          ) /
          completedSessions.length /
          1000
        : 0;

    // Gemiddelde berichten per sessie
    const avgMessagesPerSession =
      totalSessions > 0 ? totalMessages / totalSessions : 0;

    // Gemiddelde confidence
    const botMessages = dayMessages.filter((m) => m.role === "bot");
    const messagesWithConfidence = botMessages.filter(
      (m) => m.confidenceScore !== undefined
    );
    const avgConfidenceScore =
      messagesWithConfidence.length > 0
        ? messagesWithConfidence.reduce(
            (sum, m) => sum + (m.confidenceScore || 0),
            0
          ) / messagesWithConfidence.length
        : 0;

    // Gemiddelde satisfaction
    const ratedSessions = daySessions.filter((s) => s.rating !== undefined);
    const avgUserSatisfaction =
      ratedSessions.length > 0
        ? ratedSessions.reduce((sum, s) => sum + (s.rating || 0), 0) /
          ratedSessions.length
        : undefined;

    // Top questions
    const kbUsage = new Map<string, number>();
    botMessages.forEach((m) => {
      if (m.knowledgeBaseId) {
        const count = kbUsage.get(m.knowledgeBaseId) || 0;
        kbUsage.set(m.knowledgeBaseId, count + 1);
      }
    });
    const topQuestionsUsed = Array.from(kbUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id]) => id);

    // Sla analytics op
    const analyticsId = await ctx.db.insert("analytics", {
      date: dayStart,
      stats: {
        totalSessions,
        totalMessages,
        resolvedSessions,
        escalatedSessions,
        avgSessionDuration,
        avgMessagesPerSession,
        avgConfidenceScore,
        avgUserSatisfaction,
        topQuestionsUsed,
      },
      generatedAt: Date.now(),
    });

    return analyticsId;
  },
});

/**
 * Export alle data voor backup/analysis
 */
// ============================================================================
// CHAT BERICHTEN VERWIJDEREN
// ============================================================================

/** Verwijder een enkel chatbericht */
export const deleteChatMessage = mutation({
  args: {
    adminToken: v.string(),
    messageId: v.id("chatMessages"),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    await ctx.db.delete(args.messageId);
  },
});

/** Verwijder meerdere chatberichten tegelijk */
export const deleteChatMessages = mutation({
  args: {
    adminToken: v.string(),
    messageIds: v.array(v.id("chatMessages")),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    for (const id of args.messageIds) {
      await ctx.db.delete(id);
    }
  },
});

/** Verwijder een hele chat sessie met al zijn berichten */
export const deleteChatSession = mutation({
  args: {
    adminToken: v.string(),
    sessionId: v.id("chatSessions"),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();
    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }
    await ctx.db.delete(args.sessionId);
  },
});

export const exportAllData = query({
  args: {
    adminToken: v.string(),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const start = args.startDate || 0;
    const end = args.endDate || Date.now();

    // Haal alle relevante data op
    const sessions = await ctx.db.query("chatSessions").collect();
    const messages = await ctx.db.query("chatMessages").collect();
    const escalations = await ctx.db.query("escalations").collect();
    const feedback = await ctx.db.query("userFeedback").collect();

    // Filter op datum
    const filteredSessions = sessions.filter(
      (s) => s.startedAt >= start && s.startedAt <= end
    );
    const filteredMessages = messages.filter(
      (m) =>
        m.createdAt >= start &&
        m.createdAt <= end &&
        filteredSessions.some((s) => s._id === m.sessionId)
    );
    const filteredEscalations = escalations.filter(
      (e) => e.createdAt >= start && e.createdAt <= end
    );
    const filteredFeedback = feedback.filter(
      (f) => f.createdAt >= start && f.createdAt <= end
    );

    return {
      exportedAt: Date.now(),
      period: { start, end },
      counts: {
        sessions: filteredSessions.length,
        messages: filteredMessages.length,
        escalations: filteredEscalations.length,
        feedback: filteredFeedback.length,
      },
      data: {
        sessions: filteredSessions,
        messages: filteredMessages,
        escalations: filteredEscalations,
        feedback: filteredFeedback,
      },
    };
  },
});

// ============================================================================
// ONBEVREDIGENDE ANTWOORDEN
// ============================================================================

/**
 * Markeer feedback als afgehandeld (archiveren).
 */
export const markFeedbackHandled = mutation({
  args: { adminToken: v.string(), messageId: v.id("chatMessages") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    await ctx.db.patch(args.messageId, { feedbackHandled: true });
  },
});

/**
 * Haal alle berichten op die als "helpful" zijn gemarkeerd, met context.
 */
export const getHelpfulMessages = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);

    const flagged = await ctx.db
      .query("chatMessages")
      .filter((q) => q.eq(q.field("feedback"), "helpful"))
      .order("desc")
      .take(200);

    const result = await Promise.all(
      flagged.map(async (msg) => {
        const sessionMsgs = await ctx.db
          .query("chatMessages")
          .withIndex("by_session", (q) => q.eq("sessionId", msg.sessionId))
          .order("asc")
          .collect();
        const msgIndex = sessionMsgs.findIndex((m) => m._id === msg._id);
        const prevUser = msgIndex > 0
          ? sessionMsgs.slice(0, msgIndex).reverse().find((m) => m.role === "user")
          : null;
        const session = await ctx.db.get(msg.sessionId);
        return {
          _id: msg._id,
          botResponse: msg.content,
          userMessage: prevUser?.content ?? null,
          createdAt: msg.createdAt,
          sessionId: msg.sessionId,
          userId: session?.userId ?? null,
          feedbackHandled: msg.feedbackHandled ?? false,
          fullConversation: sessionMsgs.map((m) => ({
            role: m.role,
            content: m.content,
            isFlagged: false,
          })),
        };
      })
    );

    return result;
  },
});

/**
 * Haal alle berichten op die als "not_helpful" zijn gemarkeerd, met context.
 */
export const getNotHelpfulMessages = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);

    const flagged = await ctx.db
      .query("chatMessages")
      .filter((q) =>
        q.and(
          q.eq(q.field("feedback"), "not_helpful"),
          q.neq(q.field("feedbackHandled"), true)
        )
      )
      .order("desc")
      .take(200);

    const result = await Promise.all(
      flagged.map(async (msg) => {
        // Haal alle berichten van deze sessie op om context te geven
        const sessionMsgs = await ctx.db
          .query("chatMessages")
          .withIndex("by_session", (q) => q.eq("sessionId", msg.sessionId))
          .order("asc")
          .collect();

        // Zoek het laatste gebruikersbericht voor dit bot-bericht
        const msgIndex = sessionMsgs.findIndex((m) => m._id === msg._id);
        const prevUser = msgIndex > 0
          ? sessionMsgs.slice(0, msgIndex).reverse().find((m) => m.role === "user")
          : null;

        const session = await ctx.db.get(msg.sessionId);

        return {
          _id: msg._id,
          botResponse: msg.content,
          userMessage: prevUser?.content ?? null,
          createdAt: msg.createdAt,
          sessionId: msg.sessionId,
          userId: session?.userId ?? null,
          feedbackHandled: msg.feedbackHandled ?? false,
          fullConversation: sessionMsgs.map((m) => ({
            role: m.role,
            content: m.content,
            isFlagged: m._id === msg._id,
          })),
        };
      })
    );

    return result;
  },
});

/**
 * Voeg een toevoeging toe aan de bestaande rules in botSettings.
 */
export const appendToRules = mutation({
  args: { adminToken: v.string(), addition: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const settings = await ctx.db.query("botSettings").first();
    const current = settings?.rules ?? "";
    const updated = current.trimEnd() + "\n\n" + args.addition.trim();
    if (settings) {
      await ctx.db.patch(settings._id, { rules: updated, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("botSettings", { rules: updated, knowledge: "", updatedAt: Date.now() });
    }
  },
});

/**
 * Voeg een nieuwe knowledge base entry toe vanuit de admin feedback flow.
 */
export const addKnowledgeEntryFromAdmin = mutation({
  args: {
    adminToken: v.string(),
    question: v.string(),
    answer: v.string(),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    return await ctx.db.insert("knowledgeBase", {
      question: args.question,
      answer: args.answer,
      category: args.category,
      tags: [],
      isActive: true,
      usageCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Analyseer een slecht gesprek en stel een concrete verbetering voor via Claude.
 */
export const suggestFix = action({
  args: {
    adminToken: v.string(),
    conversation: v.array(v.object({ role: v.string(), content: v.string() })),
    badResponse: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.runQuery(api.adminAuth.validateToken, { adminToken: args.adminToken });

    const conversationText = args.conversation
      .map((m) => `${m.role === "user" ? "Bezoeker" : "Benji"}: ${m.content}`)
      .join("\n");

    const prompt = `Je bent een kwaliteitscontroleur voor Benji, een empathische rouw-chatbot. Analyseer dit gesprek waarbij Benji een antwoord gaf dat als slecht werd beoordeeld.

GESPREK:
${conversationText}

SLECHT BEOORDEELD ANTWOORD VAN BENJI:
${args.badResponse}

Bepaal wat er fout ging en stel een concrete verbetering voor. Kies één van twee opties:
- "rules": als het een gedragsfout is (verkeerde toon, herhaalde vragen, iets vergeten uit het gesprek, te snel advies, etc.)
- "knowledge": als Benji ontbrekende of verkeerde inhoudelijke kennis had over een onderwerp

Antwoord ALLEEN in dit JSON formaat, geen tekst erbuiten:
{
  "probleem": "één zin wat er fout ging",
  "type": "rules" of "knowledge",
  "reden": "één zin waarom deze keuze",
  "toevoeging": "de concrete tekst die toegevoegd moet worden (bij rules: een bullet point stijl regel; bij knowledge: leeg laten)",
  "knowledge_question": "bij knowledge: de vraag in de knowledge base",
  "knowledge_answer": "bij knowledge: het antwoord voor Benji",
  "knowledge_category": "bij knowledge: de categorie (bijv. Rouw en verlies)"
}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 600,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json() as { content?: { type: string; text: string }[] };
    const text = data.content?.[0]?.text ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        return { probleem: "Kon niet analyseren", type: "rules", reden: "", toevoeging: text, knowledge_question: "", knowledge_answer: "", knowledge_category: "" };
      }
    }
    return { probleem: "Geen analyse beschikbaar", type: "rules", reden: "", toevoeging: "", knowledge_question: "", knowledge_answer: "", knowledge_category: "" };
  },
});
