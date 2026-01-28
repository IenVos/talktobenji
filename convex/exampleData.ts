/**
 * VOORBEELD DATA VOOR TALKTOBENJI CHATBOT
 *
 * Dit bestand toont voorbeelden van hoe je data eruit ziet in elke tabel.
 * Je kunt deze voorbeelden gebruiken om te begrijpen hoe alles werkt.
 *
 * LET OP: Dit is GEEN code die je hoeft uit te voeren!
 * Het is alleen ter illustratie.
 */

// ============================================================================
// VOORBEELD 1: Knowledge Base (Q&A)
// ============================================================================

export const exampleKnowledgeBaseEntry = {
  question: "Hoe kan ik mijn wachtwoord resetten?",

  answer: "Je kunt je wachtwoord resetten door naar de login pagina te gaan en op 'Wachtwoord vergeten' te klikken. Je ontvangt dan een email met een reset link. Deze link is 1 uur geldig.",

  category: "account",

  tags: ["wachtwoord", "login", "beveiliging", "account"],

  alternativeQuestions: [
    "Ik ben mijn wachtwoord vergeten",
    "Wachtwoord wijzigen",
    "Hoe reset ik mijn password",
    "Kan mijn wachtwoord niet meer herinneren"
  ],

  priority: 5, // Hoge prioriteit want vaak gestelde vraag

  isActive: true,

  usageCount: 247, // Is al 247 keer gebruikt om vragen te beantwoorden

  averageRating: 4.5, // Gebruikers geven dit antwoord gemiddeld 4.5/5 sterren

  createdBy: "admin@talktobenji.com",

  createdAt: Date.now(),
  updatedAt: Date.now(),
};


// ============================================================================
// VOORBEELD 2: Chat Session
// ============================================================================

export const exampleChatSession = {
  userId: "anonymous_192.168.1.1", // Of een echte user ID als ingelogd

  userEmail: "gebruiker@example.com",

  userName: "Jan Janssen",

  status: "resolved", // Deze chat is succesvol afgerond

  summary: "Gebruiker had een vraag over wachtwoord reset procedure",

  rating: 5, // Gebruiker gaf 5 sterren aan de chat

  feedbackComment: "Super snel geholpen!",

  wasResolved: true, // Chatbot kon de vraag beantwoorden

  metadata: {
    browser: "Chrome 120.0",
    device: "Desktop",
    referrer: "https://talktobenji.com/help",
    language: "nl"
  },

  startedAt: Date.now() - 300000, // Gestart 5 minuten geleden
  endedAt: Date.now(), // Zojuist beëindigd
  lastActivityAt: Date.now(),
};


// ============================================================================
// VOORBEELD 3: Chat Messages (een conversatie)
// ============================================================================

export const exampleConversation = [
  // Bericht 1: Gebruiker stelt een vraag
  {
    sessionId: "k1234567890", // ID van de chat sessie

    role: "user",

    content: "Hey, ik kan niet meer inloggen. Wat moet ik doen?",

    isAiGenerated: false,

    createdAt: Date.now() - 240000, // 4 minuten geleden
  },

  // Bericht 2: Bot antwoordt
  {
    sessionId: "k1234567890",

    role: "bot",

    content: "Het spijt me dat je problemen hebt met inloggen. Kun je aangeven wat er precies gebeurt? Krijg je een foutmelding of ben je je wachtwoord vergeten?",

    knowledgeBaseId: undefined, // Dit was een algemene follow-up vraag

    confidenceScore: 0.8, // AI is 80% zeker van dit antwoord

    isAiGenerated: true,

    generationMetadata: {
      model: "claude-haiku-4-5-20251001",
      tokensUsed: 150,
      responseTime: 1200, // 1.2 seconden
    },

    feedback: "helpful", // Gebruiker vond dit nuttig

    createdAt: Date.now() - 220000, // 3.5 minuten geleden
  },

  // Bericht 3: Gebruiker geeft meer info
  {
    sessionId: "k1234567890",

    role: "user",

    content: "Ik ben mijn wachtwoord vergeten denk ik",

    isAiGenerated: false,

    createdAt: Date.now() - 180000, // 3 minuten geleden
  },

  // Bericht 4: Bot geeft oplossing uit kennisbank
  {
    sessionId: "k1234567890",

    role: "bot",

    content: "Je kunt je wachtwoord resetten door naar de login pagina te gaan en op 'Wachtwoord vergeten' te klikken. Je ontvangt dan een email met een reset link. Deze link is 1 uur geldig.",

    knowledgeBaseId: "kb9876543210", // Verwijst naar Q&A uit kennisbank

    confidenceScore: 0.95, // Zeer zeker dat dit het juiste antwoord is

    isAiGenerated: false, // Dit kwam direct uit de kennisbank

    generationMetadata: {
      model: "claude-haiku-4-5-20251001",
      tokensUsed: 80,
      responseTime: 800,
    },

    feedback: "helpful",

    createdAt: Date.now() - 160000, // 2.5 minuten geleden
  },

  // Bericht 5: Gebruiker bedankt
  {
    sessionId: "k1234567890",

    role: "user",

    content: "Perfect, dankjewel!",

    isAiGenerated: false,

    createdAt: Date.now() - 120000, // 2 minuten geleden
  },
];


// ============================================================================
// VOORBEELD 4: Escalation (doorverwijzing naar mens)
// ============================================================================

export const exampleEscalation = {
  sessionId: "k9999999999",

  originalQuestion: "Ik heb een betaling gedaan maar zie deze niet terug op mijn factuur. Het gaat om €500 en dit moet echt snel opgelost worden!",

  reason: "complex_issue", // Te complex voor de bot

  priority: "urgent", // Gaat om geld, dus urgent

  status: "assigned", // Al toegewezen aan een support medewerker

  assignedTo: "support.agent.emma@talktobenji.com",

  agentNotes: "Gebruiker belt ook, dubbele betaling gevonden in systeem. Aan het uitzoeken met finance team.",

  resolution: undefined, // Nog niet opgelost

  shouldAddToKnowledgeBase: true, // Dit komt vaker voor, toevoegen aan kennisbank

  createdAt: Date.now() - 1800000, // 30 minuten geleden
  assignedAt: Date.now() - 1200000, // 20 minuten geleden toegewezen
  resolvedAt: undefined, // Nog niet opgelost
};


// ============================================================================
// VOORBEELD 5: User Feedback
// ============================================================================

export const exampleUserFeedback = {
  sessionId: "k5555555555",

  feedbackType: "suggestion",

  comment: "De chatbot is super handig! Zou het mogelijk zijn om ook screenshots te kunnen uploaden? Soms is het makkelijker om te laten zien wat er mis gaat.",

  rating: 4,

  userEmail: "feedback.gebruiker@example.com",

  status: "reviewed", // Admin heeft dit al bekeken

  adminResponse: "Goede suggestie! We gaan kijken of we dit kunnen toevoegen in Q2 2024.",

  createdAt: Date.now() - 86400000, // 1 dag geleden
};


// ============================================================================
// VOORBEELD 6: Analytics
// ============================================================================

export const exampleAnalytics = {
  date: Date.now() - 86400000, // Gisteren (begin van de dag)

  stats: {
    totalSessions: 156, // 156 chats gestart gisteren

    totalMessages: 843, // 843 berichten verstuurd

    resolvedSessions: 142, // 142 succesvol opgelost

    escalatedSessions: 14, // 14 doorverwezen naar mens

    avgSessionDuration: 180, // Gemiddeld 3 minuten per chat

    avgMessagesPerSession: 5.4, // Gemiddeld 5-6 berichten per chat

    avgConfidenceScore: 0.87, // Bot was gemiddeld 87% zeker van antwoorden

    avgUserSatisfaction: 4.3, // Gebruikers gaven gemiddeld 4.3/5 sterren

    topQuestionsUsed: [
      "kb_wachtwoord_reset", // Meest gebruikte Q&A
      "kb_account_aanmaken",
      "kb_betaling_methodes",
      "kb_data_export",
      "kb_privacy_instellingen"
    ],
  },

  generatedAt: Date.now(), // Wanneer deze statistieken berekend zijn
};


// ============================================================================
// HOE GEBRUIK JE DIT IN JE CODE?
// ============================================================================

/**
 * Voorbeeld van hoe je een nieuw Q&A item toevoegt aan de database:
 *
 * // In een Convex mutation functie:
 * const knowledgeBaseId = await ctx.db.insert("knowledgeBase", {
 *   question: "Hoe kan ik mijn account verwijderen?",
 *   answer: "Ga naar Instellingen > Account > Account verwijderen. Let op: dit is permanent!",
 *   category: "account",
 *   tags: ["account", "verwijderen", "privacy"],
 *   alternativeQuestions: ["Account opzeggen", "Profiel wissen"],
 *   priority: 3,
 *   isActive: true,
 *   usageCount: 0,
 *   createdBy: "admin@talktobenji.com",
 *   createdAt: Date.now(),
 *   updatedAt: Date.now(),
 * });
 */

/**
 * Voorbeeld van hoe je een chat sessie start:
 *
 * const sessionId = await ctx.db.insert("chatSessions", {
 *   userId: "user_123",
 *   status: "active",
 *   wasResolved: false,
 *   startedAt: Date.now(),
 *   lastActivityAt: Date.now(),
 * });
 */

/**
 * Voorbeeld van hoe je een bericht toevoegt:
 *
 * await ctx.db.insert("chatMessages", {
 *   sessionId: sessionId,
 *   role: "user",
 *   content: "Hoe werkt TalkToBenji?",
 *   isAiGenerated: false,
 *   createdAt: Date.now(),
 * });
 */

// ============================================================================
// BELANGRIJKE CONCEPTEN UITGELEGD
// ============================================================================

/**
 * 1. RELATIES TUSSEN TABELLEN
 *
 * - Een ChatSession heeft meerdere ChatMessages
 * - Een ChatMessage kan verwijzen naar een KnowledgeBase item
 * - Een Escalation hoort bij een ChatSession
 *
 * Dit noem je een "relationeel" datamodel.
 */

/**
 * 2. WAAROM TIMESTAMPS?
 *
 * We gebruiken Date.now() om tijden op te slaan als nummers (milliseconden sinds 1970).
 * Dit maakt het makkelijk om te:
 * - Sorteren op tijd
 * - Berekenen hoe lang iets geleden was
 * - Filteren op datum bereiken
 */

/**
 * 3. WAAROM OPTIONAL VELDEN?
 *
 * Sommige velden zijn v.optional() omdat ze niet altijd ingevuld hoeven te zijn.
 * Bijvoorbeeld:
 * - userEmail is optioneel want anonieme gebruikers hebben geen email
 * - resolution is optioneel want een escalation kan nog niet opgelost zijn
 */

/**
 * 4. STATUS VELDEN
 *
 * Status velden gebruiken v.union() met v.literal() om alleen specifieke waarden toe te staan.
 * Dit voorkomt typefouten zoals "activ" in plaats van "active".
 */
