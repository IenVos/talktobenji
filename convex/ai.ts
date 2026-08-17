"use node";

// Opus 4.8: warmer en volgt de gedragsregels trouwer dan Sonnet, ideaal voor
// een rouw/verlies-chatbot. Bewust 4.8 en niet Opus 5: op 4.8 staat "denken" uit
// zonder extra config, zodat het max_tokens-budget (1024) volledig naar Benji's
// antwoord gaat en er geen extra latency bijkomt.
const CLAUDE_MODEL = "claude-opus-4-8";

/**
 * AI INTEGRATIE (Claude API)
 *
 * Dit bestand bevat de logica voor het genereren van slimme antwoorden
 * met behulp van Claude API. Het gebruikt de knowledge en rules uit de
 * botSettings tabel.
 * 
 * HOE WERKT DE COMPLETE FLOW?
 * ============================
 * 
 * 1. GEBRUIKER STELT EEN VRAAG
 *    → Frontend roept handleUserMessage() aan
 * 
 * 2. BERICHT WORDT OPGESLAGEN
 *    → Gebruikersbericht wordt opgeslagen in chatMessages tabel
 * 
 * 3. INSTELLINGEN WORDEN OPGEGAHAALD
 *    → Knowledge en Rules worden opgehaald uit botSettings (settings.ts)
 *    → Deze vormen het "system prompt" voor Claude
 * 
 * 4. CONVERSATIE GESCHIEDENIS WORDT OPGEGAHAALD
 *    → Laatste 10 berichten worden opgehaald voor context
 * 
 * 5. CLAUDE API WORDT AANGEROEPEN
 *    → System prompt = Knowledge + Rules uit settings
 *    → Messages = Conversatie geschiedenis + nieuwe vraag
 *    → Claude genereert een antwoord op basis van alles
 * 
 * 6. ANTWOORD WORDT OPGESLAGEN
 *    → Bot antwoord wordt opgeslagen in chatMessages tabel
 *    → Antwoord wordt teruggestuurd naar frontend
 * 
 * WAAR KOMT DE KNOWLEDGE VANDAAN?
 * ================================
 * 
 * Er zijn TWEE bronnen van kennis:
 * 
 * 1. SETTINGS (settings.ts) - Algemene kennis
 *    → Opgeslagen in botSettings tabel
 *    → Wordt gebruikt bij ELKE chat
 *    → Bijvoorbeeld: "Ons bedrijf heet TalkToBenji..."
 *    → Vul dit in via: api.settings.save()
 * 
 * 2. KNOWLEDGE BASE (knowledgeBase.ts) - Specifieke Q&As
 *    → Opgeslagen in knowledgeBase tabel
 *    → Wordt gebruikt voor exacte matches
 *    → Bijvoorbeeld: "Hoe maak ik een account?" → "Ga naar..."
 *    → Vul dit in via: api.knowledgeBase.addQuestion()
 * 
 * HOE CONFIGUREER JE DE KNOWLEDGE?
 * ==================================
 * 
 * STAP 1: Vul algemene kennis in (settings.ts)
 * ```typescript
 * await api.settings.save({
 *   knowledge: "TalkToBenji is een project management tool...",
 *   rules: "Wees vriendelijk. Antwoord in het Nederlands..."
 * });
 * ```
 * 
 * STAP 2: Voeg specifieke Q&As toe (knowledgeBase.ts)
 * ```typescript
 * await api.knowledgeBase.addQuestion({
 *   question: "Hoe maak ik een account?",
 *   answer: "Ga naar de registratie pagina...",
 *   category: "Account",
 *   tags: ["account", "registratie"]
 * });
 * ```
 * 
 * STAP 3: Test je chatbot
 * → Stel een vraag via de chat interface
 * → De AI gebruikt nu beide bronnen van kennis
 * 
 * WAAROM TWEE BRONNEN?
 * --------------------
 * - SETTINGS: Voor context die altijd relevant is (bedrijfsinfo, algemene regels)
 * - KNOWLEDGE BASE: Voor specifieke vragen die vaak gesteld worden (FAQ)
 * 
 * Dit geeft je flexibiliteit:
 * - Wijzig algemene kennis zonder alle Q&As te updaten
 * - Voeg nieuwe Q&As toe zonder de algemene kennis te wijzigen
 * - De AI combineert beide automatisch tot natuurlijke antwoorden
 */

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { berichtenModelActief } from "./benjiLimiet";

// ============================================================================
// TYPES EN INTERFACES
// ============================================================================

interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

interface ClaudeAPIResponse {
  content: Array<{ type: string; text: string }>;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_read_input_tokens?: number;
    cache_creation_input_tokens?: number;
  };
  stop_reason: string;
}



// ============================================================================
// HOOFD AI ACTION
// ============================================================================

/**
 * Complete chat flow: ontvang bericht, genereer antwoord, sla op
 * Dit is de functie die je aanroept vanuit je frontend
 */
export const handleUserMessage = action({
  args: {
    sessionId: v.id("chatSessions"),
    userMessage: v.string(),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    userMessageId?: string;
    botMessageId?: string;
    response?: string;
    error?: string;
  }> => {
    const startTime = Date.now();

    try {
      // RATE LIMIT: max 4 berichten per 30 seconden per sessie (beschermt tegen spam/kosten)
      // Laad ruim genoeg berichten om ook de berichtenlimiet te kunnen controleren
      const recentMessages = await ctx.runQuery(api.chat.getMessages, {
        sessionId: args.sessionId,
        limit: 100,
      });
      const thirtySecondsAgo = Date.now() - 30 * 1000;
      const recentUserCount = (recentMessages || []).filter(
        (m: any) => m.role === "user" && m.createdAt > thirtySecondsAgo
      ).length;
      if (recentUserCount >= 4) {
        return {
          success: false,
          error: "Je stuurt berichten te snel. Even een moment wachten.",
        };
      }

      // Detecteer of dit het eerste gebruikersbericht in deze sessie is
      const isFirstMessageInSession = !(recentMessages || []).some((m: any) => m.role === "user");

      // Haal sessie op (raw = zonder auth-filter) voor ownership-check en subscription
      const chatSession = await ctx.runQuery(internal.chat.getSessionRaw, { sessionId: args.sessionId });

      // Als sessie bij een gebruiker hoort, verifieer dat de aanroeper dezelfde gebruiker is
      if (chatSession?.userId) {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity || identity.subject !== chatSession.userId) {
          return { success: false, error: "SESSION_AUTH_REQUIRED" };
        }
      }

      // BACKEND GESPREKSLIMIET CHECK + bepaal account type
      let isPaid = false;
      let isFreeUser = false;
      let nieuwModelUser = false; // ingelogde gratis gebruiker onder het berichten-model
      const isGuest = !chatSession?.userId;

      if (chatSession?.userId) {
        const convCount = await ctx.runQuery(api.subscriptions.getConversationCount, {
          userId: chatSession.userId,
          email: chatSession.userEmail ?? undefined,
        });
        isPaid = convCount.hasUnlimited;
        isFreeUser = !convCount.hasUnlimited;
        nieuwModelUser = !!(convCount as any).isBerichtenModel;
        if (nieuwModelUser) {
          // Nieuw model: harde grens = berichten-tegoed (~175) over alle gesprekken.
          // De per-sessie-limiet hieronder geldt hier niet; deze teller is leidend.
          if (convCount.limit !== null && convCount.count >= convCount.limit) {
            await ctx.runMutation(internal.benjiLimiet.markPaywallBereikt, {
              userId: chatSession.userId,
            });
            return { success: false, error: "BENJI_LIMIET_BEREIKT" };
          }
        } else if (!convCount.hasUnlimited && convCount.limit !== null && convCount.count > convCount.limit) {
          return {
            success: false,
            error: "Je hebt je gespreksmaandlimiet bereikt. Upgrade je abonnement voor onbeperkte gesprekken.",
          };
        }
      } else if (chatSession?.anonymousId) {
        if (berichtenModelActief()) {
          // Nieuw model: ook zonder account krijgt de bezoeker hetzelfde tegoed van
          // 5 gesprekken (berichten-teller op anonymousId). Daarna de betaalde versie.
          const anonStatus = await ctx.runQuery(api.benjiLimiet.getAnoniemBerichtenStatus, {
            anonymousId: chatSession.anonymousId,
          });
          nieuwModelUser = true; // per-sessie-limiet hieronder overslaan
          if (anonStatus.bereikt) {
            return { success: false, error: "BENJI_LIMIET_BEREIKT" };
          }
        } else {
          // Oud model: max 3 gesprekken
          const anonCount = await ctx.runQuery(api.chat.countAnonymousSessions, {
            anonymousId: chatSession.anonymousId,
          });
          if (anonCount > 3) {
            return {
              success: false,
              error: "Je hebt je 3 gratis gesprekken gebruikt. Maak een gratis profiel aan om verder te gaan.",
            };
          }
        }
      }

      // BERICHTENLIMIET PER SESSIE — voorkomt open laten staan van chat.
      // Onder het nieuwe model geldt de totale berichten-teller (hierboven), niet
      // deze per-sessie-limiet (ook voor anonieme bezoekers).
      const sessionUserMsgCount = (recentMessages || []).filter((m: any) => m.role === "user").length;
      const msgLimit = nieuwModelUser ? Infinity : isGuest ? 15 : isFreeUser ? 15 : Infinity;
      if (sessionUserMsgCount >= msgLimit) {
        return {
          success: false,
          error: isGuest ? "GUEST_MESSAGE_LIMIT" : "USER_MESSAGE_LIMIT",
        };
      }

      // STAP 1: Sla gebruikersbericht op
      const userMessageId = await ctx.runMutation(internal.chat.sendUserMessage, {
        sessionId: args.sessionId,
        content: args.userMessage,
      });

      // STAP 2: Haal bot settings op (rules), bronnen en check of KB gevuld is
      const settings = await ctx.runQuery(api.settings.get);
      const hasKbItems = await ctx.runQuery(api.knowledgeBase.hasActiveItems);
      const allSources = await ctx.runQuery(api.sources.getActiveSources);

      // Gebruikersprofiel al opgehaald (chatSession hierboven)
      let userContext: string | null = null;
      let userGoals: string | null = null;
      let userMemories: string | null = null;
      let userCheckIn: string | null = null;
      let sessionSummaries: string | null = null;

      if (chatSession?.userId) {
        const uid = chatSession.userId;
        const [prefs, goals, memories, checkIns, recentSummaries] = await Promise.all([
          ctx.runQuery(api.preferences.getPreferences, { userId: uid }),
          ctx.runQuery(api.reflecties.listGoals, { userId: uid }),
          ctx.runQuery(api.memories.getMemories, { userId: uid }),
          ctx.runQuery(api.reflecties.listCheckInEntries, { userId: uid, limit: 1 }),
          ctx.runAction(api.embeddings.searchSessionSummaries, {
            query: args.userMessage,
            userId: uid,
            excludeSessionId: args.sessionId,
            limit: 3,
          }).catch(() =>
            ctx.runQuery(internal.chat.getRecentSummaries, {
              userId: uid,
              excludeSessionId: args.sessionId,
              limit: 3,
            })
          ),
        ]);

        // Trigger achtergrond-samenvattingen van vorige sessies (alleen bij eerste bericht)
        if (isFirstMessageInSession) {
          await ctx.scheduler.runAfter(0, internal.ai.summarizeSession, {
            userId: uid,
            excludeSessionId: args.sessionId,
          });
        }

        // Bouw samenvattingen van eerdere gesprekken
        if (recentSummaries && recentSummaries.length > 0) {
          sessionSummaries = recentSummaries
            .map((s: any) => {
              const date = new Date(s.startedAt).toLocaleDateString("nl-NL", {
                day: "numeric", month: "long",
              });
              return `[${date}]: ${s.summary}`;
            })
            .join("\n\n");
        }

        if (prefs?.userContext?.trim()) {
          userContext = prefs.userContext.trim();
        }

        // Actieve (niet afgeronde) doelen, max 5
        const activeGoals = (goals || []).filter((g: any) => !g.completed).slice(0, 5);
        if (activeGoals.length > 0) {
          userGoals = activeGoals.map((g: any) => `• ${g.content.slice(0, 120)}`).join("\n");
        }

        // Meest recente 2 herinneringen
        const recentMemories = (memories || []).slice(0, 2);
        if (recentMemories.length > 0) {
          userMemories = recentMemories.map((m: any) =>
            `• ${m.text.slice(0, 150)}${m.emotion ? ` (${m.emotion})` : ""}`
          ).join("\n");
        }

        // Meest recente check-in
        const lastCheckIn = (checkIns || [])[0];
        if (lastCheckIn) {
          const checkInLines: string[] = [];
          if (lastCheckIn.hoe_voel) checkInLines.push(`Hoe voel ik me: ${lastCheckIn.hoe_voel.slice(0, 100)}`);
          if (lastCheckIn.wat_hielp) checkInLines.push(`Wat hielp: ${lastCheckIn.wat_hielp.slice(0, 100)}`);
          if (lastCheckIn.waar_dankbaar) checkInLines.push(`Dankbaar voor: ${lastCheckIn.waar_dankbaar.slice(0, 100)}`);
          if (checkInLines.length > 0) userCheckIn = checkInLines.join("\n");
        }
      } else if (chatSession?.anonymousId) {
        // Anonieme gebruiker: haal sessiegeheugen op via anonymousId
        const anonId = chatSession.anonymousId;
        const recentSummaries = await ctx.runAction(api.embeddings.searchSessionSummaries, {
          query: args.userMessage,
          anonymousId: anonId,
          excludeSessionId: args.sessionId,
          limit: 3,
        }).catch(() =>
          ctx.runQuery(internal.chat.getRecentSummaries, {
            anonymousId: anonId,
            excludeSessionId: args.sessionId,
            limit: 3,
          })
        );

        if (isFirstMessageInSession) {
          await ctx.scheduler.runAfter(0, internal.ai.summarizeSession, {
            anonymousId: anonId,
            excludeSessionId: args.sessionId,
          });
        }

        if (recentSummaries && recentSummaries.length > 0) {
          sessionSummaries = (recentSummaries as any[])
            .map((s: any) => {
              const date = new Date(s.startedAt).toLocaleDateString("nl-NL", { day: "numeric", month: "long" });
              return `[${date}]: ${s.summary}`;
            })
            .join("\n\n");
        }
      }

      const isEnglish = false; // Benji is altijd Nederlands — nooit overschakelen naar Engels
      const emptyKbMessage = isEnglish
        ? "There is no information in the knowledge base yet. Add Knowledge and Q&As via the admin panel (/admin) to answer questions."
        : "Er is nog geen kennis geconfigureerd. Voeg Knowledge en Q&A's toe via het admin panel (/admin) om vragen te kunnen beantwoorden.";

      const hasKnowledge = (settings?.knowledge || "").trim().length > 0;
      const hasSources = allSources && allSources.length > 0;

      // Geen kennis: geen Admin Knowledge, geen Q&As, geen bronnen → duidelijke melding
      if (!hasKnowledge && !hasKbItems && !hasSources) {
        const botMessageIdEmpty = await ctx.runMutation(internal.chat.sendBotMessage, {
          sessionId: args.sessionId,
          content: emptyKbMessage,
          isAiGenerated: false,
          confidenceScore: 0,
        });
        return {
          success: true,
          userMessageId,
          botMessageId: botMessageIdEmpty,
          response: emptyKbMessage,
        };
      }

      // STAP 3: Haal conversatie geschiedenis op (dynamisch op basis van gesprekslengte)
      // Haal eerst alle berichten op om lengte te bepalen
      const allMessagesForCount = await ctx.runQuery(api.chat.getMessages, {
        sessionId: args.sessionId,
        limit: 100, // Haal meer op om lengte te bepalen
      });
      const messageCount = (allMessagesForCount || []).length;
      
      // Gebruik de al opgehaalde berichten voor de history
      // Geheugen op basis van account type:
      //   Gast:    eerste 6 + laatste 10  (vangt vroeg gedeelde info op)
      //   Gratis:  eerste 6 + laatste 16
      //   Betaald: eerste 8 + laatste 24 (beste continuïteit)
      const charLimit = 2000;
      const firstCount = isPaid ? 8 : 6;
      const recentCount = isGuest ? 10 : isFreeUser ? 16 : 24;
      const allMsgs = (allMessagesForCount || []).slice(0, -1); // Exclude het laatste bericht
      const firstMsgs = allMsgs.slice(0, firstCount);
      const recentMsgs = allMsgs.slice(-recentCount);
      // Korte gesprekken: alles meenemen; lange gesprekken: begin + recente context
      const historyMsgs = allMsgs.length <= (firstCount + recentCount) ? allMsgs : [...firstMsgs, ...recentMsgs];

      const conversationHistory: ClaudeMessage[] = historyMsgs
        .map((m: { role: string; content: string }) => ({
          role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
          content: m.content.slice(0, charLimit),
        }))
        .filter((m: ClaudeMessage) => m.content.trim().length > 0);

      // STAP 4: Zoek relevante Q&A's via semantische vector search (Voyage AI embeddings)
      const userMessageLower = args.userMessage.toLowerCase().trim();

      // Detecteer of gebruiker expliciet om een tip/advies vraagt
      const isAskingForTip = userMessageLower.includes("tip") ||
                             userMessageLower.includes("advies") ||
                             userMessageLower.includes("suggestie") ||
                             userMessageLower.includes("idee") ||
                             userMessageLower.includes("wat kan helpen") ||
                             userMessageLower.includes("wat zou kunnen helpen") ||
                             (userMessageLower.includes("kun je") && (userMessageLower.includes("geven") || userMessageLower.includes("helpen")));

      const kbMaxMatches = isAskingForTip ? (messageCount > 10 ? 3 : 5) : (messageCount > 10 ? 2 : 3);

      // Haal semantisch meest relevante Q&A's op via embeddings
      let semanticMatches: any[] = [];
      try {
        semanticMatches = await ctx.runAction(api.embeddings.searchKb, {
          query: args.userMessage,
          limit: kbMaxMatches,
        });
      } catch {
        // Fallback naar lege lijst als embeddings niet beschikbaar zijn
        semanticMatches = [];
      }
      
      // STAP 5: Filter en limiter sources (max 2 sources, max 4000 karakters per source)
      const sources = (allSources || [])
        .slice(0, 2)
        .map((s: { title: string; type: string; url?: string; extractedText: string }) => ({
          ...s,
          extractedText: s.extractedText.slice(0, 4000),
        }));

      const knowledgeFromSettings = (settings?.knowledge || "").trim();
      const parts: string[] = [];
      const settingsLimit = messageCount > 10 ? 2500 : 4000;

      // Huidige datum — zodat Benji tijdsberekeningen correct kan maken
      const now = new Date();
      const dagNamen = ["zondag","maandag","dinsdag","woensdag","donderdag","vrijdag","zaterdag"];
      const maandNamen = ["januari","februari","maart","april","mei","juni","juli","augustus","september","oktober","november","december"];
      const currentDateStr = `${dagNamen[now.getUTCDay()]} ${now.getUTCDate()} ${maandNamen[now.getUTCMonth()]} ${now.getUTCFullYear()}`;
      parts.push(`## Huidige datum\nVandaag is het ${currentDateStr}. Gebruik deze datum om tijdsberekeningen correct te maken (bijv. hoelang geleden iets was).`);
      
      // Persoonlijke context van deze gebruiker — altijd als eerste
      // Gebruik dit om persoonlijker te reageren; verwijs er niet expliciet naar tenzij relevant.
      const userBgParts: string[] = [];
      if (userContext) userBgParts.push("Jouw verhaal:\n" + userContext.slice(0, 800));
      if (userGoals) userBgParts.push("Persoonlijke doelen:\n" + userGoals);
      if (userMemories) userBgParts.push("Herinneringen:\n" + userMemories);
      if (userCheckIn) userBgParts.push("Laatste check-in:\n" + userCheckIn);
      if (sessionSummaries) userBgParts.push("Eerdere gesprekken (samengevat — stel geen vragen die hier al gesteld zijn):\n" + sessionSummaries.slice(0, 2000));
      if (userBgParts.length > 0) {
        parts.push("## Persoonlijke context van deze gebruiker\n" + userBgParts.join("\n\n"));
      }

      // Eerste gesprek vs terugkerende bezoeker — expliciet meegeven zodat Benji NOOIT
      // ten onrechte doet alsof iemand terugkomt. Herkenning mag alleen bij echt bewijs
      // van een eerder gesprek (samengevatte eerdere gesprekken).
      if (sessionSummaries) {
        parts.push("## Terugkerende bezoeker\nJe hebt deze bezoeker eerder gesproken (zie de samengevatte eerdere gesprekken). Herkenning mag warm zijn, maar ga niet uit van details die je niet zeker weet.");
      } else {
        parts.push("## Eerste gesprek met deze bezoeker\nJullie hebben nog niet eerder samen gepraat. Wat je hierboven eventueel over hen weet mag je gebruiken, maar doe NOOIT alsof jullie elkaar al uit een eerder gesprek kennen of alsof ze terugkomen. Gebruik geen zinnen als \"fijn dat je terugkomt\", \"hoe is het sindsdien gegaan\" of \"je bent er weer\". Behandel dit als een eerste kennismaking.");
      }

      // Altijd: algemene kennis (dynamische limiet)
      if (knowledgeFromSettings) {
        const limitedSettings = knowledgeFromSettings.slice(0, settingsLimit);
        parts.push("## Algemene kennis en context\n" + limitedSettings);
      }
      
      // Knowledge base: semantisch gevonden Q&A's meesturen
      if (semanticMatches.length > 0) {
        const excellentKb = semanticMatches
          .map((q: { question: string; answer: string }) => {
            const shortAnswer = q.answer.length > 300
              ? q.answer.slice(0, 300) + "..."
              : q.answer;
            const shortQuestion = q.question.length > 80
              ? q.question.slice(0, 80) + "..."
              : q.question;
            return `Vraag: ${shortQuestion}\nAntwoord: ${shortAnswer}`;
          })
          .join("\n\n---\n\n");

        const limitedKb = excellentKb.slice(0, 3000);
        parts.push((parts.length ? "\n" : "") + "## Knowledge base (Q&A's)\n" + limitedKb);
      }
      
      // Sources: ALLEEN als er geen knowledge base matches zijn (anders te veel tokens)
      const knowledgeFromSources =
        sources && sources.length > 0 && semanticMatches.length === 0
          ? sources
              .map(
                (s: { title: string; type: string; url?: string; extractedText: string }) =>
                  `[Bron: ${s.title}${s.url ? ` (${s.url})` : ""}]\n${s.extractedText.slice(0, 2000)}`
              )
              .join("\n\n---\n\n")
          : "";
      
      if (knowledgeFromSources) {
        const limitedSources = knowledgeFromSources.slice(0, 2000);
        parts.push((parts.length ? "\n" : "") + "## Aanvullende bronnen (PDF's, websites)\n" + limitedSources);
      }
      
      // Dynamische totale limiet: bij langere gesprekken nog agressiever
      const totalKnowledgeLimit = messageCount > 10 ? 5000 : 8000;
      let knowledgeCombined = parts.join("");
      if (knowledgeCombined.length > totalKnowledgeLimit) {
        // Verkort proportioneel
        const ratio = totalKnowledgeLimit / knowledgeCombined.length;
        knowledgeCombined = parts.map(p => {
          const targetLength = Math.floor(p.length * ratio);
          return p.slice(0, targetLength);
        }).join("");
      }

      const onlyFromKbRule = isEnglish
        ? "KNOWLEDGE BASE: The Q&As below were semantically matched to this conversation — they are the most relevant available. Use them as grounding for your response, but always prioritize the emotional tone of the conversation over literal Q&A content. If no Q&As are provided, rely on your general knowledge and the rules above. If a question falls completely outside grief/loss/emotions, end your response with exactly [UNANSWERED] so we can track it."
        : "KNOWLEDGE BASE: De Q&A's hieronder zijn semantisch geselecteerd op basis van dit gesprek — ze zijn de meest relevante die beschikbaar zijn. Gebruik ze als inhoudelijke basis, maar prioriteer altijd de emotionele toon van het gesprek boven letterlijke Q&A-inhoud. Als er geen Q&A's zijn meegegeven, vertrouw dan op je algemene kennis en de regels hierboven. Als een vraag volledig buiten rouw/verlies/emoties valt, eindig je antwoord dan met exact [UNANSWERED] zodat we het kunnen bijhouden.";

      const dutchLanguageRule = `TAAL: Antwoord ALTIJD in het Nederlands. Nooit in het Engels, zelfs niet als de gebruiker iets in het Engels schrijft. Reageer dan gewoon in het Nederlands.

TAALKWALITEIT: Gebruik altijd correct, natuurlijk Nederlands. Elke zin moet grammaticaal perfect zijn.

BELANGRIJKE GRAMMATICALE REGELS:
- Werkwoordvolgorde: scheidbare werkwoorden moeten correct gescheiden worden
  FOUT: "Wat bezighoudt je?" of "Wat bezighoudt je op dit moment?"
  GOED: "Wat houdt je bezig?" of "Waar ben je mee bezig?" of "Wat houdt je op dit moment bezig?"
  
  FOUT: "Dat durft iets zeggen"
  GOED: "Dat zegt iets" of "Dat getuigt van moed" of "Dat is al iets"
  
  FOUT: "Hoe voelt het aan?"
  GOED: "Hoe voelt het?" of "Hoe is het voor je?"

- Vermijd onhandige constructies met "er"
  FOUT: "er niet zoveel blijheid meer is" of "er is niet zoveel blijheid meer"
  GOED: "de blijheid er niet meer is" of "er is weinig blijheid meer" of "de blijheid is er niet meer"
  
  FOUT: "er niet veel vreugde is"
  GOED: "er weinig vreugde is" of "de vreugde er niet is" of "er geen vreugde meer is"

- Gebruik natuurlijke woordvolgorde
  FOUT: "Dat hoeft niet foutloos"
  GOED: "Dat hoeft ook niet" of "Je hoeft niets te zeggen" of "Soms zijn woorden niet nodig"
  
- Vermijd onnatuurlijke constructies
  FOUT: "ik ben verdrietig" → "Dat klinkt zwaar. Wat bezighoudt je?"
  GOED: "Dat klinkt zwaar. Wat houdt je bezig?" of "Dat klinkt zwaar. Waar denk je aan?" of "Dat klinkt zwaar. Wat speelt er door je heen?"

- GEBRUIK NOOIT streepjes ( - ) tussen woorden of zinsdelen
  FOUT: "weg - ze zitten"
  GOED: "weg. Ze zitten" of "weg, ze zitten"

- Vermijd jargon in troostende context
  FOUT: "foutloos", "foutloosheid"
  GOED: "perfect", "de juiste woorden", "iets goeds zeggen"

- Gebruik GEEN Engelse interjecties of geluiden
  FOUT: "Mmm.", "Hmm.", "Uh-huh", "Okay", "Yeah"
  GOED: "Ja.", "Aha.", "Ik begrijp het.", "Dat snap ik.", of gewoon direct beginnen met je antwoord
  Als je begint met een bevestiging, gebruik Nederlandse woorden of begin direct met je zin

- Gebruik correcte lidwoorden (de/het/die/dat)
  FOUT: "Dat stilte" of "Dat blijheid" of "Dat leegte"
  GOED: "Die stilte" of "De stilte" of "Die blijheid" of "De blijheid" of "Die leegte"
  FOUT: "Wat voel je als dat stilte er is"
  GOED: "Wat voel je als die stilte er is" of "Wat voel je als het stil is"
  FOUT: "Dat gemis"
  GOED: "Het gemis"

- Gebruik correcte zinsconstructies met "kunnen" en "beide"
  FOUT: "Dat kunnen beide dingen tegelijk waar zijn"
  GOED: "Beide dingen kunnen tegelijk waar zijn" of "Dat kan allebei waar zijn"

- Vermijd onnatuurlijke constructies met "vandaan gaan"
  FOUT: "Wat voelde je bij hem vandaan gaan?"
  GOED: "Wat voelde je toen hij er niet meer was?" of "Hoe was het voor je toen hij wegging?"

- Vermijd onnatuurlijke constructies met "aan die kletsen" / "aan dat kletsen"
  FOUT: "Wat miste je het meest aan die kletsen?"
  GOED: "Wat miste je het meest aan jullie gesprekken?" of "Wat mis je het meest aan die gesprekken samen?"

- Vermijd "Sorry" als opener — klinkt te afstandelijk en vertaald
  FOUT: "Sorry, ik was niet duidelijk."
  GOED: "Je hebt gelijk, dat was niet duidelijk." of "Dat heb ik onhandig verwoord."

- Maak altijd volledige, goed lopende zinnen
  FOUT: "Die leegte, wat voelt dat als." (onvolledige zin)
  GOED: "Die leegte die je voelt, hoe is dat voor je?" of "Kun je omschrijven hoe die leegte voelt?"
  FOUT: "heel groot voor hem, voor jullie allemaal." (loshangende zin)
  GOED: "Dat moet heel groot zijn geweest, voor jullie allemaal."

CONTROLE:
- Lees elke zin mentaal door voordat je het verstuurt
- Vraag je af: zou een Nederlandse native speaker dit zo zeggen?
- Als je twijfelt, gebruik een eenvoudigere formulering
- Schrijf zoals je zou spreken in een gesprek
- BELANGRIJK: Schrijf ALLEEN doorlopende tekst zonder lege regels tussen zinnen. Gebruik GEEN dubbele newlines (\n\n) of paragraaf breaks. Alles moet in één doorlopende alinea staan.`;





      const accountRule = isEnglish
        ? "ACCOUNT & REGISTRATION: When someone asks about creating an account, signing up, or registering, explain they can do this via the menu: the three dots (⋮) at the top, then 'Sign up'. Do NOT put links in the conversation. For a forgotten password: tell them they can reset it on the login page."
        : `ACCOUNT & REGISTRATIE: Wanneer iemand vraagt over een account aanmaken, aanmelden of registreren, leg uit dat dit via het menu kan: de drie puntjes (⋮) bovenaan, dan 'Aanmelden'. Zet GEEN links in het gesprek. Bij wachtwoord vergeten: zeg dat ze hun wachtwoord opnieuw kunnen instellen op de inlogpagina.`;

      const memoryRule = isEnglish
        ? ""
        : `HERINNERINGEN HERKENNEN: Wanneer iemand een mooie, warme of positieve herinnering deelt (een fijn moment met een dierbare, iets wat ze samen deden, een gelukkig gevoel van vroeger), bied dan aan om deze herinnering op te slaan in hun Memories. Doe dit door aan het einde van je antwoord de volgende markering te plaatsen op een nieuwe regel:
[HERINNERING: de kern van de herinnering hier | emotie: dankbaar/warm/gelukkig/trots/verbonden/geliefd]

REGELS:
- Doe dit ALLEEN bij duidelijk positieve, warme herinneringen. Niet bij verdrietige of pijnlijke momenten.
- Doe dit maximaal één keer per gesprek, niet bij elk bericht.
- Vat de herinnering kort samen in de markering (1-2 zinnen).
- Kies de meest passende emotie uit: dankbaar, warm, gelukkig, trots, verbonden, geliefd.
- Reageer EERST normaal empathisch op wat ze delen, en voeg dan pas de markering toe.
- Als je niet zeker weet of het een positieve herinnering is, doe het dan NIET.`;














      // Regel: anonieme gebruiker aanmoedigen profiel aan te maken
      const accountNudgeRule = isGuest ? `PROFIEL AANMAKEN — VOOR ANONIEME GEBRUIKERS:
Deze gebruiker is niet ingelogd. Benji onthoudt niets tussen gesprekken door — bij een volgend bezoek begint alles opnieuw.

Noem het profiel MAXIMAAL ÉÉN keer per gesprek, op een van deze momenten:
${messageCount >= 8 && messageCount < 20
  ? `- Er is al wat gedeeld (${messageCount} berichten), maar noem het profiel ALLEEN op een rustig moment: een korte of neutrale reactie, een natuurlijke pauze, of als het gesprek even afzwakt. Doe het NOOIT vlak nadat iemand iets pijnlijks, intens of kwetsbaars heeft gedeeld, en nooit midden in hevige emotie. Op zo'n moment reageer je uitsluitend empathisch en laat je het profiel volledig achterwege. Past het wel, voeg dan zacht toe: "Wat je hebt gedeeld wil ik goed onthouden. Als je een gratis profiel aanmaakt via het menu (de drie puntjes ⋮, dan 'Aanmelden'), neem ik dit mee naar een volgend gesprek, dan hoef je niet opnieuw te beginnen."`
  : messageCount >= 20
  ? `- Dit is een lang gesprek. Noem het bij een samenvattend of afsluitend moment: "We hebben vandaag al veel besproken. Als je een gratis profiel aanmaakt via het menu (de drie puntjes ⋮), onthoud ik dit, zodat je de volgende keer verder kunt gaan waar je nu bent gebleven."`
  : messageCount >= 6
  ? `- Als iemand aangeeft te willen stoppen of als je afsluit, voeg toe: "Als je een gratis profiel aanmaakt via het menu (de drie puntjes ⋮), onthoud ik wat je hebt gedeeld, dan hoef je de volgende keer niet opnieuw te beginnen."`
  : ``}

Zeg het NOOIT als verkooppraatje of als vraag. Het moet voelen als een vriendelijke tip.
FOUT: "Wil je een account aanmaken?" of "Maak nu een account aan!"
GOED: Vlecht het in als praktische mededeling na een empathische zin, zodat het voelt als zorg, niet als reclame.` : "";


      // Benji-regels (uit instellingen) gaan altijd volledig mee — nooit afkappen
      // De extra hardcoded regels worden apart beperkt tot 2000 chars
      const customRules = settings?.rules || "";
      // DEDUP (4 aug 2026): de gedragsregels (crisis, tempo, afronden, geheugen,
      // huisdiertaal, geen-namen, slapen, lichaam, sociale verbinding, enz.) staan nu
      // in customRules — de geconsolideerde admin-tekst (settings.rules). In de code
      // blijven alleen de voorwaardelijke/functionele stukken:
      //  - onlyFromKbRule:   KB-grondslag + [UNANSWERED]-markering
      //  - dutchLanguageRule: NL-grammatica-detail (bewust behouden, geen regressie)
      //  - accountRule:      account aanmaken via het menu
      //  - memoryRule:       [HERINNERING: ...]-opslagmarkering (feature)
      //  - accountNudgeRule: gast-nudge, afhankelijk van isGuest + messageCount
      // De overige hardcoded regelblokken hierboven zijn hiermee overbodig (dead code)
      // en worden in een aparte opschoonronde uit dit bestand verwijderd.
      const limitedExtraRules = [onlyFromKbRule, dutchLanguageRule, accountRule, memoryRule].filter(Boolean).join("\n\n");
      // CACHING: het vaste regelblok bevat alleen stabiele regels (admin-regels + vaste extra
      // regels). De gast-nudge verandert per bericht (interpoleert het berichtaantal) en gaat
      // daarom apart mee als variabel blok — anders breekt de cache elk bericht.
      const rules = [customRules, limitedExtraRules].filter(Boolean).join("\n\n");

      // STAP 5: Genereer AI response met fallback mechanisme voor langere gesprekken
      let aiResponse: string;
      try {
        aiResponse = await callClaudeAPI(
          args.userMessage,
          knowledgeCombined,
          rules,
          conversationHistory,
          accountNudgeRule
        );
      } catch (error: any) {
        // Fallback: bij 503 overflow of 400 errors, probeer opnieuw met minimale context
        const errorMsg = error?.message || String(error);
        if ((errorMsg.includes("503") && errorMsg.includes("overflow")) || 
            (errorMsg.includes("400") && (errorMsg.includes("too large") || errorMsg.includes("token") || errorMsg.includes("context_length")))) {
          console.log("503/400 error gedetecteerd, probeer opnieuw met minimale context...");
          
          // Probeer opnieuw met alleen minimale kennis (geen KB, geen sources, kortere history)
          const minimalKnowledge = knowledgeFromSettings ? knowledgeFromSettings.slice(0, 2000) : "";
          const minimalHistory = conversationHistory.slice(-1); // Alleen laatste bericht
          const minimalRules = rules.slice(0, 1500); // Kortere rules
          
          try {
            aiResponse = await callClaudeAPI(
              args.userMessage,
              minimalKnowledge,
              minimalRules,
              minimalHistory
            );
            console.log("Fallback succesvol - antwoord gegenereerd met minimale context");
          } catch (fallbackError: any) {
            // Als fallback ook faalt, gooi originele error
            console.error("Fallback ook gefaald:", fallbackError);
            throw error;
          }
        } else {
          // Bij andere errors, gooi door
          throw error;
        }
      }

      // Detecteer onbeantwoorde vragen: AI plaatst [UNANSWERED] aan het einde
      const unansweredMarker = "[UNANSWERED]";
      const wasUnanswered = aiResponse.includes(unansweredMarker);
      if (wasUnanswered) {
        aiResponse = aiResponse.replace(new RegExp(unansweredMarker + "\\s*$", "i"), "").trim();
        await ctx.runMutation(api.analytics.recordUnansweredQuestion, {
          userQuestion: args.userMessage,
          sessionId: args.sessionId,
        });
      }

      // Corrigeer veelvoorkomende grammaticale fouten in Nederlands
      if (!isEnglish) {
        // "Wat bezighoudt je" → "Wat houdt je bezig"
        aiResponse = aiResponse.replace(/\bWat bezighoudt je\b/gi, "Wat houdt je bezig");
        aiResponse = aiResponse.replace(/\bWat bezighoudt je op dit moment\b/gi, "Wat houdt je op dit moment bezig");
        aiResponse = aiResponse.replace(/\bWat bezighoudt je nu\b/gi, "Wat houdt je nu bezig");
        
        // "Hoe voelt het aan" → "Hoe voelt het"
        aiResponse = aiResponse.replace(/\bHoe voelt het aan\b/gi, "Hoe voelt het");
        
        // "dat durft iets zeggen" → "dat zegt iets"
        aiResponse = aiResponse.replace(/\bdat durft iets zeggen\b/gi, "dat zegt iets");
        
        // "er niet zoveel blijheid meer is" → "de blijheid er niet meer is" of "er is weinig blijheid meer"
        aiResponse = aiResponse.replace(/\ber niet zoveel blijheid meer is\b/gi, "de blijheid er niet meer is");
        aiResponse = aiResponse.replace(/\ber niet veel blijheid meer is\b/gi, "er weinig blijheid meer is");
        aiResponse = aiResponse.replace(/\ber niet zoveel vreugde meer is\b/gi, "de vreugde er niet meer is");
        aiResponse = aiResponse.replace(/\ber niet veel vreugde meer is\b/gi, "er weinig vreugde meer is");
        
        // "er niet zoveel X meer is" → "er weinig X meer is" (algemene regel)
        aiResponse = aiResponse.replace(/\ber niet zoveel (\w+) meer is\b/gi, (match, word) => {
          // Alleen voor abstracte woorden (gevoelens, emoties)
          const abstractWords = ['blijheid', 'vreugde', 'geluk', 'hoop', 'energie', 'kracht', 'moed', 'rust', 'vrede'];
          if (abstractWords.includes(word.toLowerCase())) {
            return `er weinig ${word} meer is`;
          }
          return match;
        });
        
        // Verwijder Engelse interjecties en vervang door Nederlandse alternatieven
        aiResponse = aiResponse.replace(/^Mmm\.?\s*/gi, ""); // Verwijder "Mmm." aan het begin
        aiResponse = aiResponse.replace(/^Hmm\.?\s*/gi, ""); // Verwijder "Hmm." aan het begin
        aiResponse = aiResponse.replace(/\s*Mmm\.?\s*/g, " "); // Verwijder "Mmm." middenin
        aiResponse = aiResponse.replace(/\s*Hmm\.?\s*/g, " "); // Verwijder "Hmm." middenin
        aiResponse = aiResponse.replace(/\bMmm\b/gi, ""); // Verwijder losse "Mmm"
        aiResponse = aiResponse.replace(/\bHmm\b/gi, ""); // Verwijder losse "Hmm"
        
        // Corrigeer verkeerde lidwoorden
        aiResponse = aiResponse.replace(/\bDat stilte\b/gi, "Die stilte");
        aiResponse = aiResponse.replace(/\bDat blijheid\b/gi, "Die blijheid");
        aiResponse = aiResponse.replace(/\bDat vreugde\b/gi, "Die vreugde");
        aiResponse = aiResponse.replace(/\bDat geluk\b/gi, "Het geluk");
        aiResponse = aiResponse.replace(/\bDat verdriet\b/gi, "Het verdriet");
        aiResponse = aiResponse.replace(/\bDat pijn\b/gi, "De pijn");
        aiResponse = aiResponse.replace(/\bDat angst\b/gi, "De angst");
        aiResponse = aiResponse.replace(/\bDat eenzaamheid\b/gi, "De eenzaamheid");
        
        // Corrigeer "als dat stilte er is" → "als die stilte er is" of "als het stil is"
        aiResponse = aiResponse.replace(/\bals dat stilte er is\b/gi, "als die stilte er is");
        aiResponse = aiResponse.replace(/\bals dat blijheid er is\b/gi, "als die blijheid er is");

        // Corrigeer "Dat leegte" → "Die leegte"
        aiResponse = aiResponse.replace(/\bDat leegte\b/gi, "Die leegte");
        aiResponse = aiResponse.replace(/\bdat leegte\b/gi, "die leegte");

        // Corrigeer "Dat gemis" → "Het gemis"
        aiResponse = aiResponse.replace(/\bDat gemis\b/g, "Het gemis");
        aiResponse = aiResponse.replace(/\bdat gemis\b/g, "het gemis");

        // Corrigeer "Dat kunnen beide dingen tegelijk waar zijn" → "Beide dingen kunnen tegelijk waar zijn"
        aiResponse = aiResponse.replace(/\bDat kunnen beide dingen tegelijk waar zijn\b/gi, "Beide dingen kunnen tegelijk waar zijn");
        aiResponse = aiResponse.replace(/\bdat kunnen beide dingen tegelijk waar zijn\b/gi, "beide dingen kunnen tegelijk waar zijn");
        
        // "Wat merkt je" → "Wat merk je" (verkeerde werkwoordsvorm)
        aiResponse = aiResponse.replace(/\bWat merkt je\b/gi, "Wat merk je");
        aiResponse = aiResponse.replace(/\bwat merkt je\b/gi, "wat merk je");

        // Verwijder overmatige meta-zinnen over beschikbaarheid/AI
        aiResponse = aiResponse.replace(/\.\s*Zonder oordeel\.\s*Dag en nacht\./gi, ".");
        aiResponse = aiResponse.replace(/\bZonder oordeel\.\s*Dag en nacht\.\s*/gi, "");
        aiResponse = aiResponse.replace(/\bIk ben hier voor je,?\s*dag en nacht\b\.?/gi, "");
        aiResponse = aiResponse.replace(/\bIk ben getraind om\b/gi, "Ik probeer");
        aiResponse = aiResponse.replace(/\bIk ben er om je te\b/gi, "Ik wil je graag");
        
        // "Dat alleen-zijn" → "Het alleen-zijn" (verkeerd lidwoord)
        aiResponse = aiResponse.replace(/\bDat alleen-zijn\b/gi, "Het alleen-zijn");
        aiResponse = aiResponse.replace(/\bdat alleen-zijn\b/gi, "het alleen-zijn");
        
        // Normaliseer dubbele spaties na verwijderingen
        aiResponse = aiResponse.replace(/\s+/g, " ").trim();
      }

      // VERWIJDER alle lege regels en newlines - vervang door enkele spaties
      // Dit voorkomt dat de AI per ongeluk lege regels toevoegt
      // Gebruik meerdere passes om zeker te zijn dat alles wordt verwijderd
      aiResponse = aiResponse
        .replace(/\r\n/g, " ") // Windows newlines
        .replace(/\r/g, " ") // Mac newlines
        .replace(/\n\n\n+/g, " ") // Drie of meer newlines
        .replace(/\n\n/g, " ") // Dubbele newlines
        .replace(/\n/g, " ") // Enkele newlines
        .replace(/[ \t]+/g, " ") // Meerdere spaties of tabs
        .replace(/\s+/g, " ") // Alle whitespace normaliseren
        .trim();

      const responseTime = Date.now() - startTime;

      // STAP 6: Sla bot antwoord op
      const botMessageId = await ctx.runMutation(internal.chat.sendBotMessage, {
        sessionId: args.sessionId,
        content: aiResponse,
        isAiGenerated: true,
        confidenceScore: 0.8,
        generationMetadata: {
          model: CLAUDE_MODEL,
          responseTime,
        },
      });

      return {
        success: true,
        userMessageId,
        botMessageId,
        response: aiResponse,
      };
    } catch (error: any) {
      const errMsg = error?.message ?? String(error);
      const errStack = error?.stack;
      console.error("Error in handleUserMessage:", errMsg);
      if (errStack) console.error(errStack);

      // Error bericht in Nederlands (Talk To Benji is NL-app)
      const errorMessage = "Het spijt me, er is iets misgegaan. Probeer het opnieuw of neem contact op met support.";

      // Sla error antwoord op (bewaar echte fout in metadata voor debugging)
      await ctx.runMutation(internal.chat.sendBotMessage, {
        sessionId: args.sessionId,
        content: errorMessage,
        isAiGenerated: false,
        confidenceScore: 0,
        generationMetadata: {
          error: errMsg,
        },
      });

      return {
        success: false,
        error: error.message,
      };
    }
  },
});

// ============================================================================
// SAMENVATTEN VAN GESPREKKEN
// ============================================================================

/**
 * Samenvatten van eerdere sessies in de achtergrond.
 * Wordt aangeroepen bij het eerste bericht van een nieuw gesprek.
 * Zoekt sessies die nog geen AI-samenvatting hebben en vat ze samen.
 */
export const summarizeSession = internalAction({
  args: {
    userId: v.optional(v.string()),
    anonymousId: v.optional(v.string()),
    excludeSessionId: v.id("chatSessions"),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === "your-api-key-here") return;
    if (!args.userId && !args.anonymousId) return;

    // Zoek sessies die nog geen AI-samenvatting hebben
    const toSummarize = await ctx.runQuery(internal.chat.getSessionsToSummarize, {
      userId: args.userId,
      anonymousId: args.anonymousId,
      excludeSessionId: args.excludeSessionId,
    });

    for (const { sessionId } of toSummarize) {
      try {
        // Haal berichten op (intern — geen auth-check nodig in scheduled job)
        const messages = await ctx.runQuery(internal.chat.getMessagesRaw, {
          sessionId,
          limit: 40,
        });

        // Sla over als te weinig inhoud
        const userMessages = (messages || []).filter((m: any) => m.role === "user");
        if (userMessages.length < 2) {
          // Markeer als "gesummariseerd" zodat we het niet opnieuw proberen
          await ctx.runMutation(internal.chat.setSessionSummary, {
            sessionId,
            summary: "",
          });
          continue;
        }

        // Bouw transcript (max 300 chars per bericht)
        const transcript = (messages || [])
          .filter((m: any) => m.content?.trim())
          .map((m: any) =>
            `${m.role === "user" ? "Gebruiker" : "Benji"}: ${m.content.slice(0, 300)}`
          )
          .join("\n");

        // Roep Claude aan voor samenvatting
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: CLAUDE_MODEL,
            max_tokens: 400,
            system: `Je maakt beknopte samenvattingen van gesprekken tussen een gebruiker en Benji (een empathische chatbot voor rouwverwerking). Schrijf in derde persoon ("de gebruiker"), in het Nederlands, max 120 woorden.

Vat samen:
1. Wat de gebruiker heeft gedeeld (situatie, emoties, verlies)
2. Welke onderwerpen zijn besproken
3. Welke vragen Benji heeft gesteld (zodat deze niet herhaald worden)

Schrijf beknopt en feitelijk. Geen inleiding of afsluiting.`,
            messages: [
              {
                role: "user",
                content: `Maak een samenvatting van dit gesprek:\n\n${transcript.slice(0, 6000)}`,
              },
            ],
          }),
        });

        if (!response.ok) {
          console.error(`Summarize API error: ${response.status}`);
          continue;
        }

        const data = (await response.json()) as ClaudeAPIResponse;
        const summary = data.content?.[0]?.text?.trim() ?? "";

        if (summary) {
          await ctx.runMutation(internal.chat.setSessionSummary, { sessionId, summary });
          // Bereken embedding voor semantisch geheugen
          await ctx.runAction(api.embeddings.embedSessionSummary, { sessionId, summary });
        }
      } catch (e) {
        console.error("Summarize session error:", e);
      }
    }
  },
});

/**
 * Genereer een kwaliteitsrapport voor de beheerder.
 * Leest de berichten maar schrijft GEEN citaten — alleen inzichten.
 * Wordt automatisch getriggerd als een sessie eindigt.
 */
export const analyzeSessionAdmin = internalAction({
  args: { sessionId: v.id("chatSessions") },
  handler: async (ctx, args) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === "your-api-key-here") return;

    const messages = await ctx.runQuery(internal.chat.getMessagesRaw, {
      sessionId: args.sessionId,
      limit: 60,
    });

    const session = await ctx.runQuery(internal.chat.getSessionRaw, {
      sessionId: args.sessionId,
    });

    if (!messages || messages.length < 2) return;

    const aantalGebruiker = messages.filter((m: any) => m.role === "user").length;
    const aantalBenji = messages.filter((m: any) => m.role !== "user").length;
    const status = session?.status ?? "onbekend";
    const beoordeling = session?.rating ? `${session.rating}/5` : "geen";

    // Transcript voor analyse — geanonimiseerd, enkel inhoud niet naam/email.
    // Per bericht ruim genoeg om volledige berichten te tonen (langste bericht is
    // ~560 tekens). Een te lage limiet liet complete berichten afgekapt lijken,
    // waardoor de analyse onterecht "Benji's bericht werd afgekapt" rapporteerde.
    const MAX_BERICHT_LENGTE = 1000;
    const transcript = messages
      .filter((m: any) => m.content?.trim())
      .map((m: any) => {
        const prefix = m.role === "user" ? "G" : "B";
        // Directe feedback van de bezoeker op een Benji-bericht (duim omhoog/omlaag).
        const duim =
          m.feedback === "helpful"
            ? " [bezoeker: duim omhoog]"
            : m.feedback === "not_helpful"
            ? " [bezoeker: duim omlaag]"
            : "";
        return `${prefix}${duim}: ${m.content.slice(0, MAX_BERICHT_LENGTE)}`;
      })
      .join("\n");

    // Als het transcript te lang is, behoud het EINDE (hoe het gesprek afliep is
    // het belangrijkst om te beoordelen). Vanaf het begin knippen liet lange
    // gesprekken onterecht "abrupt afgebroken" lijken.
    const MAX_TRANSCRIPT = 24000;
    const transcriptVoorAnalyse =
      transcript.length > MAX_TRANSCRIPT
        ? "...(begin van het gesprek ingekort)...\n" + transcript.slice(-MAX_TRANSCRIPT)
        : transcript;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 500,
        system: `Je analyseert gesprekken tussen gebruikers (G) en Benji (B), een empathische chatbot voor rouwverwerking van TalkToBenji.nl.

BELANGRIJK — GEHEUGEN: Benji heeft geheugen van eerdere gesprekken met deze bezoeker (samenvattingen van vorige sessies worden automatisch meegegeven). Jij ziet hier ALLEEN het huidige gesprek, niet dat geheugen. Als Benji verwijst naar een naam, huisdier, gebeurtenis of detail dat niet in dít transcript is geïntroduceerd, is dat vrijwel altijd correcte herinnering uit een vorig gesprek, GEEN verzinsel. Markeer dit NIET als fout of "verzonnen geheugen", tenzij de bezoeker het in dit gesprek zelf expliciet tegenspreekt.

DIRECTE FEEDBACK: Sommige Benji-berichten zijn door de bezoeker zelf gemarkeerd met [bezoeker: duim omhoog] (behulpzaam) of [bezoeker: duim omlaag] (niet behulpzaam). Dat is de sterkste, directe feedback die er is. Weeg die zwaar: bij een duim omlaag benoem je in het Aandachtspunt expliciet wat op dát bericht misging; bij een duim omhoog benoem je in het Verloop kort wat daar juist goed werkte.

Schrijf een beknopt kwaliteitsrapport voor de beheerder. Gebruik GEEN citaten of persoonlijke details.

Geef in 4 punten:
1. Onderwerp: wat speelde er globaal? (max 8 woorden, geen namen)
2. Verloop: hoe ging het gesprek? Was Benji behulpzaam, herhaalde hij zichzelf, haakte de gebruiker gefrustreerd af?
3. Aandachtspunt: wat ging er mis of kon beter? (of "geen" als het goed ging)
4. Actie: moet er iets worden toegevoegd aan de kennisbank, of een aanpassing aan Benji? (of "geen")

Schrijf strak en zakelijk. Max 100 woorden totaal.`,
        messages: [
          {
            role: "user",
            content: `Status: ${status} | Berichten: ${aantalGebruiker} van gebruiker, ${aantalBenji} van Benji | Beoordeling: ${beoordeling}\n\nGesprek:\n${transcriptVoorAnalyse}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error(`[analyzeSessionAdmin] API error: ${response.status}`);
      return;
    }

    const data = (await response.json()) as ClaudeAPIResponse;
    const rapport = data.content?.[0]?.text?.trim() ?? "";

    if (rapport) {
      await ctx.runMutation(internal.chat.setAdminRapport, {
        sessionId: args.sessionId,
        rapport,
      });

      // Auto-genereer trainingsuggestie op basis van het rapport (Haiku = snel & goedkoop)
      try {
        const suggestPrompt = `Je bent een kwaliteitscontroleur voor Benji, een empathische rouw-chatbot.
Hieronder staat een kwaliteitsrapport. Vertaal het "Actie" punt naar een concrete verbetering.
Kies "rules" voor gedragsregels/aanpak/crisisprotocol, of "knowledge" voor ontbrekende inhoudelijke kennis.

RAPPORT:
${rapport}

Antwoord ALLEEN in dit JSON formaat:
{"probleem":"één zin","type":"rules","reden":"één zin","toevoeging":"concrete rules-tekst (of leeg bij knowledge)","knowledge_question":"(of leeg)","knowledge_answer":"(of leeg)","knowledge_category":"(of leeg)"}`;

        const suggestResp = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
          body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 400, messages: [{ role: "user", content: suggestPrompt }] }),
        });
        if (suggestResp.ok) {
          const suggestData = (await suggestResp.json()) as ClaudeAPIResponse;
          const suggestText = suggestData.content?.[0]?.text?.trim() ?? "";
          const match = suggestText.match(/\{[\s\S]*\}/);
          if (match) {
            await ctx.runMutation(internal.chat.setAdminRapport, {
              sessionId: args.sessionId,
              rapport,
              suggestie: match[0],
            });
          }
        }
      } catch {
        // Suggestie falen is niet kritiek
      }
    }
  },
});

/**
 * Genereer 5-10 alternatieve manieren om een vraag te stellen.
 * Vermijdt duplicaten op basis van bestaande vragen.
 */
export const generateAlternativeQuestions = action({
  args: {
    adminToken: v.string(),
    question: v.string(),
    answer: v.string(),
    existingToAvoid: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args): Promise<string[]> => {
    await ctx.runQuery(api.adminAuth.validateToken, { adminToken: args.adminToken });
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey || apiKey === "your-api-key-here") {
        throw new Error("ANTHROPIC_API_KEY niet geconfigureerd. Ga naar Convex Dashboard → Settings → Environment Variables.");
      }

      const avoid = (args.existingToAvoid || []).slice(0, 30);
      const avoidList = avoid.length
        ? `\nVermijd deze vragen (bestaan al):\n${avoid.join("\n")}`
        : "";

      const prompt = `Geef 5 tot 10 alternatieve manieren waarop gebruikers dezelfde vraag kunnen stellen. Gebruik dezelfde taal als de vraag.

Vraag: ${args.question}
Antwoord: ${args.answer}
${avoidList}

Regels:
- Elke alternatieve vraag op een aparte regel
- Geen nummering of bullets
- Geen uitleg, alleen de vragen
- Variatie: formele/informele formuleringen, korte/lange vragen, synoniemen
- Geen herhaling van de originele vraag
- Voeg GEEN vragen toe die al in de "Vermijd" lijst staan`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: 512,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const text = await response.text();
      if (!response.ok) {
        throw new Error(`Claude API: ${response.status} - ${text.slice(0, 200)}`);
      }

      let data: ClaudeAPIResponse;
      try {
        data = JSON.parse(text) as ClaudeAPIResponse;
      } catch {
        throw new Error("Ongeldige API-respons. Probeer het opnieuw.");
      }

      const raw = data.content?.[0]?.text?.trim() ?? "";
      const avoidSet = new Set(
        (args.existingToAvoid || []).map((q) => q.toLowerCase().trim())
      );
      const lines = raw
        .split("\n")
        .map((l) => l.replace(/^[-*•]\s*/, "").replace(/^\d+\.\s*/, "").trim())
        .filter((l) => l.length > 5 && !avoidSet.has(l.toLowerCase()));

      return Array.from(new Set(lines)).slice(0, 10);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Genereren mislukt: ${msg}`);
    }
  },
});

/**
 * Genereer 3-6 alternatieve formuleringen van het antwoord.
 * De AI kan deze gebruiken voor meer variatie in antwoorden.
 */
export const generateAlternativeAnswers = action({
  args: {
    adminToken: v.string(),
    question: v.string(),
    answer: v.string(),
  },
  handler: async (ctx, args): Promise<string[]> => {
    await ctx.runQuery(api.adminAuth.validateToken, { adminToken: args.adminToken });
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey || apiKey === "your-api-key-here") {
        throw new Error("ANTHROPIC_API_KEY niet geconfigureerd. Ga naar Convex Dashboard → Settings → Environment Variables.");
      }

      const prompt = `Geef 3 tot 6 alternatieve formuleringen van het antwoord. Zelfde inhoud, andere woorden/zinsbouw. Gebruik dezelfde taal.

Vraag: ${args.question}
Origineel antwoord: ${args.answer}

Regels:
- Elke alternatieve antwoord op een aparte regel
- Geen nummering of bullets
- Geen uitleg
- Behoud dezelfde informatie, formuleer anders (korter/langer, formeler/informeler)
- Geen herhaling van het originele antwoord`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: 1024,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const text = await response.text();
      if (!response.ok) {
        throw new Error(`Claude API: ${response.status} - ${text.slice(0, 200)}`);
      }

      let data: ClaudeAPIResponse;
      try {
        data = JSON.parse(text) as ClaudeAPIResponse;
      } catch {
        throw new Error("Ongeldige API-respons. Probeer het opnieuw.");
      }

      const raw = data.content?.[0]?.text?.trim() ?? "";
      const origLower = args.answer.toLowerCase().trim();
      const lines = raw
        .split("\n")
        .map((l) => l.replace(/^[-*•]\s*/, "").replace(/^\d+\.\s*/, "").trim())
        .filter((l) => l.length > 15 && l.toLowerCase() !== origLower);

      return Array.from(new Set(lines)).slice(0, 6);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Genereren mislukt: ${msg}`);
    }
  },
});

/**
 * Genereer 5-10 relevante tags voor een Q&A.
 * Tags zijn zoekwoorden voor betere matching.
 */
export const generateTags = action({
  args: {
    adminToken: v.string(),
    question: v.string(),
    answer: v.string(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<string[]> => {
    await ctx.runQuery(api.adminAuth.validateToken, { adminToken: args.adminToken });
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey || apiKey === "your-api-key-here") {
        throw new Error("ANTHROPIC_API_KEY niet geconfigureerd. Ga naar Convex Dashboard → Settings → Environment Variables.");
      }

      const catHint = args.category ? `\nCategorie: ${args.category}` : "";

      const prompt = `Geef 5 tot 10 korte zoekwoorden (tags) voor deze Q&A. Gebruik dezelfde taal als de vraag.
Gebruik alleen kleine letters, geen spaties in een tag (gebruik koppelteken indien nodig).
${catHint}

Vraag: ${args.question}
Antwoord: ${args.answer}

Regels:
- Alleen tags, gescheiden door komma's
- Geen nummering of uitleg
- Korte woorden: 1-3 woorden per tag
- Relevante zoektermen waar gebruikers op kunnen zoeken
- Geen herhaling van de vraag`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: 256,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const text = await response.text();
      if (!response.ok) {
        throw new Error(`Claude API: ${response.status} - ${text.slice(0, 200)}`);
      }

      let data: ClaudeAPIResponse;
      try {
        data = JSON.parse(text) as ClaudeAPIResponse;
      } catch {
        throw new Error("Ongeldige API-respons. Probeer het opnieuw.");
      }

      const raw = (data.content?.[0] as { text?: string } | undefined)?.text?.trim() ?? "";
      const tags = raw
        .split(/[,;\n]+/)
        .map((t) => t.trim().toLowerCase().replace(/\s+/g, "-"))
        .filter((t) => t.length > 1 && t.length < 30);

      return Array.from(new Set(tags)).slice(0, 10);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Tags genereren mislukt: ${msg}`);
    }
  },
});

// ============================================================================
// CLAUDE API INTEGRATIE
// ============================================================================

/**
 * Roep Claude API aan met knowledge en rules
 */
async function callClaudeAPI(
  userMessage: string,
  knowledge: string,
  rules: string,
  conversationHistory: ClaudeMessage[],
  volatileRules: string = ""
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey === "your-api-key-here") {
    throw new Error(
      "ANTHROPIC_API_KEY niet geconfigureerd. Voor Convex actions moet je de API key instellen in het Convex Dashboard: Settings → Environment Variables → ANTHROPIC_API_KEY"
    );
  }

  // Detecteer taal van de vraag (eenvoudige detectie)
  const isEnglish = /^[A-Za-z]/.test(userMessage.trim()) && 
    (userMessage.toLowerCase().includes('why') || 
     userMessage.toLowerCase().includes('how') || 
     userMessage.toLowerCase().includes('what') ||
     userMessage.toLowerCase().includes('when') ||
     userMessage.toLowerCase().includes('where') ||
     userMessage.toLowerCase().includes('can') ||
     userMessage.toLowerCase().includes('do') ||
     userMessage.toLowerCase().includes('does'));

  // Dynamische variabelen: datum en tijd voor context in antwoorden
  const now = new Date();
  const dateStr = now.toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  });
  // Datum en tijd blijven als neutrale achtergrond beschikbaar (zodat Benji zelf
  // kan uitrekenen hoeveel tijd er verstreken is als de bezoeker een datum noemt),
  // maar Benji begint er NIET uit zichzelf over. Geen aannames over nacht of niet
  // kunnen slapen op basis van de klok — dat botste met de tijd- en slaap-regels
  // en leidde tot ongevraagde vragen op emotionele momenten.
  const dynamicContext = isEnglish
    ? `## Current context (use when relevant):\nToday: ${dateStr}. Current time: ${timeStr}.`
    : `## Huidige context (gebruik wanneer relevant):\nVandaag: ${dateStr}. Huidige tijd: ${timeStr}.`;

  // Limiter knowledge en rules lengte (max 10000 karakters totaal voor knowledge - verlaagd voor 503 overflow)
  const maxKnowledgeLength = 10000;
  const limitedKnowledge = knowledge && knowledge.length > maxKnowledgeLength 
    ? knowledge.slice(0, maxKnowledgeLength) + " [Kennis ingekort...]"
    : knowledge;
  
  // Veiligheidsnet ruim gezet zodat de volledige (samengevoegde) regelset aankomt
  // i.p.v. afgekapt te worden. ~60k tekens ≈ ~16k tokens, ruim binnen 1M context.
  const maxRulesLength = 60000;
  const limitedRules = rules && rules.length > maxRulesLength
    ? rules.slice(0, maxRulesLength)
    : rules;

  // Bouw het systeem bericht met knowledge en rules.
  // PROMPT CACHING: gesplitst in een VAST blok (persona + regels) dat bij elk bericht
  // identiek is en gecachet wordt, en een VARIABEL blok (datum/tijd, gast-nudge, kennis)
  // dat per bericht verandert en dus NA het cachepunt komt. De klok mag NIET in het vaste
  // blok, anders breekt de cache elke minuut.
  const languageInstruction = isEnglish
    ? "IMPORTANT: The user is asking in English. Respond in English using the same language as the question."
    : "BELANGRIJK: De gebruiker vraagt in het Nederlands. Antwoord in het Nederlands, gebruik dezelfde taal als de vraag.";

  let stableSystem: string;
  let volatileSystem: string;

  if (limitedKnowledge || limitedRules) {
    if (isEnglish) {
      stableSystem = `You are a helpful assistant for a company.

${languageInstruction}

${limitedRules ? `## Rules for how you should respond:\n${limitedRules}` : ""}`;
      volatileSystem = `${dynamicContext}

${volatileRules ? `${volatileRules}\n\n` : ""}${limitedKnowledge ? `## Knowledge you should use:\n${limitedKnowledge}\n\n` : ""}Answer questions based on the above knowledge and rules. If you don't know the answer based on the given knowledge, be honest about it.`;
    } else {
      stableSystem = `${languageInstruction}

Je bent Benji, een warme en empathische gesprekspartner voor mensen die met verlies, verdriet of een moeilijke periode omgaan. Je luistert zonder oordeel en geeft ruimte aan wat de ander voelt. Je geeft geen adviezen tenzij daarom gevraagd wordt.

Let op hoe je klinkt, dit is belangrijk: kaats niet terug wat de bezoeker net zei en herhaal hun eigen woorden of getallen niet als opening. Reageer op de betekenis erachter, niet op de letterlijke tekst. Maar leg de bezoeker daarbij geen gevoelens, gedachten of oordelen in de mond: zeg niet hóé zij zich voelen, wat zij eigenlijk zouden bedoelen, of wat de overledene verdiende, wilde of heeft doorgemaakt, tenzij de bezoeker dat zelf zo heeft gezegd. Verzin geen omstandigheden, achtergrond of details die niet genoemd zijn en blijf bij hun eigen woorden. Bij twijfel: benoem minder en vraag zacht, in plaats van het zelf in te vullen.

Stuur het gesprek niet met steeds nieuwe vragen, dan wordt het een interview en krijgt de bezoeker geen ruimte om zelf te bepalen waar het heen gaat. Stel nooit twee vragen achter elkaar: was je vorige bericht een vraag, blijf dan nu gewoon bij wat er net gezegd is zonder er een te stellen. Blijf vaker bij het onderwerp dat de bezoeker zelf aansnijdt, in plaats van zelf een nieuw onderwerp aan te snijden. Stel je geen vraag, sluit dan open af met een zachte uitnodiging of een rustige zin, niet met een dichtgetimmerde conclusie. Wissel je openingen af en begin nooit twee berichten op dezelfde manier.

${limitedRules ? `## Aanvullende richtlijnen:\n${limitedRules}` : ""}`;
      volatileSystem = `${dynamicContext}

${volatileRules ? `${volatileRules}\n\n` : ""}${limitedKnowledge ? `## Achtergrondkennis:\n${limitedKnowledge}\n\n` : ""}Reageer als een mens die écht luistert. Kort als het kan, dieper als het nodig is. Gebruik de achtergrondkennis alleen als het natuurlijk past in het gesprek, dwing het er nooit in.`;
    }
  } else {
    stableSystem = (isEnglish ? "You are a helpful assistant." : "Je bent een behulpzame assistent.") + `\n\n${languageInstruction}`;
    volatileSystem = dynamicContext;
  }

  // Veiligheidscap per blok (ruim: regels ~60k, kennis ~10k)
  const maxStableLength = 70000;
  const maxVolatileLength = 20000;
  if (stableSystem.length > maxStableLength) stableSystem = stableSystem.slice(0, maxStableLength) + " [ingekort...]";
  if (volatileSystem.length > maxVolatileLength) volatileSystem = volatileSystem.slice(0, maxVolatileLength) + " [ingekort...]";

  // System als content-blokken: het vaste blok krijgt cache_control zodat Anthropic het
  // hergebruikt (prefix-cache, ~90% goedkoper op input). Het variabele blok komt erna, ongecachet.
  const systemBlocks: Array<{ type: "text"; text: string; cache_control?: { type: "ephemeral" } }> = [
    { type: "text", text: stableSystem, cache_control: { type: "ephemeral" } },
  ];
  if (volatileSystem.trim()) {
    systemBlocks.push({ type: "text", text: volatileSystem });
  }

  // Limiter user message lengte (max 1000 karakters - verlaagd voor rate limits)
  const limitedUserMessage = userMessage.slice(0, 1000);
  
  // Bouw de berichten array
  const messages: ClaudeMessage[] = [
    ...conversationHistory,
    {
      role: "user",
      content: limitedUserMessage,
    },
  ];

    // Retry logic voor rate limits (429 errors)
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Wacht bij retry (exponential backoff)
        if (attempt > 0) {
          const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Max 10 seconden
          console.log(`Rate limit hit, wachten ${waitTime}ms voor retry ${attempt}/${maxRetries}...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            // temperature verwijderd: Opus 4.8 accepteert die parameter niet meer
            // (gaf 400 "temperature is deprecated"). Variatie in antwoorden sturen
            // we via de regels; Opus is daar goed op afgesteld.
            model: CLAUDE_MODEL,
            max_tokens: 1024,
            system: systemBlocks,
            messages: messages,
          }),
        });

        const responseText = await response.text();
        if (!response.ok) {
          // Log volledige error voor debugging
          console.error("Claude API error:", response.status, responseText);
          console.error("System prompt length:", stableSystem.length + volatileSystem.length);
          console.error("Messages count:", messages.length);
          console.error("Total message length:", messages.reduce((sum, m) => sum + m.content.length, 0));
          
          if (response.status === 401) {
            throw new Error(
              "401 Unauthorized: API key ongeldig of afgewezen. Check ANTHROPIC_API_KEY in Convex Dashboard (Settings → Environment variables). Geen spaties, juiste key van console.anthropic.com. Response: " + responseText.slice(0, 150)
            );
          }
          if (response.status === 400) {
            // 400 Bad Request kan betekenen dat de request te groot is
            const errorData = responseText.slice(0, 500);
            if (errorData.includes("token") || errorData.includes("length") || errorData.includes("too large") || errorData.includes("context_length")) {
              throw new Error(`Request te groot (400): De input is te lang (${stableSystem.length + volatileSystem.length} karakters system prompt). Probeer kortere berichten of verminder knowledge base. Details: ${errorData}`);
            }
          }
          if (response.status === 429) {
            // Rate limit error - retry met backoff
            if (attempt < maxRetries) {
              lastError = new Error(`Rate limit (429): Te veel requests. Retry ${attempt + 1}/${maxRetries}...`);
              continue; // Retry
            } else {
              throw new Error(`Rate limit (429): Te veel requests na ${maxRetries} pogingen. Wacht even en probeer het opnieuw. Details: ${responseText.slice(0, 300)}`);
            }
          }
          throw new Error(`Claude API error ${response.status}: ${responseText.slice(0, 300)}`);
        }

        const data = JSON.parse(responseText) as ClaudeAPIResponse;
        // Cache-controle: bij het 2e bericht in een gesprek hoort read > 0 te zijn.
        console.log(`[cache] read=${data.usage?.cache_read_input_tokens ?? 0} write=${data.usage?.cache_creation_input_tokens ?? 0} input=${data.usage?.input_tokens ?? 0}`);
        if (!data.content?.length || !data.content[0].text) {
          console.error("Claude API: lege of onverwachte response", data);
          throw new Error("Claude API gaf geen antwoord terug");
        }
        return data.content[0].text;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        // Alleen retry bij 429 errors
        if (error instanceof Error && error.message.includes("429") && attempt < maxRetries) {
          continue; // Retry
        }
        // Bij andere errors of laatste poging: gooi error
        throw lastError;
      }
    }
    
    // Als we hier komen, zijn alle retries mislukt
    throw lastError || new Error("Claude API call mislukt na meerdere pogingen");
  }
