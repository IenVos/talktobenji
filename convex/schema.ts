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
    lastActiveAt: v.optional(v.number()),       // Laatste keer ingelogd of gesprek gestart
    deletionWarningSentAt: v.optional(v.number()), // Tijdstip waarschuwingsmail gestuurd
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
      v.literal("abandoned"),
      v.literal("reviewed")
    ),
    reviewedAt: v.optional(v.number()), // Tijdstip admin het gesprek heeft beoordeeld
    wasResolved: v.boolean(),
    rating: v.optional(v.number()),
    feedbackComment: v.optional(v.string()),
    summary: v.optional(v.string()),
    summaryEmbedding: v.optional(v.array(v.float64())),
    summarizedAt: v.optional(v.number()), // Tijdstip AI-samenvatting gegenereerd
    adminRapport: v.optional(v.string()), // Kwaliteitsrapport voor beheerder (geen citaten)
    adminRapportAt: v.optional(v.number()), // Tijdstip rapport gegenereerd
    rapportSuggestie: v.optional(v.string()), // Auto-gegenereerde trainingsuggestie (JSON)
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
    .index("by_anonymous", ["anonymousId"])
    .vectorIndex("by_summary_embedding", {
      vectorField: "summaryEmbedding",
      dimensions: 1024,
      filterFields: ["userId", "anonymousId"],
    }),

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
    embedding: v.optional(v.array(v.float64())),
  })
    .index("by_category", ["category"])
    .index("by_active", ["isActive"])
    .index("by_usage", ["usageCount"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1024,
      filterFields: ["isActive"],
    }),

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
      v.literal("gewoon"),
      v.literal("alleen"),
      v.literal("slaap")
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
    profileImageStorageId: v.optional(v.id("_storage")),
    accentColorChangedAt: v.optional(v.number()),
    backgroundImageChangedAt: v.optional(v.number()),
    lastSeenNotificationsAt: v.optional(v.number()),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // Gebruiker abonnementen
  userSubscriptions: defineTable({
    userId: v.string(),
    email: v.string(), // Voor admin override check
    subscriptionType: v.string(), // bijv. "free", "trial", "niet_alleen", "er_zijn", "troostende_woorden"
    billingPeriod: v.optional(v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("half_yearly"), v.literal("yearly"))),
    status: v.union(
      v.literal("active"),
      v.literal("cancelled"),
      v.literal("expired")
    ),
    startedAt: v.number(),
    expiresAt: v.optional(v.number()),
    cancelledAt: v.optional(v.number()),
    pricePaid: v.optional(v.number()), // Werkelijk betaald bedrag in euro's
    paymentProvider: v.optional(v.string()), // "mollie", "stripe", etc.
    externalSubscriptionId: v.optional(v.string()),
    reminderDay5Sent: v.optional(v.boolean()),
    reminderDay7Sent: v.optional(v.boolean()),
    renewalEmail1SentAt: v.optional(v.number()), // 30 dagen voor einde jaar-toegang
    renewalEmail2SentAt: v.optional(v.number()), // 15 dagen voor einde jaar-toegang
    renewalEmail3SentAt: v.optional(v.number()), // laatste dag jaar-toegang
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
    // Toon ook op de publieke 'Voor jou' pagina
    toonOpVoorJou: v.optional(v.boolean()),
    // Icoontje (lucide icon name, bijv. "heart")
    icon: v.optional(v.string()),
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

  // CTA blokken (bewerkbaar via admin, gebruikt op blog/pillar pagina's)
  ctaBlocks: defineTable({
    key: v.string(),                    // "blog_default", "pillar_default", of eigen naam
    label: v.string(),                  // weergavenaam in admin
    eyebrow: v.optional(v.string()),    // klein label bovenaan, bijv. "Talk To Benji"
    title: v.string(),                  // grote koptekst
    body: v.string(),                   // alinea tekst
    buttonText: v.string(),             // knoptekst
    footnote: v.optional(v.string()),   // kleine tekst onder de knop
    showImage: v.boolean(),             // toon app-screenshot
    imageStorageId: v.optional(v.id("_storage")), // eigen afbeelding (overschrijft app-screenshot)
    bgColor: v.optional(v.string()),    // achtergrondkleur hex, bijv. "#f5f0eb"
    borderColor: v.optional(v.string()), // randkleur hex, leeg = geen rand
    buttonColor: v.optional(v.string()), // knopkleur hex, bijv. "#6d84a8"
    buttonUrl: v.optional(v.string()),   // URL waar de knop naar linkt, bijv. "/lp/niet-alleen"
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  // E-mail templates (bewerkbaar via admin)
  emailTemplates: defineTable({
    key: v.string(),
    subject: v.string(),
    bodyText: v.string(), // platte tekst, \n\n = alinea-scheiding
    aanhef: v.optional(v.string()),
    buttonText: v.optional(v.string()),
    buttonUrl: v.optional(v.string()),
    upsellText: v.optional(v.string()),
    upsellUrl: v.optional(v.string()),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  // Cadeaucodes (gift codes — gegeven via checkout)
  giftCodes: defineTable({
    code: v.string(),                   // bijv. "BENJI-AB12"
    slug: v.string(),                   // product slug
    productName: v.string(),            // voor weergave op inwisselpage
    subscriptionType: v.string(),
    billingPeriod: v.optional(v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("half_yearly"), v.literal("yearly"))),
    accessDays: v.optional(v.number()),
    pricePaid: v.optional(v.number()),
    giverName: v.string(),
    giverEmail: v.string(),
    recipientEmail: v.optional(v.string()),    // ingevuld door gever (optioneel)
    recipientName: v.optional(v.string()),     // naam ontvanger (optioneel, voor begroeting)
    personalMessage: v.optional(v.string()),
    deliveryMethod: v.union(v.literal("direct"), v.literal("manual")),
    status: v.union(v.literal("pending"), v.literal("redeemed")),
    redeemedByEmail: v.optional(v.string()),
    redeemedAt: v.optional(v.number()),
    scheduledSendDate: v.optional(v.number()),    // timestamp: wanneer ontvanger-mail verstuurd moet worden
    recipientEmailSentAt: v.optional(v.number()), // timestamp: wanneer ontvanger-mail daadwerkelijk verstuurd is
    paymentIntentId: v.string(),
    createdAt: v.number(),
  }).index("by_code", ["code"])
    .index("by_payment_intent", ["paymentIntentId"]),

  // Admin sessies (voor admin panel beveiliging)
  adminSessions: defineTable({
    token: v.string(),
    expiresAt: v.number(),
  }).index("by_token", ["token"]),

  // Beveiligingsgebeurtenissen (login pogingen, rate limiting, etc.)
  securityEvents: defineTable({
    type: v.union(
      v.literal("failed_login"),
      v.literal("login_success"),
      v.literal("rate_limited"),
      v.literal("suspicious_activity"),
      v.literal("admin_action")
    ),
    ip: v.string(),
    timestamp: v.number(),
    details: v.optional(v.string()),
    isRead: v.optional(v.boolean()),
    note: v.optional(v.string()),
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_type", ["type"]),

  // Paginabezoeken (website analytics)
  pageViews: defineTable({
    path: v.string(),
    sessionId: v.string(),
    timestamp: v.number(),
    device: v.string(),
    duration: v.optional(v.number()),
    ip: v.optional(v.string()),
    referrer: v.optional(v.string()),
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_session_timestamp", ["sessionId", "timestamp"]),

  // Uitgesloten IP-adressen voor analytics
  analyticsExcludedIps: defineTable({
    ip: v.string(),
    label: v.optional(v.string()),
    createdAt: v.number(),
  }),

  analyticsExcludedEmails: defineTable({
    email: v.string(),
    label: v.optional(v.string()),
    createdAt: v.number(),
  }),

  // Koopknop klikken (website analytics)
  buttonClicks: defineTable({
    path: v.string(),
    buttonLabel: v.string(),
    sessionId: v.string(),
    timestamp: v.number(),
    ip: v.optional(v.string()),
  }).index("by_timestamp", ["timestamp"]),

  // Server-side geregistreerd "checkout bereikt"-event (betrouwbaar, niet blokkeerbaar
  // door de browser). Geen IP — alleen vanaf welke LP (source) + sessie voor ontdubbeling.
  checkoutReaches: defineTable({
    source: v.string(),      // pad van de LP waar de bezoeker vandaan kwam, bv. "/lp/je-mist-iemand"
    slug: v.string(),        // checkout-product slug
    sessionId: v.string(),
    timestamp: v.number(),
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_session", ["sessionId"]),

  // Funnel-stappen (waar haken bezoekers af). Eén event per sessie+stap telt;
  // ontdubbeling gebeurt in de query. category: "checkout" | "lp".
  //  - checkout-stappen: "reached" | "details" | "pay_click" | "purchased" (path = product-slug)
  //  - scroll-diepte (zowel lp als checkout): "load" | "scroll_25" | "scroll_50" | "scroll_75" | "scroll_100" (path = pad)
  funnelEvents: defineTable({
    category: v.string(),
    step: v.string(),
    path: v.string(),
    sessionId: v.string(),
    timestamp: v.number(),
    ip: v.optional(v.string()),
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_session", ["sessionId"]),

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

  // Niet Alleen — 30-daagse begeleidingscursus
  nietAlleenProfiles: defineTable({
    userId: v.string(),
    email: v.string(),
    naam: v.string(),
    startDatum: v.number(),
    verliesType: v.optional(v.string()), // "persoon" | "huisdier" | "scheiding" | etc.
    verliesNaam: v.optional(v.string()), // naam van wie/wat er gemist wordt
    profielFoto: v.optional(v.id("_storage")), // profielfoto van de gebruiker
    dagPrompts: v.array(v.object({
      dag: v.number(),
      tekst: v.string(),
      ingevuldOp: v.number(),
    })),
    dagFotos: v.optional(v.array(v.object({
      dag: v.number(),
      storageId: v.id("_storage"),
      uploadedAt: v.number(),
    }))),
    nietAlleenAnker: v.optional(v.object({
      tekst: v.string(),
      opgeslagenOpDag: v.number(),
      opgeslagenOp: v.number(),
    })),
    nietAlleenTerugblik: v.optional(v.array(v.object({
      dag: v.number(),
      tekst: v.string(),
      opgeslagenOp: v.number(),
    }))),
    nietAlleenOefeningGesloten: v.optional(v.array(v.number())),
    laatsteDagMail: v.optional(v.number()), // (verouderd) hoogste verstuurde dagnummer — vervangen door verzondenDagen
    verzondenDagen: v.optional(v.array(v.number())), // logboek: welke dag-nummers zijn écht als dagmail verstuurd
    inhaalWachtrij: v.optional(v.array(v.number())), // dag-nummers die alsnog (gespreid, 1/dag) nagestuurd moeten worden
    inhaalExcuusPending: v.optional(v.boolean()), // zet excuus-regel boven de eerstvolgende inhaalmail
    dag15MailVerzonden: v.optional(v.boolean()),
    dag28MailVerzonden: v.optional(v.boolean()),
    dag30MailVerzonden: v.optional(v.boolean()),
    dag37Verwerkt: v.optional(v.boolean()),
    accountGesloten: v.optional(v.boolean()),
    pendingAddonType: v.optional(v.string()),       // bijv. "benji_access" — activeren bij registratie
    pendingAddonAccessDays: v.optional(v.number()), // bijv. 30
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_email", ["email"]),

  // Niet Alleen — bewerkbare dagelijkse mail-overrides
  nietAlleenDagTemplates: defineTable({
    dag: v.number(),                      // 1-30
    verliesType: v.string(),              // "persoon" | "huisdier" | "scheiding"
    subject: v.string(),
    mailTekst: v.string(),
    updatedAt: v.number(),
  }).index("by_dag_type", ["dag", "verliesType"]),

  // Niet Alleen — beheerbare lijst van verliestypen (voor dropdown in checkout + email admin)
  verliesTypen: defineTable({
    code: v.string(),   // bijv. "werkloosheid"
    naam: v.string(),   // bijv. "Werkloosheid — verlies van werk"
    createdAt: v.number(),
    keuzePaginaLabel: v.optional(v.string()),   // knoptekst op keuzepagina
    keuzePaginaEmoji: v.optional(v.string()),   // emoji voor knop
    keuzePaginaLpSlug: v.optional(v.string()),  // slug van type-LP, bijv. "niet-alleen-voor-hulp-bij-verlies-van-huisdier"
  }).index("by_code", ["code"]),

  // Landingspagina's (beheerbaar via admin, publiek zichtbaar via /lp/[slug])
  landingPages: defineTable({
    slug: v.string(),           // URL slug, e.g. "niet-alleen-a"
    pageTitle: v.string(),      // Browser tab title
    isLive: v.boolean(),
    // Hero
    heroLabel: v.optional(v.string()),    // small text above h1, e.g. "30 dagen begeleiding"
    heroTitle: v.string(),
    heroSubtitle: v.optional(v.string()),
    heroBody: v.optional(v.string()),
    heroVideoUrl: v.optional(v.string()),
    heroImageUrl: v.optional(v.string()),
    ctaText: v.optional(v.string()),
    ctaUrl: v.optional(v.string()),
    ctaColor: v.optional(v.string()),
    ctaPrijsTekst: v.optional(v.string()),   // klein prijs-tekstje onder de knop, in knopkleur
    ctaMicroCopy: v.optional(v.string()),    // micro-copy regel onder het prijs-tekstje
    // Body sections (up to 2 text sections)
    section1Title: v.optional(v.string()),
    section1Text: v.optional(v.string()),
    section1ImageUrl: v.optional(v.string()),
    section2Title: v.optional(v.string()),
    section2Text: v.optional(v.string()),
    section2ImageUrl: v.optional(v.string()),
    // Product image — upload (storageId) of public path
    productImageStorageId: v.optional(v.id("_storage")),
    productImagePath: v.optional(v.string()),
    // Positie van productafbeelding: "after_hero" | "after_section1" | "after_section2" | "after_content" | "after_voor_wie" | "before_final_cta"
    productImagePosition: v.optional(v.string()),
    // Achtergrondafbeelding — upload (storageId) of gebruik standaard achtergrond
    bgImageStorageId: v.optional(v.id("_storage")),
    // "Voor wie" bullets — one item per line
    voorWieBullets: v.optional(v.string()),
    voorWieTitle: v.optional(v.string()),   // Custom title for bullet section, default "Dit is voor jou als..."
    // Reviews JSON: [{"tekst":"...","naam":"...","context":"..."}]
    ervaringenJson: v.optional(v.string()),
    // FAQ JSON: [{"vraag":"...","antwoord":"..."}]
    vragenJson: v.optional(v.string()),
    // "Wie is Ien" section
    wieIsTitle: v.optional(v.string()),
    wieIsText: v.optional(v.string()),
    // Final CTA block
    finalCtaTitle: v.optional(v.string()),
    finalCtaBody: v.optional(v.string()),
    // Sectie-zichtbaarheid
    hideErvaringen: v.optional(v.boolean()),
    hideVragen: v.optional(v.boolean()),
    hideWieIsIen: v.optional(v.boolean()),
    hideMidCta: v.optional(v.boolean()),
    hideWatJeKrijgt: v.optional(v.boolean()),
    hideStickyBar: v.optional(v.boolean()),
    stickyCtaEnabled: v.optional(v.boolean()), // aparte zwevende bestel-CTA-knop (verschijnt na scrollen)
    stickyCtaText: v.optional(v.string()),     // eigen tekst voor de zwevende knop (leeg = hoofd-CTA-tekst)
    stickyCtaColor: v.optional(v.string()),    // eigen kleur voor de zwevende knop (leeg = hoofd-CTA-kleur)
    hideHeader: v.optional(v.boolean()),
    // Categorie en volgorde voor admin-overzicht
    categorie: v.optional(v.string()),
    volgorde: v.optional(v.number()),
    // Footer
    footerText: v.optional(v.string()),
    footerCtaUrl: v.optional(v.string()),
    // Analytics
    trackAds: v.optional(v.boolean()), // Toon in advertentie-blok in analytics
    // Type-keuzepagina (lpType === "niet_alleen_keuze")
    lpType: v.optional(v.string()),
    typeCtaUrlPersoon: v.optional(v.string()),
    typeCtaUrlHuisdier: v.optional(v.string()),
    typeCtaUrlRelatie: v.optional(v.string()),
    typeCtaUrlEenzaamheid: v.optional(v.string()),
    typeCtaUrlKinderloos: v.optional(v.string()),
    typeButtonLabelPersoon: v.optional(v.string()),
    typeButtonLabelHuisdier: v.optional(v.string()),
    typeButtonLabelRelatie: v.optional(v.string()),
    typeButtonLabelEenzaamheid: v.optional(v.string()),
    typeButtonLabelKinderloos: v.optional(v.string()),
    // Prijsblokken (JSON: [{titel, subtitel, prijs, tekst, aanbevolen, ctaTekst, ctaUrl}])
    pricingBlocksJson: v.optional(v.string()),
    pricingTitel: v.optional(v.string()),
    pricingSubtitel: v.optional(v.string()),
    // Feature slider (JSON: [{afbeelding, video, titel, onderschrift}])
    featureSlidesJson: v.optional(v.string()),
    featureSliderLabel: v.optional(v.string()),
    featureSliderTitel: v.optional(v.string()),
    // Sectietitels
    ervaringenTitel: v.optional(v.string()),
    ervaringenSubtitel: v.optional(v.string()),
    faqTitel: v.optional(v.string()),
    faqSubtitel: v.optional(v.string()),
    voorWieSubtitel: v.optional(v.string()),
    // Vrije inhoudsblokken (JSON: [{titel, tekst}])
    contentBlocksJson: v.optional(v.string()),
    // "Wat je krijgt" iconenrij (JSON: [{icon, naam, omschrijving}]) — leeg = standaardrij
    watJeKrijgtJson: v.optional(v.string()),
    watJeKrijgtTitel: v.optional(v.string()),
    // Keuzepagina hero + keuzemoment
    kpHeroKop1: v.optional(v.string()),       // "Overdag hou je het vol."
    kpHeroKop2: v.optional(v.string()),       // "Maar 's nachts… voelt het zwaarder."
    kpHeroTekst: v.optional(v.string()),      // body tekst, alinea's gescheiden door lege regel
    kpHeroSlotzin: v.optional(v.string()),    // "Je hoeft het niet langer alleen te dragen."
    kpKeuzeLabel1: v.optional(v.string()),    // "Je hoeft het hier niet uit te leggen."
    kpKeuzeLabel2: v.optional(v.string()),    // "Kies gewoon wat het dichtst bij je ligt:"
    // Keuzepagina per-type inhoud (4 types: persoon, huisdier, relatie, kinderloos)
    kpH2Persoon: v.optional(v.string()),      // "Je mist iemand.|En niemand kan dat echt opvangen."
    kpTekstPersoon: v.optional(v.string()),   // body + vetgedrukte slotzin, alinea's via lege regel
    kpCitaatPersoon: v.optional(v.string()),  // tekst in het blauwe citaatblok
    kpVoordelenPersoon: v.optional(v.string()),// voordelen, één per regel
    kpCtaTekstPersoon: v.optional(v.string()),// "Start met Niet Alleen – Verlies Persoon (€37)"
    kpH2Huisdier: v.optional(v.string()),
    kpTekstHuisdier: v.optional(v.string()),
    kpCitaatHuisdier: v.optional(v.string()),
    kpVoordelenHuisdier: v.optional(v.string()),
    kpCtaTekstHuisdier: v.optional(v.string()),
    kpH2Relatie: v.optional(v.string()),
    kpTekstRelatie: v.optional(v.string()),
    kpCitaatRelatie: v.optional(v.string()),
    kpVoordelenRelatie: v.optional(v.string()),
    kpCtaTekstRelatie: v.optional(v.string()),
    kpH2Eenzaamheid: v.optional(v.string()),
    kpTekstEenzaamheid: v.optional(v.string()),
    kpCitaatEenzaamheid: v.optional(v.string()),
    kpVoordelenEenzaamheid: v.optional(v.string()),
    kpCtaTekstEenzaamheid: v.optional(v.string()),
    kpH2Kinderloos: v.optional(v.string()),
    kpTekstKinderloos: v.optional(v.string()),
    kpCitaatKinderloos: v.optional(v.string()),
    kpVoordelenKinderloos: v.optional(v.string()),
    kpCtaTekstKinderloos: v.optional(v.string()),
    // Even Houvast — zwevende knop op deze LP (tussenstap voor wie nog niet koopt)
    houvastKnop: v.optional(v.boolean()),
    houvastType: v.optional(v.string()), // verliestype-code voor ?type= in de houvast-link
    noindex: v.optional(v.boolean()),
    metaDescription: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_slug", ["slug"]).index("by_live", ["isLive"]),

  // Houvast — gratis mini-gids (toegang via magic link token)
  houvasteProfielen: defineTable({
    email: v.string(),
    token: v.string(),
    name: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_token", ["token"]),

  // Even Houvast — bijhouden welke e-mailadressen al een brief kregen (max 1 per adres).
  houvastBrieven: defineTable({
    email: v.string(),
    sentAt: v.number(),
  }).index("by_email", ["email"]),

  // Checkout producten (beheerbaar via admin, publiek via /betalen/[slug])
  checkoutProducts: defineTable({
    slug: v.string(),
    name: v.string(),
    kortNaam: v.optional(v.string()), // Korte naam voor omzetpagina (bijv. "N.A." i.p.v. volledige naam)
    verliesType: v.optional(v.string()), // Als ingesteld → Niet Alleen mailreeks starten na aankoop ("persoon" | "huisdier" | "scheiding")
    description: v.optional(v.string()),
    priceInCents: v.number(),
    stripePriceId: v.optional(v.string()),
    subscriptionType: v.string(), // "alles_in_1" | "niet_alleen" | etc.
    buttonText: v.optional(v.string()),
    trustText: v.optional(v.string()), // geruststelling onder de betaalknop (bijv. "Veilig betalen · geen abonnement")
    quoteText: v.optional(v.string()), // geruststellende quote bóven de betaalknop (aanpasbaar per product)
    herroepingTitle: v.optional(v.string()), // kopje van het herroepingsrecht-vakje
    herroepingText: v.optional(v.string()), // vriendelijke uitleg over herroepingsrecht (mailadres wordt automatisch klikbaar)
    imageStorageId: v.optional(v.id("_storage")),
    isLive: v.boolean(),
    accessDays: v.optional(v.number()), // Aantal dagen toegang na aankoop (bijv. 30, 90, 365)
    // Bevestigingsmail na aankoop (optioneel, beheerbaar via admin)
    followUpEmailSubject: v.optional(v.string()),
    followUpEmailBody: v.optional(v.string()),
    giftEnabled: v.optional(v.boolean()), // Cadeau-optie tonen op checkout
    b2bEnabled: v.optional(v.boolean()), // "Zakelijke aankoop?" tonen op checkout (undefined = aan voor bestaande producten)
    giftVariants: v.optional(v.array(v.object({
      label: v.string(),       // "Maand", "Kwartaal", "Jaar"
      priceInCents: v.number(),
      billingPeriod: v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("half_yearly"), v.literal("yearly")),
      accessDays: v.number(),
    }))),
    // Kassakoopje: optioneel extra product dat de koper kan aanvinken
    addOnEnabled: v.optional(v.boolean()),        // Kassakoopje tonen op checkout
    addOnLabel: v.optional(v.string()),           // bijv. "30 dagen Benji"
    addOnDescription: v.optional(v.string()),     // bijv. "Praat 30 dagen met Benji"
    addOnPriceInCents: v.optional(v.number()),    // bijv. 1000 (€10)
    addOnType: v.optional(v.string()),            // "benji_access" | "" (leeg = geen speciale actie)
    addOnAccessDays: v.optional(v.number()),      // dagen toegang bij benji_access
    // Voordelen (vinkjes): korte voordeel-regels bovenaan de checkout (Calm-stijl)
    benefits: v.optional(v.array(v.string())),
    // Reviews: optionele recensies/testimonials tonen op checkout
    reviews: v.optional(v.array(v.object({
      author: v.string(),
      role: v.optional(v.string()),
      text: v.string(),
      imageStorageId: v.optional(v.id("_storage")), // optionele foto i.p.v. initiaal
    }))),
    // Extra tekstblokken: vrije blokken met optionele titel + inhoud + afbeelding
    extraTextBlocks: v.optional(v.array(v.object({
      title: v.optional(v.string()),
      content: v.string(),
      imageStorageId: v.optional(v.id("_storage")),
    }))),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_slug", ["slug"]).index("by_live", ["isLive"]),

  // Homepage FAQ (beheerbaar via admin)
  homepageFaq: defineTable({
    vraag: v.string(),
    antwoord: v.string(),
    linkTekst: v.optional(v.string()),
    linkHref: v.optional(v.string()),
    volgorde: v.number(),
    isActief: v.boolean(),
  }).index("by_volgorde", ["volgorde"]),

  // Pillar pagina's (SEO laag 2 — thematische gezaghebbende pagina's)
  pillars: defineTable({
    slug: v.string(),
    title: v.string(),
    seoTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    content: v.optional(v.string()),
    coverImageStorageId: v.optional(v.id("_storage")),
    faqItems: v.optional(v.array(v.object({ question: v.string(), answer: v.string() }))),
    internalLinks: v.optional(v.array(v.object({ label: v.string(), slug: v.string() }))),
    isLive: v.boolean(),
    kbSynced: v.optional(v.boolean()),
    sources: v.optional(v.string()),
    focusKeyword: v.optional(v.string()),    // Primair zoekwoord
    ctaKey: v.optional(v.string()),          // Welke CTA te tonen, bijv. "blog_default"
    excerptCtaKey: v.optional(v.string()),   // CTA direct onder "In het kort" blok
    anchorPhrases: v.optional(v.array(v.string())), // Zinnen die in andere artikelen automatisch naar deze pillar linken
    featuredSlugs: v.optional(v.array(v.string())), // Geselecteerde artikelen onderaan de pillar pagina (max 5)
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_slug", ["slug"]),

  // Blog artikelen (SEO + AEO + KB-koppeling)
  blogPosts: defineTable({
    slug: v.string(),
    title: v.string(),
    seoTitle: v.optional(v.string()),
    content: v.string(),
    excerpt: v.optional(v.string()),         // Samenvatting — ook naar kennisbank
    metaDescription: v.optional(v.string()), // SEO meta description
    coverImageStorageId: v.optional(v.id("_storage")),
    publishedAt: v.optional(v.number()),     // Kan in de toekomst liggen
    isLive: v.boolean(),
    faqItems: v.optional(v.array(v.object({
      question: v.string(),
      answer: v.string(),
    }))),
    internalLinks: v.optional(v.array(v.object({
      label: v.string(),
      slug: v.string(),
    }))),
    kbSynced: v.optional(v.boolean()),       // FAQ al gesynchroniseerd met kennisbank
    pillarSlug: v.optional(v.string()),      // Koppeling aan pillar pagina
    sources: v.optional(v.string()),         // Bronnen (één per regel)
    focusKeyword: v.optional(v.string()),    // Primair zoekwoord
    ctaKey: v.optional(v.string()),          // Welke CTA te tonen, bijv. "blog_default"
    excerptCtaKey: v.optional(v.string()),   // CTA direct onder "In het kort" blok
    tags: v.optional(v.array(v.string())),   // Inhoudelijke labels, bijv. ["kinderloosheid", "zwangerschap"]
    anchorPhrases: v.optional(v.array(v.string())), // Zinnen die in andere artikelen automatisch naar dit artikel linken
    noindex: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_slug", ["slug"]).index("by_published", ["publishedAt"]).index("by_pillar", ["pillarSlug"]),

  // Benji teasers (interactieve blokken in blog/pillar artikelen)
  benjiTeasers: defineTable({
    type: v.string(),        // unieke sleutel: "reflectie", "herinnering", "emotie", etc.
    label: v.string(),
    intro: v.string(),
    themeKey: v.string(),    // "primary" | "amber" | "teal" | "violet"
    downloadTitel: v.string(),
    bestandsnaam: v.string(),
    vragen: v.array(v.object({ vraag: v.string(), placeholder: v.string() })),
    buttonUrl: v.optional(v.string()),   // URL van de "Praat met Benji" knop
    buttonText: v.optional(v.string()),  // Tekst op de knop
    featureText: v.optional(v.string()), // Tekst onderaan: "Ontdek hoe Benji..."
    updatedAt: v.number(),
  }).index("by_type", ["type"]),

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

  // Bewerkbare paginateksten (homepage, landingspagina's, etc.)
  pageContent: defineTable({
    pageKey: v.string(),   // bijv. "homepage"
    content: v.string(),   // JSON string met bewerkbare velden
    updatedAt: v.number(),
  }).index("by_pageKey", ["pageKey"]),

  // Mensen om je heen — paginateksten (singleton)
  mensenopmjeheen_pagina: defineTable({
    hero_titel: v.string(),
    hero_subtitel: v.string(),
    slot_tekst: v.optional(v.string()),
    filter_lezen: v.optional(v.string()),
    filter_praten: v.optional(v.string()),
    filter_groep: v.optional(v.string()),
    filter_ander: v.optional(v.string()),
    filter_ander_blok_titel: v.optional(v.string()),
    filter_ander_blok_tekst: v.optional(v.string()),
  }),

  // Talk To People — filterbuttons
  t2p_filterbuttons: defineTable({
    tagId: v.string(),      // "lezen" | "praten" | "groep" | "ander" | custom
    tekst: v.string(),
    iconNaam: v.string(),   // "heart" | "chat" | "users" | "blog" | "paw" | "leaf"
    volgorde: v.number(),
    zichtbaar: v.boolean(),
  }),

  // Mensen om je heen — categorieën
  mensenopmjeheen_categorieen: defineTable({
    naam: v.string(),
    volgorde: v.number(),
    zichtbaar: v.boolean(),
    imageStorageId: v.optional(v.id("_storage")),
    filterTags: v.optional(v.array(v.string())),
    emoji: v.optional(v.string()),
  }),

  // Mensen om je heen — initiatieven
  mensenopmjeheen_initiatieven: defineTable({
    categorie_id: v.id("mensenopmjeheen_categorieen"),
    naam: v.string(),
    beschrijving: v.string(),
    url: v.string(),
    volgorde: v.number(),
    zichtbaar: v.boolean(),
    imageStorageId: v.optional(v.id("_storage")),
  }),
});
