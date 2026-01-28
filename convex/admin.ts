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
import { mutation, query } from "./_generated/server";

// ============================================================================
// ESCALATION QUERIES
// ============================================================================

/**
 * Haal alle escalations op met filters
 */
export const getEscalations = query({
  args: {
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
  args: { escalationId: v.id("escalations") },
  handler: async (ctx, args) => {
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
    escalationId: v.id("escalations"),
    assignedTo: v.string(),
  },
  handler: async (ctx, args) => {
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
    escalationId: v.id("escalations"),
    resolution: v.string(),
    shouldAddToKnowledgeBase: v.boolean(),
    agentNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
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
    return args.limit ? sorted.slice(0, args.limit) : sorted;
  },
});

/**
 * Update feedback status
 */
export const updateFeedbackStatus = mutation({
  args: {
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

// ============================================================================
// ANALYTICS QUERIES
// ============================================================================

/**
 * Haal analytics voor een specifieke periode
 */
export const getAnalytics = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
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
    periodDays: v.optional(v.number()), // Aantal dagen terug
  },
  handler: async (ctx, args) => {
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
  handler: async (ctx) => {
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
    date: v.optional(v.number()), // Default: gisteren
  },
  handler: async (ctx, args) => {
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
export const exportAllData = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
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
