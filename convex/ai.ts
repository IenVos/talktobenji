"use node";

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
import { action } from "./_generated/server";
import { api } from "./_generated/api";

// ============================================================================
// TYPES EN INTERFACES
// ============================================================================

interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

interface ClaudeAPIResponse {
  content: Array<{ type: string; text: string }>;
  usage: { input_tokens: number; output_tokens: number };
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
      // STAP 1: Sla gebruikersbericht op
      const userMessageId = await ctx.runMutation(api.chat.sendUserMessage, {
        sessionId: args.sessionId,
        content: args.userMessage,
      });

      // STAP 2: Haal bot settings op (rules), knowledge base Q&As en bronnen (RAG)
      const settings = await ctx.runQuery(api.settings.get);
      const allKnowledgeBaseQuestions = await ctx.runQuery(api.knowledgeBase.getAllQuestions, {
        isActive: true,
      });
      const allSources = await ctx.runQuery(api.sources.getActiveSources);

      const isEnglish = /^[A-Za-z]/.test(args.userMessage.trim());
      const emptyKbMessage = isEnglish
        ? "There is no information in the knowledge base yet. Add Knowledge and Q&As via the admin panel (/admin) to answer questions."
        : "Er is nog geen kennis geconfigureerd. Voeg Knowledge en Q&A's toe via het admin panel (/admin) om vragen te kunnen beantwoorden.";

      const hasKnowledge = (settings?.knowledge || "").trim().length > 0;
      const hasSources = allSources && allSources.length > 0;

      // Geen kennis: geen Admin Knowledge, geen Q&As, geen bronnen → duidelijke melding
      if (!hasKnowledge && allKnowledgeBaseQuestions.length === 0 && !hasSources) {
        const botMessageIdEmpty = await ctx.runMutation(api.chat.sendBotMessage, {
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
      
      // Dynamische limieten: bij langere gesprekken agressiever reduceren
      const historyLimit = messageCount > 10 ? 2 : 3; // Bij >10 berichten: alleen laatste 2
      const charLimit = messageCount > 10 ? 500 : 800; // Bij >10 berichten: kortere berichten
      
      const messages = await ctx.runQuery(api.chat.getMessages, {
        sessionId: args.sessionId,
        limit: historyLimit + 1, // +1 omdat we het laatste bericht excluden
      });

      // Converteer naar Claude formaat en limiter lengte per bericht
      const conversationHistory: ClaudeMessage[] = messages
        .slice(0, -1) // Exclude het laatste bericht (dat is de nieuwe user message)
        .map((m: { role: string; content: string }) => ({
          role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
          content: m.content.slice(0, charLimit), // Dynamische karakter limiet
        }))
        .filter(m => m.content.trim().length > 0); // Verwijder lege berichten

      // STAP 4: Filter relevante knowledge base vragen - ALLEEN als er een goede match is
      const userMessageLower = args.userMessage.toLowerCase().trim();
      const userWords = userMessageLower.split(/\s+/).filter(w => w.length > 2);
      
      // Detecteer of gebruiker expliciet om een tip/advies vraagt
      const isAskingForTip = userMessageLower.includes("tip") || 
                             userMessageLower.includes("advies") || 
                             userMessageLower.includes("suggestie") || 
                             userMessageLower.includes("idee") ||
                             userMessageLower.includes("wat kan helpen") ||
                             userMessageLower.includes("wat zou kunnen helpen") ||
                             userMessageLower.includes("kun je") && (userMessageLower.includes("geven") || userMessageLower.includes("helpen"));
      
      const scoredQuestions = allKnowledgeBaseQuestions.map((q: {
        question: string;
        answer: string;
        alternativeQuestions?: string[];
        alternativeAnswers?: string[];
        questionEn?: string;
        answerEn?: string;
        tags?: string[];
        priority?: number;
        usageCount?: number;
      }) => {
        // Start score met prioriteit (1-10) en usage count
        let score = (q.priority || 1) * 2;
        if (q.usageCount) {
          score += Math.min(q.usageCount / 10, 5);
        }
        
        // Combineer alle tekst voor matching
        const questionText = (q.question + " " + (q.alternativeQuestions || []).join(" ") + " " + (q.tags || []).join(" ")).toLowerCase();
        const answerText = q.answer.toLowerCase();
        
        // Exacte match in vraag = hoogste score
        if (q.question.toLowerCase().includes(userMessageLower) || userMessageLower.includes(q.question.toLowerCase())) {
          score += 20;
        }
        
        // Match in alternatieve vragen
        if (q.alternativeQuestions) {
          for (const alt of q.alternativeQuestions) {
            if (alt.toLowerCase().includes(userMessageLower) || userMessageLower.includes(alt.toLowerCase())) {
              score += 15;
              break;
            }
          }
        }
        
        // Keyword matching: elke matching word geeft punten
        let keywordMatches = 0;
        for (const word of userWords) {
          if (questionText.includes(word)) {
            score += 3;
            keywordMatches++;
          }
          if (answerText.includes(word)) {
            score += 1;
          }
        }
        
        // Bonus als meerdere keywords matchen
        if (keywordMatches >= 2) {
          score += 5;
        }
        
        // Tag matching
        if (q.tags) {
          for (const tag of q.tags) {
            if (userMessageLower.includes(tag.toLowerCase())) {
              score += 4;
            }
          }
        }
        
        return { ...q, score };
      });
      
      // Sorteer op score
      const sortedQuestions = scoredQuestions.sort((a, b) => b.score - a.score);
      
      // BELANGRIJK: Alleen Q&As meesturen als er een goede match is (score >= 15 - verhoogd voor betere filtering)
      // Dit voorkomt dat we onnodig veel tokens gebruiken
      const minScoreThreshold = 15; // Minimum score om mee te sturen (verhoogd voor rate limits)
      const knowledgeBaseQuestions = sortedQuestions
        .filter(q => q.score >= minScoreThreshold)
        .slice(0, 5); // Max 5 relevante Q&As (verlaagd van 10 voor rate limits)

      // STAP 5: Filter en limiter sources (max 2 sources, max 4000 karakters per source - balans)
      const sources = (allSources || [])
        .slice(0, 2) // Max 2 sources
        .map((s: { title: string; type: string; url?: string; extractedText: string }) => ({
          ...s,
          extractedText: s.extractedText.slice(0, 4000) // Max 4000 karakters per source (balans)
        }));

      // STAP 6: Sources voorbereiden (worden alleen gebruikt als er geen excellent KB matches zijn)

      // NIEUWE STRATEGIE: Gebruik knowledge base ALLEEN als er een EXCELLENTE match is
      // Bij langere gesprekken (>10 berichten): nog agressiever reduceren
      const knowledgeFromSettings = (settings?.knowledge || "").trim();
      const parts: string[] = [];
      
      // Dynamische limieten op basis van gesprekslengte
      const settingsLimit = messageCount > 10 ? 2500 : 4000;
      // Verlaag threshold als gebruiker expliciet om tip vraagt (meer kennis beschikbaar maken)
      const baseKbThreshold = messageCount > 10 ? 25 : 20;
      const kbThreshold = isAskingForTip ? Math.max(10, baseKbThreshold - 10) : baseKbThreshold; // Lagere threshold bij tip-verzoek
      const kbMaxMatches = isAskingForTip ? (messageCount > 10 ? 3 : 5) : (messageCount > 10 ? 2 : 3); // Meer matches bij tip-verzoek
      
      // Altijd: algemene kennis (dynamische limiet)
      if (knowledgeFromSettings) {
        const limitedSettings = knowledgeFromSettings.slice(0, settingsLimit);
        parts.push("## Algemene kennis en context\n" + limitedSettings);
      }
      
      // Knowledge base: ALLEEN als er een EXCELLENTE match is (dynamische threshold)
      const excellentMatches = sortedQuestions
        .filter(q => q.score >= kbThreshold) // Dynamische threshold
        .slice(0, kbMaxMatches); // Dynamisch aantal matches
      
      if (excellentMatches.length > 0) {
        // Bouw knowledge base alleen voor excellent matches
        const excellentKb = excellentMatches
          .map((q: {
            question: string;
            answer: string;
          }) => {
            const shortAnswer = q.answer.length > 200 
              ? q.answer.slice(0, 200) + "..."
              : q.answer;
            const shortQuestion = q.question.length > 80
              ? q.question.slice(0, 80) + "..."
              : q.question;
            return `Vraag: ${shortQuestion}\nAntwoord: ${shortAnswer}`;
          })
          .join("\n\n---\n\n");
        
        const limitedKb = excellentKb.slice(0, 3000); // Max 3000 karakters
        parts.push((parts.length ? "\n" : "") + "## Knowledge base (Q&A's)\n" + limitedKb);
      }
      
      // Sources: ALLEEN als er geen knowledge base matches zijn (anders te veel tokens)
      const knowledgeFromSources =
        sources && sources.length > 0 && excellentMatches.length === 0
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
        ? "IMPORTANT: Use the knowledge base below first to answer. If the answer is not in the knowledge base, you may use the additional sources (PDFs, URLs) to distill an answer. If neither contains the answer, say clearly that you cannot answer and suggest adding the topic. In that case only, end your response with exactly [UNANSWERED] (nothing else after it) so we can track these questions."
        : "BELANGRIJK: Gebruik eerst de knowledge base hieronder om te antwoorden. Als het antwoord niet in de knowledge base staat, mag je de aanvullende bronnen (PDF's, websites) gebruiken om een antwoord te destilleren. Als geen van beide het antwoord bevat, zeg dan duidelijk dat je het niet kunt beantwoorden en stel voor het onderwerp toe te voegen. In dat geval alleen: eindig je antwoord met exact [UNANSWERED] (niets anders erna) zodat we deze vragen kunnen bijhouden.";

      const dutchLanguageRule = isEnglish
        ? ""
        : `TAALKWALITEIT: Gebruik altijd correct, natuurlijk Nederlands. Elke zin moet grammaticaal perfect zijn.

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

      const noJargonRule = isEnglish
        ? "AVOID JARGON: Do not use terms like 'bodyscan', 'mindfulness', 'grounding' etc. without first asking what the person already knows or tries. Use simple, everyday language. Describe what you mean in plain words (e.g. 'focus on each body part and release tension' instead of 'bodyscan')."
        : "GEEN JARGON: Gebruik geen termen als 'bodyscan', 'mindfulness', 'grounding' etc. zonder eerst te vragen wat de persoon al kent of probeert. Gebruik eenvoudige, alledaagse taal. Beschrijf wat je bedoelt in gewone woorden (bijv. 'richt je aandacht op elk lichaamsdeel en laat spanning los' in plaats van 'bodyscan').";

      const noRepetitionRule = isEnglish
        ? "AVOID REPETITION: Do not repeat the same words, phrases, or ideas in consecutive messages. Vary your language. If you already asked about something or mentioned it, don't repeat it in the same way. Use synonyms and different phrasings. Keep responses fresh and varied."
        : `GEEN HERHALING: Herhaal niet dezelfde woorden, zinnen of ideeën in opeenvolgende berichten. Varieer je taalgebruik.

SPECIFIEKE REGELS:
- Begin NOOIT twee opeenvolgende berichten met dezelfde openingszin of hetzelfde patroon
  FOUT: Bericht 1 begint met "Dat klinkt..." → Bericht 2 begint ook met "Dat klinkt..."
  GOED: Varieer je openingszinnen (bijv. "Wat je beschrijft...", "Ik hoor je...", "Het is begrijpelijk dat...")

- Gebruik NOOIT herhaaldelijk dezelfde slogans of kernzinnen
  FOUT: "Zonder oordeel. Dag en nacht." in meerdere berichten herhalen
  GOED: Zeg dit maximaal één keer in een heel gesprek, als het echt past

- Vermijd meta-uitspraken over jezelf als AI/chatbot
  FOUT: "Ik ben getraind om...", "Ik ben er om...", "Ik ben hier voor je, dag en nacht", "Zonder oordeel"
  GOED: Toon het in je antwoord in plaats van het te zeggen. Wees gewoon empathisch zonder te benoemen dat je empathisch bent.

- Herhaal NIET wat de gebruiker net zei in je eigen woorden als dat het hele antwoord is
  FOUT: Gebruiker zegt "ik voel me leeg" → "Die leegte, wat voelt dat als." (voegt niets toe)
  GOED: Reageer met iets dat het gesprek verder brengt: "Dat klinkt zwaar. Wanneer begon dat gevoel?" of "Ik kan me voorstellen dat dat moeilijk is. Wil je er meer over vertellen?"`;

      const contextAwarenessRule = isEnglish
        ? ""
        : `CONTEXTBEWUSTZIJN: Let goed op de context van het gesprek en pas je taalgebruik aan.

HUISDIEREN EN DIEREN:
- Als iemand praat over het verlies van een huisdier (hond, kat, konijn, etc.), gebruik dan GEEN taal die alleen bij mensen past
  FOUT: "jullie het niet hebben kunnen uitpraten" (een dier kan niet praten)
  FOUT: "wat zou hij/zij tegen je willen zeggen" (een dier spreekt niet)
  GOED: "dat jullie geen afscheid hebben kunnen nemen", "dat het zo plotseling ging", "je hebt niet meer de kans gehad om bij hem/haar te zijn"
- Herken signalen dat het over een dier gaat: "mijn hond", "mijn kat", "mijn poes", "ons huisdier", "beestje", "dierenarts", "laten inslapen", namen die typisch voor dieren zijn
- Bij dierenverlies: focus op het gemis van hun aanwezigheid, de lege plek, de routines die wegvallen, de onvoorwaardelijke liefde

ALGEMEEN:
- Pas je taalgebruik aan de situatie aan. Gebruik geen uitdrukkingen die niet logisch zijn in de context.
- Als iemand over een kind praat, gebruik andere taal dan wanneer iemand over een partner praat.
- Let op of iemand over zichzelf, een ander, of een dier praat en pas je reactie daarop aan.`;

      const conversationStyleRule = isEnglish
        ? "CONVERSATION STYLE: Give empathetic, specific responses. Don't ask multiple vague questions in a row. When someone shares something difficult, acknowledge it first before asking questions. Be concrete and specific, not generic. If you ask a question, make it one clear, specific question that builds on what they just said. Avoid generic questions like 'What helps you?' or 'What gives you space?' - be more specific based on the context. IMPORTANT: When someone explicitly asks for a tip or suggestion (e.g., 'can you give a tip', 'what can help', 'do you have advice'), provide a concrete tip or suggestion based on the knowledge base or general knowledge. Do NOT respond by asking another question - give actual helpful advice."
        : `GESPREKSSTIJL: Geef empathische, specifieke antwoorden. Stel niet meerdere vage vragen achter elkaar.

BELANGRIJKE REGELS:
- Wanneer iemand expliciet om een tip vraagt, geef dan een concrete tip
  FOUT: Gebruiker vraagt "kun jij een tip geven" → "Wat speelt er voor jou?" (opnieuw vragen)
  GOED: Gebruiker vraagt "kun jij een tip geven" → "Soms helpt het om kleine momenten te creëren die je aandacht geven. Bijvoorbeeld: een korte wandeling, iemand bellen, of iets doen wat je vroeger plezier gaf. Wat past bij jou?" (concrete tip geven)
  
  Als je kennis hebt in de knowledge base over het onderwerp, gebruik die kennis om concrete tips te geven.
  Als je geen specifieke kennis hebt, geef dan algemene, praktische suggesties gebaseerd op wat de persoon heeft gedeeld.

- Erken eerst wat de ander zegt voordat je vragen stelt
  FOUT: "Wat helpt voor jou als je je zo voelt. Wat geeft je wat ruimte." (twee vage vragen achter elkaar)
  GOED: "Dat alleen-zijn voelt inderdaad zwaar. Soms helpt het om te bedenken wat je in het verleden heeft geholpen. Is er iets wat je vroeger deed toen je je zo voelde?" (erkenning + één specifieke vraag)

- Wees concreet en specifiek, niet vaag
  FOUT: "Wat helpt voor jou?" of "Wat geeft je wat ruimte?"
  GOED: "Is er iets wat je helpt om het lichter te maken? Bijvoorbeeld iemand bellen, naar buiten gaan, of iets anders?" (specifiek met voorbeelden)

- Stel maximaal één vraag per bericht, en maak die vraag specifiek
  FOUT: "Wat helpt voor jou als je je zo voelt. Wat geeft je wat ruimte." (twee vragen)
  GOED: "Wat heeft je in het verleden geholpen als je je zo voelde?" (één specifieke vraag)

- Bouw voort op wat de ander net zei
  Als iemand zegt "het voelt zwaar", reageer daarop specifiek, niet met een generieke vraag
  FOUT: "Wat helpt voor jou als je je zo voelt." (generiek)
  GOED: "Dat zware gevoel, dat is moeilijk. Wat maakt het voor jou het zwaarst?" (specifiek op wat ze zeiden)

- Geef context en erkenning, niet alleen vragen
  FOUT: Direct vragen stellen zonder erkenning
  GOED: Eerst erkennen wat ze zeiden, dan één specifieke vraag stellen
  
- BELANGRIJK: Bij verzoeken om tips/advies, geef concrete suggesties
  Als iemand vraagt om een tip, advies, of suggestie, geef dan concrete, praktische hulp gebaseerd op:
  1. De knowledge base (als er relevante kennis is)
  2. Algemene kennis over het onderwerp
  3. Wat de persoon al heeft gedeeld in het gesprek
  Vraag NIET opnieuw "Wat speelt er voor jou?" wanneer iemand al om hulp heeft gevraagd.`;

      const accountRule = isEnglish
        ? "ACCOUNT & REGISTRATION: When someone asks about creating an account, signing up, or registering, ALWAYS include a clickable link. Use markdown format: [click here to sign up](/registreren). If the question is clearly about account creation, give the link directly. Also mention the menu: they can click the three dots (⋮) and choose 'Sign up'."
        : `ACCOUNT & REGISTRATIE: Wanneer iemand vraagt over een account aanmaken, aanmelden of registreren, voeg ALTIJD een klikbare link toe. Gebruik markdown: [hier klikken om je aan te melden](/registreren). Als de vraag duidelijk over account aanmaken gaat, geef de link direct. Vermeld ook het menu: ze kunnen op de drie puntjes (⋮) klikken en kiezen voor 'Aanmelden'. Bij wachtwoord vergeten: verwijs naar [deze pagina](/wachtwoord-vergeten).`;

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

      const rules = [settings?.rules || "", onlyFromKbRule, dutchLanguageRule, noJargonRule, noRepetitionRule, contextAwarenessRule, conversationStyleRule, accountRule, memoryRule].filter(Boolean).join("\n\n");

      // STAP 5: Genereer AI response met fallback mechanisme voor langere gesprekken
      let aiResponse: string;
      try {
        aiResponse = await callClaudeAPI(
          args.userMessage,
          knowledgeCombined,
          rules,
          conversationHistory
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
      const botMessageId = await ctx.runMutation(api.chat.sendBotMessage, {
        sessionId: args.sessionId,
        content: aiResponse,
        isAiGenerated: true,
        confidenceScore: 0.8,
        generationMetadata: {
          model: "claude-haiku-4-5-20251001",
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
      await ctx.runMutation(api.chat.sendBotMessage, {
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

/**
 * Genereer 5-10 alternatieve manieren om een vraag te stellen.
 * Vermijdt duplicaten op basis van bestaande vragen.
 */
export const generateAlternativeQuestions = action({
  args: {
    question: v.string(),
    answer: v.string(),
    existingToAvoid: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args): Promise<string[]> => {
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
          model: "claude-haiku-4-5-20251001",
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
    question: v.string(),
    answer: v.string(),
  },
  handler: async (ctx, args): Promise<string[]> => {
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
          model: "claude-haiku-4-5-20251001",
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
    question: v.string(),
    answer: v.string(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<string[]> => {
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
          model: "claude-haiku-4-5-20251001",
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
  conversationHistory: ClaudeMessage[]
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
  const hour = now.getHours();
  const isLateNight = hour >= 23 || hour <= 5;
  const timeContextRule = isEnglish
    ? isLateNight
      ? " Use the time: when someone writes late at night or very early in the morning, acknowledge it gently (e.g. that they are still up, perhaps couldn't sleep, or woke up). Show you notice and care."
      : ""
    : isLateNight
      ? " Gebruik de tijd: als iemand laat in de nacht of heel vroeg in de ochtend schrijft, erken dat zacht (bijv. dat ze nog op zijn, misschien niet kunnen slapen, of wakker geworden zijn). Laat merken dat je het opvalt en dat het je kan schelen."
      : "";

  const dynamicContext = isEnglish
    ? `## Current context (use when relevant):\nToday: ${dateStr}. Current time: ${timeStr}.${timeContextRule}`
    : `## Huidige context (gebruik wanneer relevant):\nVandaag: ${dateStr}. Huidige tijd: ${timeStr}.${timeContextRule}`;

  // Limiter knowledge en rules lengte (max 10000 karakters totaal voor knowledge - verlaagd voor 503 overflow)
  const maxKnowledgeLength = 10000;
  const limitedKnowledge = knowledge && knowledge.length > maxKnowledgeLength 
    ? knowledge.slice(0, maxKnowledgeLength) + " [Kennis ingekort...]"
    : knowledge;
  
  // Limiter rules lengte (max 2000 karakters - verlaagd voor 503 overflow)
  const maxRulesLength = 2000;
  const limitedRules = rules && rules.length > maxRulesLength
    ? rules.slice(0, maxRulesLength) + " [Regels ingekort...]"
    : rules;

  // Bouw het systeem bericht met knowledge en rules
  const languageInstruction = isEnglish 
    ? "IMPORTANT: The user is asking in English. Respond in English using the same language as the question."
    : "BELANGRIJK: De gebruiker vraagt in het Nederlands. Antwoord in het Nederlands, gebruik dezelfde taal als de vraag.";

  let systemPrompt = isEnglish 
    ? "You are a helpful assistant."
    : "Je bent een behulpzame assistent.";

  if (limitedKnowledge || limitedRules) {
    systemPrompt = isEnglish
      ? `You are a helpful assistant for a company.

${dynamicContext}

${limitedRules ? `## Rules for how you should respond:\n${limitedRules}\n\n` : ""}
${limitedKnowledge ? `## Knowledge you should use:\n${limitedKnowledge}` : ""}

${languageInstruction}

Answer questions based on the above knowledge and rules. If you don't know the answer based on the given knowledge, be honest about it.`
      : `Je bent een behulpzame assistent voor een bedrijf.

${dynamicContext}

${limitedRules ? `## Regels voor hoe je moet reageren:\n${limitedRules}\n\n` : ""}
${limitedKnowledge ? `## Kennis die je moet gebruiken:\n${limitedKnowledge}` : ""}

${languageInstruction}

Beantwoord vragen op basis van bovenstaande kennis en regels. Als je het antwoord niet weet op basis van de gegeven kennis, geef dat eerlijk aan.`;
  } else {
    systemPrompt += `\n\n${dynamicContext}\n\n${languageInstruction}`;
  }
  
  // Totale limiet voor system prompt: max 15000 karakters (verlaagd voor 503 overflow)
  const maxSystemPromptLength = 15000;
  if (systemPrompt.length > maxSystemPromptLength) {
    systemPrompt = systemPrompt.slice(0, maxSystemPromptLength) + " [System prompt ingekort...]";
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
            model: "claude-haiku-4-5-20251001",
            max_tokens: 1024,
            system: systemPrompt,
            messages: messages,
          }),
        });

        const responseText = await response.text();
        if (!response.ok) {
          // Log volledige error voor debugging
          console.error("Claude API error:", response.status, responseText);
          console.error("System prompt length:", systemPrompt.length);
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
              throw new Error(`Request te groot (400): De input is te lang (${systemPrompt.length} karakters system prompt). Probeer kortere berichten of verminder knowledge base. Details: ${errorData}`);
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
