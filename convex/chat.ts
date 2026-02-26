/**
 * CHAT FUNCTIES
 *
 * Dit bestand bevat alle functies voor chat sessies en berichten.
 * - Sessies starten en beheren
 * - Berichten versturen en ophalen
 * - Feedback registreren
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Openers per categorie (A/B test: variant 1, 2 of 3)
const OPENERS: Record<
  "verlies" | "verdriet" | "huisdier" | "hulp" | "gewoon",
  [string, string, string]
> = {
  gewoon: [
    "Gewoon praten kan ook. Waar wil je over beginnen?",
    "Soms wil je gewoon even kwijt. Ik luister. Wat wil je delen?",
    "Vertel me wat je bezighoudt. Er is geen goed of fout begin.",
  ],
  verlies: [
    "Iemand verliezen laat een leegte achter die moeilijk te beschrijven is. Neem de tijd. Ik luister.",
    "Het gemis van iemand die er niet meer is, kan overweldigend zijn. Je hoeft hier niets uit te leggen begin waar je wilt.",
    "Verlies doet pijn, op manieren die anderen niet altijd zien. Vertel me wat je kwijt wilt.",
  ],
  verdriet: [
    "Verdriet heeft geen handleiding. Wat je ook voelt, het is oké. Wat houdt je op dit moment het meest bezig?",
    "Soms weet je niet eens waar te beginnen. Dat hoeft ook niet. Deel gewoon wat er nu is.",
    "Het is zwaar om verdriet mee te dragen. Ik ben hier, zonder oordeel. Wat speelt er?",
  ],
  huisdier: [
    "Een huisdier is geen 'maar een dier'. Het is liefde, gezelschap, een stukje thuis. Vertel me over hem of haar.",
    "Dat gemis is echt, ook al begrijpt niet iedereen dat. Wil je me vertellen wie je mist?",
    "Afscheid nemen van een trouwe vriend doet pijn. Ik luister. Hoe heette je huisdier?",
  ],
  hulp: [
    "Dat je hulp overweegt is dapper. Wil je dat we samen kijken wat er is, of zoek je concrete opties?",
    "Soms heb je iemand nodig die getraind is om te helpen. Zal ik je laten zien welke mogelijkheden er zijn?",
    "De stap zetten om hulp te zoeken is niet makkelijk. Wat zou je het meest helpen op dit moment?",
  ],
};

const TOPIC_ID_TO_OPENER_KEY: Record<
  string,
  "verlies" | "verdriet" | "huisdier" | "hulp" | "gewoon"
> = {
  "verlies-dierbare": "verlies",
  "omgaan-verdriet": "verdriet",
  "afscheid-huisdier": "huisdier",
  "professionele-hulp": "hulp",
  "gewoon-praten": "gewoon",
};

// ============================================================================
// QUERIES (Data ophalen)
// ============================================================================

/**
 * Haal een specifieke chat sessie op
 */
export const getSession = query({
  args: { sessionId: v.id("chatSessions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sessionId);
  },
});

/**
 * Haal alle berichten van een sessie op
 */
export const getMessages = query({
  args: {
    sessionId: v.id("chatSessions"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("chatMessages")
      .withIndex("by_session", (q) =>
        q.eq("sessionId", args.sessionId)
      )
      .order("asc"); // Oudste eerst (chronologische volgorde)

    const messages = await query.collect();

    // Limiteer als opgegeven
    if (args.limit) {
      return messages.slice(-args.limit); // Laatste N berichten
    }

    return messages;
  },
});

/**
 * Haal alle sessies van een gebruiker op
 */
export const getUserSessions = query({
  args: {
    userId: v.optional(v.string()),
    userEmail: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Gebruik index zodat alleen de sessies van de opgegeven gebruiker worden opgehaald
    // en niet alle sessies van alle gebruikers
    let sessions;
    if (args.userId) {
      sessions = await ctx.db
        .query("chatSessions")
        .withIndex("by_user", (q) => q.eq("userId", args.userId!))
        .collect();
    } else {
      // Geen userId opgegeven: lege lijst teruggeven (geen volledige dump)
      return [];
    }

    // Extra filter op email als opgegeven
    let filtered = sessions;
    if (args.userEmail) {
      filtered = sessions.filter((s) => s.userEmail === args.userEmail);
    }

    // Sorteer op lastActivityAt (nieuwste eerst)
    const sorted = filtered.sort((a, b) => b.lastActivityAt - a.lastActivityAt);

    // Limiteer als opgegeven
    return args.limit ? sorted.slice(0, args.limit) : sorted;
  },
});

/**
 * Haal recente actieve sessies op
 * Handig voor admin dashboard
 */
export const getActiveSessions = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("chatSessions")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    // Sorteer op lastActivityAt (nieuwste eerst)
    const sorted = sessions.sort((a, b) => b.lastActivityAt - a.lastActivityAt);

    const limit = args.limit || 50;
    return sorted.slice(0, limit);
  },
});

/**
 * Tel aantal berichten in een sessie
 */
export const getMessageCount = query({
  args: { sessionId: v.id("chatSessions") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    return {
      total: messages.length,
      user: messages.filter((m) => m.role === "user").length,
      bot: messages.filter((m) => m.role === "bot").length,
    };
  },
});

/**
 * Tel aantal anonieme gesprekken (voor limiet van 5)
 */
export const countAnonymousSessions = query({
  args: { anonymousId: v.string() },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("chatSessions")
      .withIndex("by_anonymous", (q) => q.eq("anonymousId", args.anonymousId))
      .collect();
    return sessions.filter((s) => !s.userId).length;
  },
});

// ============================================================================
// MUTATIONS (Data wijzigen)
// ============================================================================

/**
 * Start een nieuwe chat sessie
 */
export const startSession = mutation({
  args: {
    userId: v.optional(v.string()),
    userEmail: v.optional(v.string()),
    userName: v.optional(v.string()),
    anonymousId: v.optional(v.string()),
    topic: v.optional(v.string()),
    metadata: v.optional(
      v.object({
        browser: v.optional(v.string()),
        device: v.optional(v.string()),
        referrer: v.optional(v.string()),
        language: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Anonieme bezoeker: blokkeer nieuwe sessie als limiet van 5 bereikt is
    if (!args.userId && args.anonymousId) {
      const sessions = await ctx.db
        .query("chatSessions")
        .withIndex("by_anonymous", (q) => q.eq("anonymousId", args.anonymousId!))
        .collect();
      const anonCount = sessions.filter((s) => !s.userId).length;
      if (anonCount >= 5) {
        throw new Error("GUEST_LIMIT_REACHED");
      }
    }

    // Track conversation count voor logged-in users (niet voor admin)
    const exemptEmail = process.env.ADMIN_EXEMPT_EMAIL;
    if (args.userId && (!exemptEmail || args.userEmail !== exemptEmail)) {
      const month = `${new Date(now).getFullYear()}-${String(new Date(now).getMonth() + 1).padStart(2, "0")}`;

      const existing = await ctx.db
        .query("conversationUsage")
        .withIndex("by_user_month", (q) =>
          q.eq("userId", args.userId!).eq("month", month)
        )
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          conversationCount: existing.conversationCount + 1,
          lastConversationAt: now,
        });
      } else {
        await ctx.db.insert("conversationUsage", {
          userId: args.userId,
          month,
          conversationCount: 1,
          lastConversationAt: now,
          createdAt: now,
        });
      }
    }

    const sessionId = await ctx.db.insert("chatSessions", {
      userId: args.userId,
      userEmail: args.userEmail,
      userName: args.userName,
      anonymousId: args.anonymousId,
      topic: args.topic,
      status: "active",
      wasResolved: false,
      metadata: args.metadata,
      startedAt: now,
      lastActivityAt: now,
    });

    return sessionId;
  },
});

/**
 * Koppel een anonieme chat-sessie aan een gebruiker (na inloggen).
 * Zo blijven eerdere gesprekken behouden op het account.
 */
export const linkSessionToUser = mutation({
  args: {
    sessionId: v.id("chatSessions"),
    userId: v.string(),
    userEmail: v.optional(v.string()),
    userName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Sessie niet gevonden");
    }
    // Alleen anonieme sessies koppelen (geen overschrijven van bestaande gebruiker)
    if (session.userId) {
      return;
    }
    await ctx.db.patch(args.sessionId, {
      userId: args.userId,
      userEmail: args.userEmail ?? undefined,
      userName: args.userName ?? undefined,
    });
  },
});

/** Gepersonaliseerde openers voor ingelogde gebruikers (vanuit account) */
const PERSONALIZED_OPENERS: string[] = [
  "Hoi {naam}, fijn dat je er weer bent! Waar wil je vandaag over praten?",
  "Hey {naam}, welkom terug! Ik ben hier voor je. Wat speelt er?",
  "Hoi {naam}, goed je weer te zien. Waar kan ik je mee helpen?",
];

/**
 * Voeg een gepersonaliseerde opener toe (vanuit account/dashboard).
 * Gebruikt de naam van de gebruiker in de openingszin.
 */
export const addPersonalizedOpenerToSession = mutation({
  args: {
    sessionId: v.id("chatSessions"),
    userName: v.string(),
  },
  handler: async (ctx, args) => {
    const firstName = args.userName.trim().split(/\s+/)[0] || args.userName;
    const template = PERSONALIZED_OPENERS[Math.floor(Math.random() * PERSONALIZED_OPENERS.length)];
    const openerText = template.replace("{naam}", firstName);
    const now = Date.now();

    await ctx.db.insert("chatMessages", {
      sessionId: args.sessionId,
      role: "bot",
      content: openerText,
      isAiGenerated: false,
      createdAt: now,
    });

    await ctx.db.patch(args.sessionId, {
      lastActivityAt: now,
    });

    return args.sessionId;
  },
});

/**
 * Voeg opener-bericht toe aan sessie (na onderwerp-klik).
 * Toont een van de openingszinnen die bij het gekozen onderwerp horen.
 * Bij onbekend onderwerp: generieke opener.
 */
export const addOpenerToSession = mutation({
  args: {
    sessionId: v.id("chatSessions"),
    topicId: v.string(),
  },
  handler: async (ctx, args) => {
    const key = TOPIC_ID_TO_OPENER_KEY[args.topicId];
    const variants = key && OPENERS[key] ? OPENERS[key] : OPENERS.verdriet;
    const variant = (Math.floor(Math.random() * variants.length) + 1) as 1 | 2 | 3;
    const openerText = variants[Math.min(variant - 1, variants.length - 1)];
    const now = Date.now();

    await ctx.db.insert("chatMessages", {
      sessionId: args.sessionId,
      role: "bot",
      content: openerText,
      isAiGenerated: false,
      createdAt: now,
    });

    if (key) {
      await ctx.db.insert("openerTests", {
        conversationId: args.sessionId,
        topic: key,
        openerVariant: variant,
        userContinued: false,
        createdAt: now,
      });
    }

    await ctx.db.patch(args.sessionId, {
      lastActivityAt: now,
    });

    return { sessionId: args.sessionId, openerVariant: variant };
  },
});

/**
 * Voeg een gebruikersbericht toe aan de sessie
 */
export const sendUserMessage = mutation({
  args: {
    sessionId: v.id("chatSessions"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // Validatie
    if (args.content.trim().length === 0) {
      throw new Error("Bericht mag niet leeg zijn");
    }

    // Check of sessie bestaat en actief is
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Sessie niet gevonden");
    }
    if (session.status !== "active") {
      throw new Error("Deze sessie is niet meer actief");
    }

    const now = Date.now();

    // Voeg bericht toe
    const messageId = await ctx.db.insert("chatMessages", {
      sessionId: args.sessionId,
      role: "user",
      content: args.content.trim(),
      isAiGenerated: false,
      createdAt: now,
    });

    // Update lastActivityAt van sessie
    await ctx.db.patch(args.sessionId, {
      lastActivityAt: now,
    });

    // A/B test: markeer dat gebruiker doorpraatte na opener
    const openerTest = await ctx.db
      .query("openerTests")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.sessionId)
      )
      .first();
    if (openerTest && !openerTest.userContinued) {
      await ctx.db.patch(openerTest._id, { userContinued: true });
    }

    return messageId;
  },
});

/**
 * Voeg een bot antwoord toe aan de sessie
 */
export const sendBotMessage = mutation({
  args: {
    sessionId: v.id("chatSessions"),
    content: v.string(),
    knowledgeBaseId: v.optional(v.id("knowledgeBase")),
    confidenceScore: v.optional(v.number()),
    isAiGenerated: v.boolean(),
    generationMetadata: v.optional(
      v.object({
        model: v.optional(v.string()),
        tokensUsed: v.optional(v.number()),
        responseTime: v.optional(v.number()),
        error: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Voeg bot bericht toe
    const messageId = await ctx.db.insert("chatMessages", {
      sessionId: args.sessionId,
      role: "bot",
      content: args.content,
      knowledgeBaseId: args.knowledgeBaseId,
      confidenceScore: args.confidenceScore,
      isAiGenerated: args.isAiGenerated,
      generationMetadata: args.generationMetadata,
      createdAt: now,
    });

    // Update lastActivityAt van sessie
    await ctx.db.patch(args.sessionId, {
      lastActivityAt: now,
    });

    // Als er een knowledge base item gebruikt is, verhoog de usage count
    if (args.knowledgeBaseId) {
      const kb = await ctx.db.get(args.knowledgeBaseId);
      if (kb) {
        await ctx.db.patch(args.knowledgeBaseId, {
          usageCount: (kb.usageCount || 0) + 1,
          updatedAt: now,
        });
      }
    }

    return messageId;
  },
});

/**
 * Geef feedback op een specifiek bericht
 */
export const submitMessageFeedback = mutation({
  args: {
    messageId: v.id("chatMessages"),
    feedback: v.union(v.literal("helpful"), v.literal("not_helpful")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, {
      feedback: args.feedback,
    });

    return args.messageId;
  },
});

/**
 * Verwijder een gesprek (alleen voor de eigenaar van de sessie)
 */
export const deleteUserSession = mutation({
  args: {
    sessionId: v.id("chatSessions"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Gesprek niet gevonden");
    }
    if (session.userId !== args.userId) {
      throw new Error("Je kunt alleen je eigen gesprekken verwijderen");
    }

    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }
    await ctx.db.delete(args.sessionId);

    return { success: true };
  },
});

/**
 * Update sessie status
 */
export const updateSessionStatus = mutation({
  args: {
    sessionId: v.id("chatSessions"),
    status: v.union(
      v.literal("active"),
      v.literal("resolved"),
      v.literal("escalated"),
      v.literal("abandoned")
    ),
    wasResolved: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const updates: any = {
      status: args.status,
      lastActivityAt: Date.now(),
    };

    // Als sessie beëindigd wordt, zet endedAt
    if (args.status !== "active") {
      updates.endedAt = Date.now();
    }

    // Update wasResolved als opgegeven
    if (args.wasResolved !== undefined) {
      updates.wasResolved = args.wasResolved;
    }

    await ctx.db.patch(args.sessionId, updates);

    return args.sessionId;
  },
});

/**
 * Beëindig een sessie met feedback
 */
export const endSession = mutation({
  args: {
    sessionId: v.id("chatSessions"),
    status: v.union(
      v.literal("resolved"),
      v.literal("escalated"),
      v.literal("abandoned")
    ),
    rating: v.optional(v.number()),
    feedbackComment: v.optional(v.string()),
    wasResolved: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Bereken sessieduur en genereer samenvatting
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Sessie niet gevonden");
    }

    // Haal alle berichten op voor samenvatting
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    // Genereer korte samenvatting (eerste gebruikersvraag)
    const firstUserMessage = messages.find((m) => m.role === "user");
    const summary = firstUserMessage
      ? firstUserMessage.content.substring(0, 100) + "..."
      : "Geen berichten gevonden";

    // Update sessie
    await ctx.db.patch(args.sessionId, {
      status: args.status,
      wasResolved: args.wasResolved,
      rating: args.rating,
      feedbackComment: args.feedbackComment,
      summary,
      endedAt: now,
      lastActivityAt: now,
    });

    return args.sessionId;
  },
});

/**
 * Markeer een sessie als abandoned (verlaten)
 * Wordt automatisch aangeroepen voor sessies die >30 min inactief zijn
 */
export const markSessionsAsAbandoned = mutation({
  args: {
    inactiveThresholdMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const threshold = args.inactiveThresholdMinutes || 30;
    const cutoffTime = Date.now() - threshold * 60 * 1000;

    // Vind alle actieve sessies die langer dan threshold inactief zijn
    const activeSessions = await ctx.db
      .query("chatSessions")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    const abandoned = activeSessions.filter(
      (s) => s.lastActivityAt < cutoffTime
    );

    // Update ze naar abandoned
    for (const session of abandoned) {
      await ctx.db.patch(session._id, {
        status: "abandoned",
        wasResolved: false,
        endedAt: Date.now(),
      });
    }

    return {
      count: abandoned.length,
      sessionIds: abandoned.map((s) => s._id),
    };
  },
});

/**
 * Voeg algemene feedback toe
 */
export const submitGeneralFeedback = mutation({
  args: {
    sessionId: v.optional(v.id("chatSessions")),
    userId: v.optional(v.string()),
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
    imageStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    // Validatie
    if (args.comment.trim().length === 0) {
      throw new Error("Feedback mag niet leeg zijn");
    }

    const feedbackId = await ctx.db.insert("userFeedback", {
      sessionId: args.sessionId,
      userId: args.userId,
      feedbackType: args.feedbackType,
      comment: args.comment.trim(),
      rating: args.rating,
      userEmail: args.userEmail,
      imageStorageId: args.imageStorageId,
      status: "new",
      createdAt: Date.now(),
    });

    return feedbackId;
  },
});

/**
 * Sla een AI-gegenereerde samenvatting op bij een sessie
 */
export const setSessionSummary = mutation({
  args: { sessionId: v.id("chatSessions"), summary: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      summary: args.summary,
      summarizedAt: Date.now(),
    });
  },
});

/**
 * Haal sessies op die nog geen AI-samenvatting hebben (voor achtergrondverwerking)
 */
export const getSessionsToSummarize = query({
  args: {
    userId: v.string(),
    excludeSessionId: v.id("chatSessions"),
  },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("chatSessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(15);

    return sessions
      .filter((s) => s._id !== args.excludeSessionId && !s.summarizedAt)
      .slice(0, 3)
      .map((s) => ({ sessionId: s._id, startedAt: s.startedAt }));
  },
});

/**
 * Haal recente AI-samenvattingen op van eerdere sessies
 */
export const getRecentSummaries = query({
  args: {
    userId: v.string(),
    excludeSessionId: v.id("chatSessions"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("chatSessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(25);

    return sessions
      .filter((s) => s._id !== args.excludeSessionId && s.summarizedAt && s.summary)
      .slice(0, args.limit ?? 4)
      .map((s) => ({
        startedAt: s.startedAt,
        summary: s.summary!,
      }));
  },
});

/**
 * Haal chat geschiedenis op voor export
 */
export const exportChatHistory = query({
  args: {
    sessionId: v.id("chatSessions"),
  },
  handler: async (ctx, args) => {
    // Haal sessie op
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Sessie niet gevonden");
    }

    // Haal alle berichten op
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("asc")
      .collect();

    // Format voor export
    return {
      session: {
        id: session._id,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        status: session.status,
        rating: session.rating,
        wasResolved: session.wasResolved,
      },
      messages: messages.map((m) => ({
        timestamp: m.createdAt,
        role: m.role,
        content: m.content,
        feedback: m.feedback,
      })),
      messageCount: messages.length,
    };
  },
});
