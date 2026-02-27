import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "./authSchema";

export default defineSchema({
  ...authTables,

  // E-mail/wachtwoord voor in-app inloggen (gekoppeld aan users)
  credentials: defineTable({
    userId: v.id("users"),
    email: v.string(),
    hashedPassword: v.string(),
    passwordChangedAt: v.optional(v.number()),
  }).index("email", ["email"]),

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
    anonymousId: v.optional(v.string()),
    topic: v.optional(v.string()),
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
    summarizedAt: v.optional(v.number()), // Tijdstip AI-samenvatting gegenereerd
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
    .index("by_status", ["status"])
    .index("by_anonymous", ["anonymousId"]),

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
    feedbackHandled: v.optional(v.boolean()),
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
    alternativeAnswers: v.optional(v.array(v.string())),
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

  // A/B test: welke opener leidt tot doorpraten
  openerTests: defineTable({
    conversationId: v.id("chatSessions"),
    topic: v.union(
      v.literal("verlies"),
      v.literal("verdriet"),
      v.literal("huisdier"),
      v.literal("hulp"),
      v.literal("gewoon")
    ),
    openerVariant: v.union(v.literal(1), v.literal(2), v.literal(3)),
    userContinued: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_topic", ["topic"]),

  // Bronnen (RAG): PDF's, URL's, handleidingen voor extra context
  sources: defineTable({
    title: v.string(),
    type: v.union(v.literal("url"), v.literal("pdf")),
    url: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
    extractedText: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_active", ["isActive"])
    .index("by_type", ["type"]),

  // Vragen waar de AI geen antwoord op had (voor Knowledge Base-aanvulling)
  unansweredQuestions: defineTable({
    userQuestion: v.string(),
    sessionId: v.id("chatSessions"),
    createdAt: v.number(),
  })
    .index("by_created", ["createdAt"]),

  // Gebruikersvoorkeuren (per userId, voor personalisatie)
  userPreferences: defineTable({
    userId: v.string(),
    userContext: v.optional(v.string()), // Achtergrond/verhaal van gebruiker voor Benji
    accentColor: v.optional(v.string()),
    backgroundImageStorageId: v.optional(v.id("_storage")),
    lastSeenNotificationsAt: v.optional(v.number()),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // Gebruiker abonnementen
  userSubscriptions: defineTable({
    userId: v.string(),
    email: v.string(), // Voor admin override check
    subscriptionType: v.union(
      v.literal("free"),
      v.literal("trial"),
      v.literal("uitgebreid"),
      v.literal("alles_in_1")
    ),
    billingPeriod: v.optional(v.union(v.literal("monthly"), v.literal("yearly"))),
    status: v.union(
      v.literal("active"),
      v.literal("cancelled"),
      v.literal("expired")
    ),
    startedAt: v.number(),
    expiresAt: v.optional(v.number()),
    cancelledAt: v.optional(v.number()),
    paymentProvider: v.optional(v.string()), // "mollie", "stripe", etc.
    externalSubscriptionId: v.optional(v.string()),
    reminderDay5Sent: v.optional(v.boolean()),
    reminderDay7Sent: v.optional(v.boolean()),
    cancellationReason: v.optional(v.string()),
    cancellationValuable: v.optional(v.string()),
    cancellationWouldRecommend: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_email", ["email"]),

  // Gesprekken teller (voor free tier limiet)
  conversationUsage: defineTable({
    userId: v.string(),
    month: v.string(), // YYYY-MM
    conversationCount: v.number(),
    lastConversationAt: v.number(),
    createdAt: v.number(),
  }).index("by_user_month", ["userId", "month"]),

  // Notities / reflecties (per gebruiker)
  notes: defineTable({
    userId: v.string(),
    title: v.optional(v.string()),
    content: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // Emotie-tracker – dagelijkse stemming (1-5 schaal)
  emotionEntries: defineTable({
    userId: v.string(),
    date: v.string(), // YYYY-MM-DD
    mood: v.number(), // 1-5
    note: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user_date", ["userId", "date"]),

  // Persoonlijke doelen of wensen
  goals: defineTable({
    userId: v.string(),
    content: v.string(),
    completed: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // Dagelijkse check-in antwoorden (legacy, voor migratie)
  checkInAnswers: defineTable({
    userId: v.string(),
    date: v.string(), // YYYY-MM-DD
    questionKey: v.union(
      v.literal("hoe_voel"),
      v.literal("wat_hielp"),
      v.literal("waar_dankbaar")
    ),
    answer: v.string(),
    createdAt: v.number(),
  }).index("by_user_date", ["userId", "date"]),

  // Check-in entries – meerdere per dag, met datum en tijd
  checkInEntries: defineTable({
    userId: v.string(),
    hoe_voel: v.string(),
    wat_hielp: v.string(),
    waar_dankbaar: v.string(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]).index("by_user_created", ["userId", "createdAt"]),

  // Inspiratie & troost (admin beheerd, klant zichtbaar)
  inspiratieItems: defineTable({
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    type: v.union(
      v.literal("gedicht"),
      v.literal("citaat"),
      v.literal("tekst"),
      v.literal("overig"),
      v.literal("pdf")
    ),
    order: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    // PDF/ebook: PDF-bestand + coverafbeelding
    pdfStorageId: v.optional(v.id("_storage")),
    imageStorageId: v.optional(v.id("_storage")),
    // Drip: datum (ms) vanaf wanneer item zichtbaar wordt; null/afwezig = direct zichtbaar
    publishFrom: v.optional(v.union(v.number(), v.null())),
    // Prijs in centen; null/afwezig = geen Koop-knop
    priceCents: v.optional(v.union(v.number(), v.null())),
  })
    .index("by_active_order", ["isActive", "order"]),

  // Handreikingen (admin beheerd, klant zichtbaar)
  handreikingenItems: defineTable({
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    order: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    // PDF/ebook: PDF-bestand + coverafbeelding
    pdfStorageId: v.optional(v.id("_storage")),
    imageStorageId: v.optional(v.id("_storage")),
    // Drip: datum (ms) vanaf wanneer item zichtbaar wordt; null/afwezig = direct zichtbaar
    publishFrom: v.optional(v.union(v.number(), v.null())),
    // Prijs in centen; null/afwezig = geen Koop-knop
    priceCents: v.optional(v.union(v.number(), v.null())),
    // Oefening slug: koppelt kaart aan geleide oefening (bijv. "brief")
    exerciseSlug: v.optional(v.string()),
    // Knoptekst voor de oefening-knop (standaard "Begin oefening")
    exerciseButtonLabel: v.optional(v.string()),
    // Icoonnaam (lucide-react) voor de kaart; bijv. "pencil", "waves", "heart"
    icon: v.optional(v.string()),
    // Gratis voor iedereen (geen abonnement nodig); standaard false = alleen Alles in 1
    isFree: v.optional(v.boolean()),
  })
    .index("by_active_order", ["isActive", "order"]),

  // Iets voor onderweg (admin beheerd, klant zichtbaar)
  onderwegItems: defineTable({
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    order: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    // Afbeelding
    imageStorageId: v.optional(v.id("_storage")),
    // Drip: datum (ms) vanaf wanneer item zichtbaar wordt; null/afwezig = direct zichtbaar
    publishFrom: v.optional(v.union(v.number(), v.null())),
    // Prijs in centen; null/afwezig = geen prijs
    priceCents: v.optional(v.union(v.number(), v.null())),
    // Betaallink (URL naar betalingspagina)
    paymentUrl: v.optional(v.union(v.string(), v.null())),
    // Tekst op de bestelknop (standaard "Bestellen")
    buttonLabel: v.optional(v.union(v.string(), v.null())),
  })
    .index("by_active_order", ["isActive", "order"]),

  // Herinneringen (schatkist met mooie momenten)
  memories: defineTable({
    userId: v.string(),
    text: v.string(),
    imageStorageId: v.optional(v.id("_storage")),
    emotion: v.optional(v.string()),
    memoryDate: v.optional(v.string()), // YYYY-MM-DD
    source: v.optional(v.union(v.literal("manual"), v.literal("chat"), v.literal("handreikingen"), v.literal("inspiratie"))),
    // Optionele kaarttitel (voor handreikingen en inspiratie)
    title: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_created", ["userId", "createdAt"]),

  // Wachtwoord reset tokens
  passwordResetTokens: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
  }).index("by_token", ["token"]),

  // E-mail verificatie OTP tokens
  emailVerificationTokens: defineTable({
    userId: v.id("users"),
    email: v.string(),
    hashedOtp: v.string(),
    expiresAt: v.number(),
  }).index("by_email", ["email"]),

  // Push notificatie subscriptions
  pushSubscriptions: defineTable({
    userId: v.string(),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_endpoint", ["endpoint"]),

  // Push notificaties (verstuurde berichten)
  pushNotifications: defineTable({
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
    sentBy: v.string(), // "admin"
    sentAt: v.number(),
    recipientCount: v.number(),
    recipients: v.optional(v.array(v.string())), // userIds die deze notificatie ontvingen
  })
    .index("by_sent", ["sentAt"]),

  // Support FAQ (account-vragen, beheerbaar via admin)
  supportFaq: defineTable({
    question: v.string(),
    answer: v.string(),
    category: v.string(), // "account" | "abonnement" | "gebruik" | "technisch" | "privacy"
    order: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_active_order", ["isActive", "order"]),

  // E-mail templates (bewerkbaar via admin)
  emailTemplates: defineTable({
    key: v.string(),      // "trial_day5" | "trial_day7"
    subject: v.string(),
    bodyText: v.string(), // platte tekst, \n\n = alinea-scheiding
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  // Admin sessies (voor admin panel beveiliging)
  adminSessions: defineTable({
    token: v.string(),
    expiresAt: v.number(),
  }).index("by_token", ["token"]),

  // Aankomende functies (beheerbaar via admin)
  comingSoonFeatures: defineTable({
    featureId: v.string(),   // slug voor vote-tracking
    iconName: v.string(),    // naam van Lucide icon
    title: v.string(),
    description: v.string(),
    section: v.string(),     // "herinneringen" | "inspiratie" | "handreikingen" | "checkins" | "account"
    order: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_section", ["section", "isActive"])
    .index("by_order", ["isActive", "order"]),

  // Feature stemmen (aankomende functies)
  featureVotes: defineTable({
    featureId: v.string(),
    userId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_feature", ["featureId"])
    .index("by_user_feature", ["userId", "featureId"]),

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

  // Reviews / testimonials (beheerbaar via admin, zichtbaar op homepage)
  testimonials: defineTable({
    name: v.string(),       // Weergavenaam, bijv. "Anne" of "Thomas, 34"
    quote: v.string(),      // De reviewtekst
    stars: v.number(),      // 1–5
    order: v.number(),
    isActive: v.boolean(),
    // Status: "approved" = zichtbaar, "pending" = wacht op goedkeuring, "rejected" = afgewezen
    status: v.optional(v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"))),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_active_order", ["isActive", "order"]),
});
