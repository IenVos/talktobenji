/**
 * CHAT FUNCTIES
 *
 * Dit bestand bevat alle functies voor chat sessies en berichten.
 * - Sessies starten en beheren
 * - Berichten versturen en ophalen
 * - Feedback registreren
 */

import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

// Openers per categorie (A/B test: variant 1, 2 of 3)
const OPENERS: Record<
  "verlies" | "verdriet" | "huisdier" | "hulp" | "gewoon" | "alleen" | "slaap",
  [string, string, string]
> = {
  gewoon: [
    "Gewoon praten kan ook. Waar wil je over beginnen?",
    "Soms wil je gewoon even kwijt. Ik luister. Wat wil je delen?",
    "Vertel me wat je bezighoudt. Er is geen goed of fout begin.",
  ],
  verlies: [
    "Iemand kwijtraken laat een leegte achter die moeilijk te beschrijven is. Of dat nu door de dood is, door afstand of doordat een band verwaterde. Neem de tijd. Ik luister.",
    "Iemand missen kan op zoveel manieren pijn doen. Je hoeft hier niets uit te leggen. Begin gewoon waar je wilt.",
    "Verlies heeft veel gezichten, en ze doen allemaal pijn op hun eigen manier. Vertel me wat je kwijt wilt.",
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
  alleen: [
    "Alleen voelen is een van de zwaarste dingen die er zijn. Vertel me eens, hoe lang draag je dit al?",
    "Ik ben hier. Dat alleen zijn kan zwaar wegen. Wil je me vertellen hoe het voelt voor jou?",
    "Het kost moed om dat te zeggen. Je bent hier niet alleen. Wat speelt er op dit moment?",
  ],
  slaap: [
    "Wakker liggen terwijl de wereld slaapt is eenzaam. Ik ben er. Wat houdt je vannacht uit je slaap?",
    "De nacht maakt gedachten vaak groter dan ze overdag zijn. Vertel maar, wat speelt er door je hoofd?",
    "Niet kunnen slapen is slopend. Je hoeft er niet alleen mee te liggen. Wat houdt je wakker?",
  ],
};

const TOPIC_ID_TO_OPENER_KEY: Record<
  string,
  "verlies" | "verdriet" | "huisdier" | "hulp" | "gewoon" | "alleen" | "slaap"
> = {
  "verlies-dierbare": "verlies",
  "omgaan-verdriet": "verdriet",
  "afscheid-huisdier": "huisdier",
  "professionele-hulp": "hulp",
  "gewoon-praten": "gewoon",
  "voel-me-alleen": "alleen",
  "niet-slapen": "slaap",
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
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;
    if (session.userId) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity || identity.subject !== session.userId) return null;
    }
    return session;
  },
});

// Intern: haalt sessie op zonder auth-check (alleen voor server-side gebruik)
export const getSessionRaw = internalQuery({
  args: { sessionId: v.id("chatSessions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sessionId);
  },
});

// Intern: berichten ophalen zonder auth-check (voor scheduled jobs)
export const getMessagesRaw = internalQuery({
  args: {
    sessionId: v.id("chatSessions"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("asc")
      .collect();
    if (args.limit) return messages.slice(-args.limit);
    return messages;
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
    const session = await ctx.db.get(args.sessionId);
    if (!session) return [];
    if (session.userId) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity || identity.subject !== session.userId) return [];
    }

    let q = ctx.db
      .query("chatMessages")
      .withIndex("by_session", (q) =>
        q.eq("sessionId", args.sessionId)
      )
      .order("asc");

    const messages = await q.collect();

    if (args.limit) {
      return messages.slice(-args.limit);
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    if (args.userId && identity.subject !== args.userId) return [];

    const effectiveUserId = args.userId ?? identity.subject;
    let sessions;
    if (effectiveUserId) {
      sessions = await ctx.db
        .query("chatSessions")
        .withIndex("by_user", (q) => q.eq("userId", effectiveUserId))
        .collect();
    } else {
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
export const getActiveSessions = internalQuery({
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
export const getMessageCount = internalQuery({
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

    // Bijwerken lastActiveAt voor inactivity-tracking
    if (args.userId && args.userEmail) {
      const cred = await ctx.db
        .query("credentials")
        .withIndex("email", (q) => q.eq("email", args.userEmail!.toLowerCase().trim()))
        .unique();
      if (cred) {
        await ctx.db.patch(cred._id, {
          lastActiveAt: now,
          deletionWarningSentAt: undefined, // Reset waarschuwing als ze weer actief zijn
        });
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

/**
 * Openers per Even Houvast-verliestype. EH-leads die via de mail binnenkomen gaan
 * direct de chat in met de juiste opener (i.p.v. eerst een onderwerp kiezen).
 * Waar de naam van wie/wat gemist wordt bekend is (verliesNaam), gebruikt Benji die,
 * zonder "hem of haar" (geslacht is niet altijd bekend). Zonder naam: de neutrale
 * variant. algemeen = type onbekend → uitnodigende openingsvraag (optie A).
 */
const EH_VERLIES_OPENERS: Record<string, { metNaam?: string; zonderNaam: string }> = {
  huisdier: {
    metNaam: "Een huisdier is nooit 'maar een dier'. Het is liefde, gezelschap, een stukje thuis. Vertel me eens over {naam}.",
    zonderNaam: "Dat gemis is echt, ook al begrijpt niet iedereen dat. Wil je me vertellen wie je mist?",
  },
  persoon: {
    metNaam: "Iemand kwijtraken laat een leegte achter die moeilijk te beschrijven is. Vertel me over {naam}, wie was die voor jou?",
    zonderNaam: "Iemand kwijtraken laat een leegte achter die moeilijk te beschrijven is. Neem de tijd, ik luister. Wil je me vertellen wie je mist?",
  },
  scheiding: {
    zonderNaam: "Een band die breekt of verwatert is ook een verlies, ook al ziet niet iedereen dat zo. Vertel me wat er speelt.",
  },
  eenzaamheid: {
    zonderNaam: "Alleen voelen is een van de zwaarste dingen die er zijn. Vertel eens, hoe lang draag je dit al?",
  },
  kinderloos: {
    zonderNaam: "Een kinderwens die niet in vervulling gaat draag je vaak in stilte. Hier mag het er zijn. Wil je me erover vertellen?",
  },
  algemeen: {
    zonderNaam: "Fijn dat je er bent. Ik weet nog niet wat je meedraagt, en dat hoeft ook niet meteen. Begin gewoon: wat speelt er op dit moment?",
  },
};

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
    const session = await ctx.db.get(args.sessionId);
    if (session?.userId) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity || identity.subject !== session.userId) throw new Error("Niet geautoriseerd");
    }

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
    const session = await ctx.db.get(args.sessionId);
    if (session?.userId) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity || identity.subject !== session.userId) throw new Error("Niet geautoriseerd");
    }

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
 * Start een chat voor een Even Houvast-lead die via de mail-link binnenkomt.
 * Zoekt het verliestype + de naam (verliesNaam) op het e-mailadres op en opent
 * meteen met de bijpassende opener, zodat de bezoeker niet eerst een onderwerp hoeft
 * te kiezen (dat is precies waar mensen afhaken).
 *
 * Alleen de eerste keer: wie al eens echt met Benji gepraat heeft (>=1 eigen bericht)
 * landt gewoon in zijn eigen chat, zonder opgedrongen opener. Wie geen EH-lead blijkt,
 * krijgt het gewone welkomstscherm (fallback).
 */
export const startEhChat = mutation({
  args: {
    userId: v.string(),
    userEmail: v.optional(v.string()),
    userName: v.optional(v.string()),
    // "brief" = de lead komt binnen via de link in de persoonlijke brief. Dan zetten
    // we een zachte brugzin vóór de gewone verliestype-opener, zodat het gesprek
    // naadloos voortloopt op de brief die ze net weglegden. Alle andere Benji-links
    // (opvolgmails, evergreen, funnel) laten dit leeg en houden hun bestaande opener.
    variant: v.optional(v.string()),
    // Voorbeeldmodus (admin): toon de brief-opener o.b.v. deze URL-params in plaats
    // van de echte lead-data, zodat de opener per type/naam bekeken kan worden vóór
    // livegang. Verandert alleen de begroetingstekst, geen gegevenstoegang.
    previewType: v.optional(v.string()),
    previewNaam: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || identity.subject !== args.userId) throw new Error("Niet geautoriseerd");

    const isPreview = args.variant === "brief" && !!args.previewType;

    let verliesType: string;
    let verliesNaam: string | undefined;
    let leadNaamRaw: string | undefined; // voornaam van de lead zelf (persoonlijk aanspreken)

    if (isPreview) {
      // Voorbeeldmodus: sla de "al eens gepraat"- en EH-lead-checks over zodat de
      // opener altijd verschijnt, en gebruik de meegegeven type/naam.
      verliesType = (args.previewType ?? "algemeen").toLowerCase().trim();
      verliesNaam = args.previewNaam?.trim() || undefined;
      leadNaamRaw = args.userName?.trim() || undefined;
    } else {
      // Al eens echt gepraat? Dan geen opener forceren.
      const sessies = await ctx.db
        .query("chatSessions")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect();
      for (const s of sessies) {
        const userMsg = await ctx.db
          .query("chatMessages")
          .withIndex("by_session", (q) => q.eq("sessionId", s._id))
          .filter((q) => q.eq(q.field("role"), "user"))
          .first();
        if (userMsg) return { fallback: true as const };
      }

      const email = (args.userEmail ?? "").toLowerCase().trim();
      if (!email) return { fallback: true as const };

      const brieven = await ctx.db
        .query("houvastBrieven")
        .withIndex("by_email", (q) => q.eq("email", email))
        .collect();
      if (brieven.length === 0) return { fallback: true as const }; // geen EH-lead

      const laatste = [...brieven].sort((a, b) => (b.sentAt ?? 0) - (a.sentAt ?? 0))[0];
      verliesType = (laatste.verliesType ?? "algemeen").toLowerCase().trim();
      verliesNaam = laatste.verliesNaam?.trim() || undefined;
      leadNaamRaw = laatste.naam?.trim() || undefined;
    }

    const opener = EH_VERLIES_OPENERS[verliesType] ?? EH_VERLIES_OPENERS.algemeen;
    const openerText =
      verliesNaam && opener.metNaam
        ? opener.metNaam.replace("{naam}", verliesNaam)
        : opener.zonderNaam;

    // Brief-lead: geen herstart. Ze hebben net de vijf Even Houvast-momenten ingevuld
    // en hun brief teruggelezen, dus we borduren voort in plaats van opnieuw te vragen
    // wie ze missen. Erkenning van wat ze deden + hoe-is-het-nu (zacht, present) + één
    // stap verder. Bij persoon/huisdier is er een naam om tegen te spreken; bij de
    // andere types houden we een open deur. Andere Benji-links houden hun opener.
    let tekst: string;
    if (args.variant === "brief") {
      const heeftPersoon = verliesType === "persoon" || verliesType === "huisdier";
      // Sterke slotvraag, persoonlijk gemaakt met de voornaam van de lead als die er is.
      const leadVoornaam = (leadNaamRaw ?? "").split(" ")[0] || "";
      const vraag = leadVoornaam
        ? `Wat gaat er op dit moment door je heen, ${leadVoornaam}?`
        : `Wat gaat er op dit moment door je heen?`;
      if (heeftPersoon && verliesNaam) {
        tekst = `Je hebt net stilgestaan bij ${verliesNaam}, en je woorden opgeschreven. Blijf nog even, dan praten we samen verder. ${vraag} En alles wat je ${verliesNaam} nog had willen zeggen, mag je hier gewoon tegen mij zeggen.`;
      } else if (heeftPersoon) {
        tekst = `Je hebt net je woorden opgeschreven, en dat is niet niks. Blijf nog even, dan praten we samen verder. ${vraag}`;
      } else {
        tekst = `Je hebt net je woorden opgeschreven, en dat is niet niks. Blijf nog even, dan praten we samen verder. ${vraag} Begin gewoon waar je wilt, ik luister.`;
      }
    } else {
      tekst = openerText;
    }

    const now = Date.now();
    const sessionId = await ctx.db.insert("chatSessions", {
      userId: args.userId,
      userEmail: args.userEmail,
      userName: args.userName,
      topic: verliesType,
      status: "active",
      wasResolved: false,
      startedAt: now,
      lastActivityAt: now,
    });
    await ctx.db.insert("chatMessages", {
      sessionId,
      role: "bot",
      content: tekst,
      isAiGenerated: false,
      createdAt: now,
    });

    return { fallback: false as const, sessionId };
  },
});

/**
 * Voeg een gebruikersbericht toe aan de sessie
 */
export const sendUserMessage = internalMutation({
  args: {
    sessionId: v.id("chatSessions"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.content.trim().length === 0) {
      throw new Error("Bericht mag niet leeg zijn");
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Sessie niet gevonden");
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
export const sendBotMessage = internalMutation({
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || identity.subject !== args.userId) {
      throw new Error("Niet geautoriseerd");
    }
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Gesprek niet gevonden");
    if (session.userId !== identity.subject) {
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
    const session = await ctx.db.get(args.sessionId);
    if (session?.userId) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity || identity.subject !== session.userId) throw new Error("Niet geautoriseerd");
    }
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

    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Sessie niet gevonden");
    if (session.userId) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity || identity.subject !== session.userId) throw new Error("Niet geautoriseerd");
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

    // Genereer kwaliteitsrapport voor beheerder op de achtergrond
    await ctx.scheduler.runAfter(5000, internal.ai.analyzeSessionAdmin, {
      sessionId: args.sessionId,
    });

    return args.sessionId;
  },
});

/**
 * Markeer een sessie als abandoned (verlaten)
 * Wordt automatisch aangeroepen voor sessies die >30 min inactief zijn
 */
/**
 * Herkent of het laatste bericht van de bezoeker een nette afsluiting is
 * (groet, bedankje, afscheid). Zulke gesprekken zijn niet "verlaten" maar
 * "afgesloten" en horen geen Nieuw-flag te krijgen. Bewust conservatief:
 * bij twijfel liever "abandoned" laten dan onterecht als afgesloten markeren.
 */
function lijktNetjesAfgesloten(laatsteBezoekerBericht: string | undefined): boolean {
  if (!laatsteBezoekerBericht) return false;
  const t = laatsteBezoekerBericht.toLowerCase();
  const signalen = [
    // bedankje
    "bedankt", "dank je", "dankje", "dankjewel", "dank u", "dank voor", "dankwel",
    // afscheid
    "tot ziens", "tot de volgende", "tot morgen", "tot snel", "tot later",
    "doei", "doeg", "dag benji", "fijne avond", "fijne dag", "fijne nacht",
    "prettige avond", "prettige dag",
    // slapen gaan
    "welterusten", "goedenacht", "goede nacht", "slaap lekker", "slaap zacht",
    "ik ga slapen", "ik ga naar bed", "ga zo naar bed", "ik ga zo slapen",
    // vertrek
    "ik ga ervandoor", "ik ga stoppen", "ik stop ermee", "ik ga nu", "ik ga weer",
    // positieve afronding
    "fijn gesprek", "goed gesprek", "heeft geholpen", "voelt beter", "gaat wat beter",
  ];
  return signalen.some((s) => t.includes(s));
}

export const markSessionsAsAbandoned = internalMutation({
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

    const inactief = activeSessions.filter(
      (s) => s.lastActivityAt < cutoffTime
    );

    // Update ze + trigger kwaliteitsrapport. Netjes afgesloten gesprekken
    // (bezoeker nam gedag/bedankte) horen niet in de "Nieuw"-inbox: die zetten
    // we direct op "reviewed" (Bekeken = afgehandeld, geen actie nodig), net als
    // de bestaande "Verplaats oude Afgehaakt → Bekeken"-actie.
    const beeindigd: { id: string; afgesloten: boolean }[] = [];
    for (const session of inactief) {
      const berichten = await ctx.db
        .query("chatMessages")
        .withIndex("by_session", (q) => q.eq("sessionId", session._id))
        .collect();
      const laatsteBezoeker = [...berichten]
        .reverse()
        .find((m) => m.role === "user");
      const afgesloten = lijktNetjesAfgesloten(laatsteBezoeker?.content);

      await ctx.db.patch(session._id, {
        status: afgesloten ? "reviewed" : "abandoned",
        wasResolved: afgesloten,
        endedAt: Date.now(),
        ...(afgesloten ? { reviewedAt: Date.now() } : {}),
      });
      await ctx.scheduler.runAfter(0, internal.ai.analyzeSessionAdmin, {
        sessionId: session._id,
      });
      beeindigd.push({ id: session._id, afgesloten });
    }

    return {
      count: beeindigd.length,
      afgesloten: beeindigd.filter((b) => b.afgesloten).length,
      abandoned: beeindigd.filter((b) => !b.afgesloten).length,
      sessionIds: beeindigd.map((b) => b.id),
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
export const setSessionSummary = internalMutation({
  args: { sessionId: v.id("chatSessions"), summary: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      summary: args.summary,
      summarizedAt: Date.now(),
    });
  },
});

export const setAdminRapport = internalMutation({
  args: { sessionId: v.id("chatSessions"), rapport: v.string(), suggestie: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      adminRapport: args.rapport,
      adminRapportAt: Date.now(),
      ...(args.suggestie ? { rapportSuggestie: args.suggestie } : {}),
    });
  },
});

/**
 * Haal sessies op die nog geen AI-samenvatting hebben (voor achtergrondverwerking)
 */
export const getSessionsToSummarize = internalQuery({
  args: {
    userId: v.optional(v.string()),
    anonymousId: v.optional(v.string()),
    excludeSessionId: v.id("chatSessions"),
  },
  handler: async (ctx, args) => {
    const sessions = args.userId
      ? await ctx.db.query("chatSessions").withIndex("by_user", (q) => q.eq("userId", args.userId as string)).order("desc").take(15)
      : args.anonymousId
      ? await ctx.db.query("chatSessions").withIndex("by_anonymous", (q) => q.eq("anonymousId", args.anonymousId as string)).order("desc").take(15)
      : [];

    return (sessions as any[])
      .filter((s) => s._id !== args.excludeSessionId && !s.summarizedAt)
      .slice(0, 3)
      .map((s: any) => ({ sessionId: s._id, startedAt: s.startedAt }));
  },
});

/**
 * Haal recente AI-samenvattingen op van eerdere sessies
 */
export const getRecentSummaries = internalQuery({
  args: {
    userId: v.optional(v.string()),
    anonymousId: v.optional(v.string()),
    excludeSessionId: v.id("chatSessions"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sessions = args.userId
      ? await ctx.db.query("chatSessions").withIndex("by_user", (q) => q.eq("userId", args.userId as string)).order("desc").take(25)
      : args.anonymousId
      ? await ctx.db.query("chatSessions").withIndex("by_anonymous", (q) => q.eq("anonymousId", args.anonymousId as string)).order("desc").take(25)
      : [];

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
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Sessie niet gevonden");
    if (session.userId) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity || identity.subject !== session.userId) throw new Error("Niet geautoriseerd");
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
