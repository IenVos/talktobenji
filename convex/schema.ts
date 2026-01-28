import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Bot instellingen (knowledge + rules)
  botSettings: defineTable({
    knowledge: v.string(),
    rules: v.string(),
    updatedAt: v.number(),
  }),


  // Chat sessies
  chatSessions: defineTable({
    userId: v.optional(v.string()),
    userEmail: v.optional(v.string()),
    userName: v.optional(v.string()),
    status: v.union(
      v.literal("active"),
      v.literal("resolved"),
      v.literal("escalated"),
      v.literal("abandoned")
    ),
    wasResolved: v.boolean(),
    rating: v.optional(v.number()),
    feedbackComment: v.optional(v.string()),
    summary: v.optional(v.string()),
    metadata: v.optional(
      v.object({
        browser: v.optional(v.string()),
        device: v.optional(v.string()),
        referrer: v.optional(v.string()),
        language: v.optional(v.string()),
      })
    ),
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    lastActivityAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  // Chat berichten
  chatMessages: defineTable({
    sessionId: v.id("chatSessions"),
    role: v.union(v.literal("user"), v.literal("bot")),
    content: v.string(),
    knowledgeBaseId: v.optional(v.id("knowledgeBase")),
    confidenceScore: v.optional(v.number()),
    feedback: v.optional(
      v.union(v.literal("helpful"), v.literal("not_helpful"))
    ),
    isAiGenerated: v.boolean(),
    generationMetadata: v.optional(
      v.object({
        model: v.optional(v.string()),
        tokensUsed: v.optional(v.number()),
        responseTime: v.optional(v.number()),
        error: v.optional(v.string()),
      })
    ),
    createdAt: v.number(),
  }).index("by_session", ["sessionId"]),

  // Kennisbank (Q&A) - Meertalig (Nederlands + Engels)
  knowledgeBase: defineTable({
    // Nederlandse velden (verplicht)
    question: v.string(),
    answer: v.string(),
    alternativeQuestions: v.optional(v.array(v.string())),
    // Engelse velden (optioneel - voor meertalige support)
    questionEn: v.optional(v.string()),
    answerEn: v.optional(v.string()),
    alternativeQuestionsEn: v.optional(v.array(v.string())),
    // Gemeenschappelijke velden
    category: v.string(),
    tags: v.array(v.string()),
    priority: v.optional(v.number()),
    isActive: v.boolean(),
    usageCount: v.number(),
    averageRating: v.optional(v.number()),
    createdBy: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_active", ["isActive"])
    .index("by_usage", ["usageCount"]),

  // Escalaties
  escalations: defineTable({
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
    status: v.union(
      v.literal("pending"),
      v.literal("assigned"),
      v.literal("in_progress"),
      v.literal("resolved"),
      v.literal("closed")
    ),
    assignedTo: v.optional(v.string()),
    assignedAt: v.optional(v.number()),
    resolution: v.optional(v.string()),
    agentNotes: v.optional(v.string()),
    shouldAddToKnowledgeBase: v.boolean(),
    resolvedAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_status", ["status", "priority"]),

  // Gebruikersfeedback
  userFeedback: defineTable({
    sessionId: v.optional(v.id("chatSessions")),
    feedbackType: v.union(
      v.literal("bug"),
      v.literal("suggestion"),
      v.literal("compliment"),
      v.literal("complaint"),
      v.literal("feature_request")
    ),
    comment: v.string(),
    rating: v.optional(v.number()),
    userEmail: v.optional(v.string()),
    status: v.union(
      v.literal("new"),
      v.literal("reviewed"),
      v.literal("implemented"),
      v.literal("declined")
    ),
    adminResponse: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_type", ["feedbackType"])
    .index("by_status", ["status"]),

  // Analytics
  analytics: defineTable({
    date: v.number(),
    stats: v.object({
      totalSessions: v.number(),
      totalMessages: v.number(),
      resolvedSessions: v.number(),
      escalatedSessions: v.number(),
      avgSessionDuration: v.number(),
      avgMessagesPerSession: v.number(),
      avgConfidenceScore: v.number(),
      avgUserSatisfaction: v.optional(v.number()),
      topQuestionsUsed: v.array(v.string()),
    }),
    generatedAt: v.number(),
  }).index("by_date", ["date"]),
});
