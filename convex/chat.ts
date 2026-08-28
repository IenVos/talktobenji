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
import { encryptContent, decryptContent } from "./chatCrypto";
import { MOMENTEN_OPENER, MOMENTEN_VRAAG1, MOMENTEN_WELKOM } from "./momentenScript";

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
    const sliced = args.limit ? messages.slice(-args.limit) : messages;
    // Ontsleutel de berichttekst (platte tekst gaat ongewijzigd door).
    return await Promise.all(
      sliced.map(async (m) => ({ ...m, content: await decryptContent(m.content) }))
    );
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
    const sliced = args.limit ? messages.slice(-args.limit) : messages;
    // Ontsleutel de berichttekst voordat de klant zijn eigen historie ziet.
    return await Promise.all(
      sliced.map(async (m) => ({ ...m, content: await decryptContent(m.content) }))
    );
  },
});

/**
 * Koppel anonieme gesprekken aan het account van de ingelogde gebruiker.
 *
 * Wordt aangeroepen zodra iemand na anoniem chatten een account aanmaakt of inlogt
 * (client geeft de anonymousId uit localStorage mee). De userId wordt uit de
 * geverifieerde JWT gehaald (identity.subject), niet uit een client-argument, zodat
 * niemand het gesprek van een ander kan claimen. Het semantisch geheugen zit als
 * samenvatting op de sessie zelf en verhuist dus automatisch mee naar het account.
 */
export const claimAnonymousSessions = mutation({
  args: { anonymousId: v.string() },
  handler: async (ctx, { anonymousId }) => {
    const identity = await ctx.auth.getUserIdentity();
    // Nog niet (volledig) geauthenticeerd bij Convex: laat de client het later opnieuw proberen.
    if (!identity) return { authed: false, claimed: 0 };
    const userId = identity.subject;

    const sessions = await ctx.db
      .query("chatSessions")
      .withIndex("by_anonymous", (q) => q.eq("anonymousId", anonymousId))
      .collect();

    let claimed = 0;
    for (const s of sessions) {
      if (s.userId) continue; // al gekoppeld (aan wie dan ook) → niet overnemen
      await ctx.db.patch(s._id, {
        userId,
        userEmail: (identity.email as string | undefined) ?? s.userEmail,
      });
      claimed++;
    }

    // Wie via "Bewaar je gesprek" een account maakt na anoniem chatten, heeft
    // aantoonbaar met Benji gepraat → direct op het Benji-spoor (niet evergreen).
    // Gebeurt hier bij het koppelen, want na registratie stuurt men vaak geen nieuw
    // bericht (waar de instap anders pas op zou vuren).
    if (claimed > 0 && process.env.BENJI_SPOOR_ACTIEF === "true" && identity.email) {
      await ctx.scheduler.runAfter(0, internal.evergreen._benjiSpoorInstroomCheck, {
        email: identity.email as string,
        naam: (identity.name as string | undefined) ?? undefined,
      });
    }

    return { authed: true, claimed };
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
    momentenType: v.optional(v.string()), // geleide-momenten-modus (bijv. "scheiding")
    momentenVariant: v.optional(v.string()), // "kaartjes" = de kaartjes-flow (test via ?stijl=kaartjes)
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
      momentenType: args.momentenType,
      momentenVariant: args.momentenVariant,
      // Kaartjes-flow: alleen het welkomstkaartje wordt hieronder getoond; moment 1 komt
      // even later (de frontend toont 'm na een korte pauze), dus teller start op 0.
      momentenKaartTot: args.momentenVariant === "kaartjes" && args.momentenType ? 0 : undefined,
      status: "active",
      wasResolved: false,
      metadata: args.metadata,
      startedAt: now,
      lastActivityAt: now,
    });

    // Geleide-momenten-modus: open met de juiste kaartjes/vraag.
    if (args.momentenType) {
      // Twee openingsberichten (marker + tekst/marker), in volgorde.
      const opener1 =
        args.momentenVariant === "kaartjes"
          ? MOMENTEN_WELKOM[args.momentenType] // welkomstkaartje (wie is Benji + brief)
          : MOMENTEN_OPENER[args.momentenType]; // huidige flow: introkaartje
      const opener2 =
        args.momentenVariant === "kaartjes"
          ? undefined // kaartjes-flow: moment 1 komt even later via de frontend
          : MOMENTEN_VRAAG1[args.momentenType]; // huidige flow: open eerste vraag
      if (opener1) {
        await ctx.db.insert("chatMessages", {
          sessionId,
          role: "bot",
          content: await encryptContent(opener1),
          isAiGenerated: false,
          createdAt: now,
        });
      }
      if (opener2) {
        await ctx.db.insert("chatMessages", {
          sessionId,
          role: "bot",
          content: await encryptContent(opener2),
          isAiGenerated: false,
          createdAt: now + 1, // net na het eerste bericht, zodat de volgorde klopt
        });
      }
    }

    return sessionId;
  },
});

/**
 * Geleide momenten: e-mailadres vastleggen op de sessie (bevestigend e-mailkaartje).
 * Voorlopig slaan we alleen het adres op de sessie op; de brief-generatie en het
 * stille account (magic-link) volgen in een aparte stap.
 */
export const saveMomentenEmail = mutation({
  args: {
    sessionId: v.id("chatSessions"),
    email: v.string(),
    naam: v.optional(v.string()),
    // Ad-herkomst (utm) van de landings-URL, voor advertentie-attributie in het lead-record.
    bron: v.optional(v.string()),
    bronUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    if (!/\S+@\S+\.\S+/.test(email)) throw new Error("Ongeldig e-mailadres");
    await ctx.db.patch(args.sessionId, {
      userEmail: email,
      userName: args.naam?.trim() || undefined,
    });
    // Geleide momenten: genereer + verstuur de persoonlijke brief (met de afgestemde
    // briefzin), en laat Benji nog één warme vervolgvraag stellen die teruggrijpt op
    // wat gedeeld is en uitnodigt om door te praten.
    await ctx.scheduler.runAfter(0, internal.houvast.genereerEnVerstuurMomentenBrief, {
      sessionId: args.sessionId,
      bron: args.bron,
      bronUrl: args.bronUrl,
    });
    await ctx.scheduler.runAfter(0, internal.ai.momentenFollowUp, {
      sessionId: args.sessionId,
    });
    return { ok: true };
  },
});

/**
 * Kaartjes-flow: toon het volgende moment-opdracht-kaartje (marker) in de chat.
 * Frontend-gestuurd (betrouwbaarder dan de AI het laten doen): de client roept dit
 * aan zodra de bezoeker het huidige kaartje heeft beantwoord en Benji heeft gereageerd.
 * Idempotent via chatSessions.momentenKaartTot, zodat een kaartje nooit dubbel komt.
 */
export const showMomentKaart = mutation({
  args: { sessionId: v.id("chatSessions"), nummer: v.number() },
  handler: async (ctx, args) => {
    if (args.nummer < 1 || args.nummer > 5) return { ok: false };
    const session = await ctx.db.get(args.sessionId);
    if (!session || !session.momentenType || session.momentenVariant !== "kaartjes") return { ok: false };
    const tot = session.momentenKaartTot ?? 0;
    // Alleen het eerstvolgende kaartje mag getoond worden, en nooit twee keer.
    if (args.nummer !== tot + 1) return { ok: false, already: true };
    await ctx.db.insert("chatMessages", {
      sessionId: args.sessionId,
      role: "bot",
      content: await encryptContent(`[[kaart:moment${args.nummer}]]`),
      isAiGenerated: false,
      createdAt: Date.now(),
    });
    await ctx.db.patch(args.sessionId, { momentenKaartTot: args.nummer, lastActivityAt: Date.now() });
    return { ok: true };
  },
});

/**
 * Kaartjes-flow: sla een moment-antwoord op ZONDER dat Benji reageert. Benji reageert
 * maar op een paar momenten (dat regelt de frontend); op de stille momenten bewaren we
 * alleen het antwoord zodat het in de brief meekomt.
 */
export const saveKaartAntwoord = mutation({
  args: { sessionId: v.id("chatSessions"), content: v.string() },
  handler: async (ctx, args) => {
    const c = args.content.trim();
    if (!c) return { ok: false };
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.momentenVariant !== "kaartjes" || session.status !== "active") return { ok: false };
    await ctx.db.insert("chatMessages", {
      sessionId: args.sessionId,
      role: "user",
      content: await encryptContent(c),
      isAiGenerated: false,
      createdAt: Date.now(),
    });
    await ctx.db.patch(args.sessionId, { lastActivityAt: Date.now() });
    return { ok: true };
  },
});

/**
 * Kaartjes-flow: hoog de teller op van het aantal korte reacties dat Benji al gaf op
 * een moment-antwoord (max 2 per gesprek) en leg vast op welk moment dat was (max 1
 * reactie per moment, zodat de twee reacties zich over het gesprek spreiden).
 */
export const bumpMomentenKaartReactie = internalMutation({
  args: { sessionId: v.id("chatSessions"), moment: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return;
    await ctx.db.patch(args.sessionId, {
      momentenKaartReacties: (session.momentenKaartReacties ?? 0) + 1,
      ...(args.moment ? { momentenLaatsteReactieMoment: args.moment } : {}),
    });
  },
});

/**
 * Kaartjes-flow: start de afsluiting nadat de bezoeker moment 5 heeft beantwoord.
 * Plant de AI-afsluiting (korte erkenning + teaser + e-mailkaartje). Idempotent: doet
 * niets als het e-mailkaartje al getoond is.
 */
export const startMomentenAfsluiting = mutation({
  args: { sessionId: v.id("chatSessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || !session.momentenType || session.momentenVariant !== "kaartjes") return { ok: false };
    // Niet nog een keer afsluiten als het e-mailkaartje er al is.
    const berichten = await ctx.db
      .query("chatMessages")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();
    for (const m of berichten) {
      const c = await decryptContent(m.content);
      if (c.includes("[[kaart:email]]")) return { ok: false, already: true };
    }
    await ctx.scheduler.runAfter(0, internal.ai.momentenAfsluiting, { sessionId: args.sessionId });
    return { ok: true };
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
// Warme, type-specifieke INTRO-zinnen. De sterke aanzet-vraag ("Wat gaat er op dit
// moment door je heen{, voornaam}?") wordt in startEhChat erachter geplakt, zodat
// elke Benji-ingang (opvolgmail én brief) consistent aanzet tot praten.
// Per verliestype meerdere warme intro-varianten (zelfde toon, andere woorden), zodat
// een lead die de chat opnieuw opent niet telkens exact dezelfde zin ziet. Bij een
// heropening (zie WELKOM_TERUG_OPENERS) openen we juist NIET opnieuw met het verlies.
const EH_VERLIES_OPENERS: Record<string, { metNaam?: string[]; zonderNaam: string[] }> = {
  huisdier: {
    metNaam: [
      "Een huisdier is nooit 'maar een dier'. {naam} hoort bij je leven, en dat gemis is echt.",
      "{naam} was geen 'maar een dier', {naam} hoorde bij je dagen. Dat je dat mist is niet gek.",
      "Het huis voelt anders zonder {naam}. Dat gemis mag er zijn, hoe klein anderen het soms maken.",
    ],
    zonderNaam: [
      "Een huisdier is nooit 'maar een dier'. Dat gemis is echt, ook al ziet niet iedereen dat.",
      "Een dier missen is een echt verlies, ook al snapt niet iedereen hoe diep dat gaat.",
      "Het huis voelt vaak leger zonder ze. Dat gemis mag er hier gewoon zijn.",
    ],
  },
  persoon: {
    metNaam: [
      "Het gemis van {naam} laat een leegte achter die moeilijk te beschrijven is.",
      "{naam} kwijt zijn werkt door in bijna alles. Neem de tijd, ik luister.",
      "Er is geen goede manier om {naam} te missen. Wat er ook bovenkomt, het mag er zijn.",
    ],
    zonderNaam: [
      "Iemand kwijtraken laat een leegte achter die moeilijk te beschrijven is. Neem de tijd, ik luister.",
      "Iemand missen werkt door in bijna alles. Er is hier geen goede of verkeerde manier.",
      "Een gemis als dit laat zich moeilijk in woorden vangen. Begin gewoon waar je wilt.",
    ],
  },
  scheiding: {
    zonderNaam: [
      "Een band die breekt of verwatert is ook een verlies, ook al ziet niet iedereen dat zo.",
      "Ook zonder afscheid kan een relatie een leegte achterlaten. Dat gemis is echt.",
      "Uit elkaar gaan is ook rouwen, om wat was en om wat je je had voorgesteld.",
    ],
  },
  eenzaamheid: {
    zonderNaam: [
      "Alleen voelen is een van de zwaarste dingen die er zijn.",
      "Je alleen voelen, ook tussen mensen, is zwaarder dan het van buiten lijkt.",
      "Eenzaamheid weegt, juist omdat anderen het vaak niet zien. Hier mag het er zijn.",
    ],
  },
  kinderloos: {
    zonderNaam: [
      "Een kinderwens die niet in vervulling gaat draag je vaak in stilte. Hier mag het er zijn.",
      "Een verlangen naar een kind dat uitblijft is een stil verdriet. Je hoeft het hier niet stil te houden.",
      "Wat niet gekomen is, mag je toch missen. Dat gemis is echt, ook al ziet niemand het.",
    ],
  },
  algemeen: {
    zonderNaam: [
      "Fijn dat je er bent.",
      "Fijn dat je de stap zet om er even te zijn.",
      "Goed dat je hier bent, neem gerust de tijd.",
    ],
  },
};

// Kies willekeurig een variant uit een lijst.
function kiesWillekeurig<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Openers voor een HEROPENING (de lead was al eens in Benji, maar praatte nog niet):
// niet opnieuw met het verlies beginnen, maar warm erkennen dat ze terugkomen en
// laagdrempelig uitnodigen. Gerouleerd voor variatie. {naamAanhef} = ", Voornaam" of "".
function welkomTerugOpeners(naamAanhef: string): string[] {
  return [
    `Fijn dat je er weer bent${naamAanhef}. Je hoeft nergens te beginnen, vertel gewoon wat er nu speelt.`,
    `Goed dat je terugkomt${naamAanhef}. Waar zit je op dit moment het meest mee?`,
    `Je bent er weer${naamAanhef}, fijn. Neem de tijd, en zeg wat er nu bovenkomt.`,
    `Dat je nog eens terugkomt zegt genoeg${naamAanhef}. Ik luister, begin maar waar je wilt.`,
    `Welkom terug${naamAanhef}. Er hoeft niets, maar als er iets is, ben ik er.`,
  ];
}

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
      content: await encryptContent(openerText),
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
 * Rechtstreekse-chat-ad (?start=chat&t=<verliestype>): open een anonieme chat meteen
 * met één warme, type-specifieke opener + de aanzet-vraag, zodat de bezoeker niet in
 * een leeg veld belandt (dat schrikt af). Geen kaartjes, geen brief: puur een gesprek.
 * Idempotent: doet niets als er al een bericht in de sessie staat.
 */
export const addVerliesOpener = mutation({
  args: { sessionId: v.id("chatSessions"), verliesType: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return { ok: false };
    const bestaand = await ctx.db
      .query("chatMessages")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();
    if (bestaand) return { ok: false, already: true };
    const type = args.verliesType && EH_VERLIES_OPENERS[args.verliesType] ? args.verliesType : "algemeen";
    const intro = kiesWillekeurig(EH_VERLIES_OPENERS[type].zonderNaam);
    const openerText = `${intro} Wat gaat er op dit moment door je heen?`;
    await ctx.db.insert("chatMessages", {
      sessionId: args.sessionId,
      role: "bot",
      content: await encryptContent(openerText),
      isAiGenerated: false,
      createdAt: Date.now(),
    });
    await ctx.db.patch(args.sessionId, { lastActivityAt: Date.now() });
    return { ok: true };
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
      content: await encryptContent(openerText),
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
    // naadloos voortloopt op de brief die ze net weglegden. "direct" = de klikbare naam
    // Benji in een mail-P.S.: forceer de verliestype-opener (als "en-nu"). Overige
    // Benji-links (opvolgmails, evergreen-knop) laten dit leeg en houden hun opener.
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
    // Is dit een heropening (de lead was al eerder in Benji, maar praatte nog niet)?
    // Dan openen we met een "welkom terug"-zin i.p.v. opnieuw met het verlies.
    let isHeropening = false;

    if (isPreview) {
      // Voorbeeldmodus: sla de "al eens gepraat"- en EH-lead-checks over zodat de
      // opener altijd verschijnt, en gebruik de meegegeven type/naam.
      verliesType = (args.previewType ?? "algemeen").toLowerCase().trim();
      verliesNaam = args.previewNaam?.trim() || undefined;
      leadNaamRaw = args.userName?.trim() || undefined;
    } else {
      const sessies = await ctx.db
        .query("chatSessions")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect();

      // Dedup dubbele mail-link-opening (mail-scanner die de link vooraf opent, of
      // een dubbele tik). Beide openingen roepen startEhChat aan; zonder dit maakt de
      // tweede een lege tweede sessie. Heeft de gebruiker al een sessie uit de laatste
      // 10 minuten? Dan hergebruiken we die i.p.v. een nieuwe opener-sessie te maken.
      const recent = sessies
        .filter((s) => (s.startedAt ?? 0) > Date.now() - 10 * 60 * 1000)
        .sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0))[0];
      if (recent) return { fallback: false as const, sessionId: recent._id };

      // Al eens eerder een sessie gehad (dus eerder de chat geopend)? Dan is dit een
      // heropening en gebruiken we straks een "welkom terug"-opener.
      isHeropening = sessies.length > 0;

      // variant "en-nu": de lead klikte net bewust op "Ik wil nog iets vertellen" op de
      // En nu?-kaart. Dan forceren we altijd een verse opener, ook als ze al eerder met
      // Benji praatten of (nog) geen brief hebben. Anders belanden ze op hun account
      // i.p.v. in het gesprek, precies op het verkeerde moment.
      // "direct" = de klikbare naam Benji in een mail-P.S.: net als "en-nu" altijd een
      // verse verliestype-opener, ook voor wie al eerder praatte, zodat de klik direct
      // in het juiste gesprek met de juiste openingszin landt.
      const forceerOpener = args.variant === "en-nu" || args.variant === "direct";

      if (!forceerOpener) {
        // Al eens echt gepraat (oudere sessie)? Dan geen opener forceren.
        for (const s of sessies) {
          const userMsg = await ctx.db
            .query("chatMessages")
            .withIndex("by_session", (q) => q.eq("sessionId", s._id))
            .filter((q) => q.eq(q.field("role"), "user"))
            .first();
          if (userMsg) return { fallback: true as const };
        }
      }

      const email = (args.userEmail ?? "").toLowerCase().trim();
      if (!email && !forceerOpener) return { fallback: true as const };

      const brieven = email
        ? await ctx.db
            .query("houvastBrieven")
            .withIndex("by_email", (q) => q.eq("email", email))
            .collect()
        : [];
      if (brieven.length === 0 && !forceerOpener) return { fallback: true as const }; // geen EH-lead

      const laatste = [...brieven].sort((a, b) => (b.sentAt ?? 0) - (a.sentAt ?? 0))[0];
      verliesType = (laatste?.verliesType ?? (args.variant === "en-nu" ? "scheiding" : "algemeen")).toLowerCase().trim();
      verliesNaam = laatste?.verliesNaam?.trim() || undefined;
      leadNaamRaw = laatste?.naam?.trim() || undefined;
    }

    // Sterke aanzet-vraag, persoonlijk met de voornaam van de lead als die er is.
    // Gedeeld door de opvolgmail-openers (intro + vraag) én de brief-opener.
    const leadVoornaam = (leadNaamRaw ?? "").split(" ")[0] || "";
    const vraag = leadVoornaam
      ? `Wat gaat er op dit moment door je heen, ${leadVoornaam}?`
      : `Wat gaat er op dit moment door je heen?`;

    const opener = EH_VERLIES_OPENERS[verliesType] ?? EH_VERLIES_OPENERS.algemeen;
    const introBron = verliesNaam && opener.metNaam ? opener.metNaam : opener.zonderNaam;
    const intro = kiesWillekeurig(introBron).replace("{naam}", verliesNaam ?? "");
    const openerText = `${intro} ${vraag}`;

    // Brief-lead: geen herstart. Ze hebben net de vijf Even Houvast-momenten ingevuld
    // en hun brief teruggelezen, dus we borduren voort in plaats van opnieuw te vragen
    // wie ze missen. Erkenning van wat ze deden + dezelfde sterke aanzet-vraag + één
    // stap verder. Bij persoon/huisdier is er een naam om tegen te spreken; bij de
    // andere types houden we een open deur. Andere Benji-links krijgen intro + vraag.
    let tekst: string;
    if (args.variant === "brief") {
      const heeftPersoon = verliesType === "persoon" || verliesType === "huisdier";
      if (heeftPersoon && verliesNaam) {
        tekst = `Je hebt net stilgestaan bij ${verliesNaam}, en je woorden opgeschreven. Blijf nog even, dan praten we samen verder. ${vraag} En alles wat je ${verliesNaam} nog had willen zeggen, mag je hier gewoon tegen mij zeggen.`;
      } else if (heeftPersoon) {
        tekst = `Je hebt net je woorden opgeschreven, en dat is niet niks. Blijf nog even, dan praten we samen verder. ${vraag}`;
      } else {
        tekst = `Je hebt net je woorden opgeschreven, en dat is niet niks. Blijf nog even, dan praten we samen verder. ${vraag} Begin gewoon waar je wilt, ik luister.`;
      }
    } else if (args.variant === "en-nu") {
      // "En nu?"-kaart bij relatiebreuk: de lead klikte net op "Ik wil nog iets
      // vertellen". Warme, laagdrempelige opener die inhaakt op het moment (ze hebben
      // net de momenten ingevuld), met de voornaam waar bekend. Gerouleerd voor
      // variatie. Geen uitlegkaartje: ze landen direct in dit gesprek.
      const naamAanhef = leadVoornaam ? `, ${leadVoornaam}` : "";
      const enNuOpeners = [
        `Fijn dat je er nog even bent${naamAanhef}. Je hebt net stilgestaan bij een paar zware momenten. Vertel maar, waar zit je op dit moment het meest mee?`,
        `Je wilde nog iets kwijt${naamAanhef}, en dat mag hier. Begin gewoon bij wat er nu bovenkomt, ik luister.`,
        `Dat je hier bent zegt al genoeg${naamAanhef}. Neem de tijd, en vertel wat er nog in je hoofd rondgaat. Er is geen goede of verkeerde manier.`,
        `Je hoeft niet bij het begin te beginnen${naamAanhef}. Zeg gewoon wat er nu het zwaarst voelt, dan gaan we van daaruit verder.`,
      ];
      tekst = enNuOpeners[Math.floor(Math.random() * enNuOpeners.length)];
    } else if (isHeropening) {
      // Heropening (eh/direct): niet opnieuw met het verlies beginnen, maar warm
      // erkennen dat ze terugkomen. Gerouleerd voor variatie.
      const naamAanhef = leadVoornaam ? `, ${leadVoornaam}` : "";
      tekst = kiesWillekeurig(welkomTerugOpeners(naamAanhef));
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
      content: await encryptContent(tekst),
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
      content: await encryptContent(args.content.trim()),
      isAiGenerated: false,
      createdAt: now,
    });

    // Update lastActivityAt van sessie
    await ctx.db.patch(args.sessionId, {
      lastActivityAt: now,
    });

    // Benji-spoor: zodra een Even Houvast-lead genoeg met Benji chat, direct naar
    // spoor "benji" (en geen EH-mails meer). Async buiten de hot path, en gated door
    // BENJI_SPOOR_ACTIEF zodat het pas telt als het spoor gevuld en aangezet is.
    if (process.env.BENJI_SPOOR_ACTIEF === "true" && session.userEmail) {
      await ctx.scheduler.runAfter(0, internal.evergreen._benjiSpoorInstroomCheck, {
        email: session.userEmail,
        naam: session.userName ?? undefined,
      });
    }

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
      content: await encryptContent(args.content),
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
    const firstUserContent = firstUserMessage ? await decryptContent(firstUserMessage.content) : "";
    const summary = firstUserMessage
      ? firstUserContent.substring(0, 100) + "..."
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
      const laatsteContent = laatsteBezoeker ? await decryptContent(laatsteBezoeker.content) : undefined;
      const afgesloten = lijktNetjesAfgesloten(laatsteContent);

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
