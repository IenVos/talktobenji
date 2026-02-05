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
      const knowledgeBaseQuestions = await ctx.runQuery(api.knowledgeBase.getAllQuestions, {
        isActive: true,
      });
      const sources = await ctx.runQuery(api.sources.getActiveSources);

      const isEnglish = /^[A-Za-z]/.test(args.userMessage.trim());
      const emptyKbMessage = isEnglish
        ? "There is no information in the knowledge base yet. Add Q&As via the admin panel (/admin/knowledge) to answer questions."
        : "Er is nog geen informatie in de knowledge base. Voeg Q&A's toe via het admin panel (/admin/knowledge) om vragen te kunnen beantwoorden.";

      // Lege knowledge base én geen bronnen → duidelijke melding
      if (knowledgeBaseQuestions.length === 0 && (!sources || sources.length === 0)) {
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

      // STAP 3: Haal conversatie geschiedenis op (laatste 10 berichten)
      const messages = await ctx.runQuery(api.chat.getMessages, {
        sessionId: args.sessionId,
        limit: 10,
      });

      // Converteer naar Claude formaat
      const conversationHistory: ClaudeMessage[] = messages
        .slice(0, -1) // Exclude het laatste bericht (dat is de nieuwe user message)
        .map((m: { role: string; content: string }) => ({
          role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
          content: m.content,
        }));

      // STAP 4: Bouw kennis uit knowledge base + bronnen (RAG)
      const knowledgeFromKb = knowledgeBaseQuestions
        .map(
          (q: {
            question: string;
            answer: string;
            questionEn?: string;
            answerEn?: string;
          }) => {
            const nl = `Vraag: ${q.question}\nAntwoord: ${q.answer}`;
            const en =
              q.questionEn && q.answerEn
                ? `\n(EN) Question: ${q.questionEn}\nAnswer: ${q.answerEn}`
                : "";
            return nl + en;
          }
        )
        .join("\n\n---\n\n");

      const knowledgeFromSources =
        sources && sources.length > 0
          ? sources
              .map(
                (s: { title: string; type: string; url?: string; extractedText: string }) =>
                  `[Bron: ${s.title}${s.url ? ` (${s.url})` : ""}]\n${s.extractedText.slice(0, 15000)}`
              )
              .join("\n\n---\n\n")
          : "";

      let knowledgeCombined = knowledgeFromKb;
      if (knowledgeFromSources) {
        knowledgeCombined += (knowledgeFromKb ? "\n\n" : "") + "## Aanvullende bronnen (PDF's, websites)\n\n" + knowledgeFromSources;
      }

      const onlyFromKbRule = isEnglish
        ? "IMPORTANT: Use the knowledge base below first to answer. If the answer is not in the knowledge base, you may use the additional sources (PDFs, URLs) to distill an answer. If neither contains the answer, say clearly that you cannot answer and suggest adding the topic."
        : "BELANGRIJK: Gebruik eerst de knowledge base hieronder om te antwoorden. Als het antwoord niet in de knowledge base staat, mag je de aanvullende bronnen (PDF's, websites) gebruiken om een antwoord te destilleren. Als geen van beide het antwoord bevat, zeg dan duidelijk dat je het niet kunt beantwoorden en stel voor het onderwerp toe te voegen.";

      const dutchLanguageRule = isEnglish
        ? ""
        : `TAALKWALITEIT: Gebruik altijd correct, natuurlijk Nederlands.
- Elke zin moet grammaticaal kloppen.
- FOUT: "dat durft iets zeggen" (ongrammaticaal)
- GOED: "dat zegt iets" of "en dat is al iets" of "dat getuigt van moed"
- Schrijf zoals een native speaker zou spreken.
- Lees je antwoord mentaal door voordat je het verstuurt.
- GEBRUIK NOOIT streepjes ( - ) tussen woorden of zinsdelen. Gebruik altijd een punt, komma of herformuleer: FOUT "weg - ze zitten", GOED "weg. Ze zitten" of "weg, ze zitten".

ZINFORMATIE (per bericht, niet over de hele chat): In elk antwoord dat je geeft: maximaal 4 zinnen aan elkaar. Als je meer dan 4 zinnen schrijft in dat ene bericht, voeg dan een lege regel (dubbele newline) toe als kleine spatie tussen de groepen van max 4 zinnen. Voorbeeld: "Zin 1. Zin 2. Zin 3. Zin 4.\n\nZin 5. Zin 6."`;

      const rules = [settings?.rules || "", onlyFromKbRule, dutchLanguageRule].filter(Boolean).join("\n\n");

      // STAP 5: Genereer AI response
      const aiResponse = await callClaudeAPI(
        args.userMessage,
        knowledgeCombined,
        rules,
        conversationHistory
      );

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

      // Detecteer taal voor error bericht
      const isEnglishError = /^[A-Za-z]/.test(args.userMessage.trim());
      const errorMessage = isEnglishError
        ? "I'm sorry, something went wrong. Please try again or contact support."
        : "Het spijt me, er is iets misgegaan. Probeer het opnieuw of neem contact op met support.";

      // Sla error antwoord op
      await ctx.runMutation(api.chat.sendBotMessage, {
        sessionId: args.sessionId,
        content: errorMessage,
        isAiGenerated: false,
        confidenceScore: 0,
        generationMetadata: {
          error: error.message,
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
 * Voor gebruik in de Knowledge Base admin (Nieuwe Q&A formulier).
 */
export const generateAlternativeQuestions = action({
  args: {
    question: v.string(),
    answer: v.string(),
  },
  handler: async (ctx, args): Promise<string[]> => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === "your-api-key-here") {
      throw new Error("ANTHROPIC_API_KEY niet geconfigureerd in Convex Dashboard.");
    }

    const prompt = `Geef 5 tot 10 alternatieve manieren waarop gebruikers dezelfde vraag kunnen stellen. Gebruik dezelfde taal als de vraag.

Vraag: ${args.question}
Antwoord: ${args.answer}

Regels:
- Elke alternatieve vraag op een aparte regel
- Geen nummering of bullets
- Geen uitleg, alleen de vragen
- Variatie: formele/informele formuleringen, korte/lange vragen, synoniemen
- Geen herhaling van de originele vraag`;

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
      throw new Error(`Claude API error: ${response.status} ${text.slice(0, 150)}`);
    }

    const data = JSON.parse(text) as ClaudeAPIResponse;
    const raw = data.content?.[0]?.text?.trim() ?? "";
    const lines = raw
      .split("\n")
      .map((l) => l.replace(/^[-*•]\s*/, "").replace(/^\d+\.\s*/, "").trim())
      .filter((l) => l.length > 5);

    return lines.slice(0, 10);
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

  // Bouw het systeem bericht met knowledge en rules
  const languageInstruction = isEnglish 
    ? "IMPORTANT: The user is asking in English. Respond in English using the same language as the question."
    : "BELANGRIJK: De gebruiker vraagt in het Nederlands. Antwoord in het Nederlands, gebruik dezelfde taal als de vraag.";

  let systemPrompt = isEnglish 
    ? "You are a helpful assistant."
    : "Je bent een behulpzame assistent.";

  if (knowledge || rules) {
    systemPrompt = isEnglish
      ? `You are a helpful assistant for a company.

${dynamicContext}

${rules ? `## Rules for how you should respond:\n${rules}\n\n` : ""}
${knowledge ? `## Knowledge you should use:\n${knowledge}` : ""}

${languageInstruction}

Answer questions based on the above knowledge and rules. If you don't know the answer based on the given knowledge, be honest about it.`
      : `Je bent een behulpzame assistent voor een bedrijf.

${dynamicContext}

${rules ? `## Regels voor hoe je moet reageren:\n${rules}\n\n` : ""}
${knowledge ? `## Kennis die je moet gebruiken:\n${knowledge}` : ""}

${languageInstruction}

Beantwoord vragen op basis van bovenstaande kennis en regels. Als je het antwoord niet weet op basis van de gegeven kennis, geef dat eerlijk aan.`;
  } else {
    systemPrompt += `\n\n${dynamicContext}\n\n${languageInstruction}`;
  }

  // Bouw de berichten array
  const messages: ClaudeMessage[] = [
    ...conversationHistory,
    {
      role: "user",
      content: userMessage,
    },
  ];

    try {
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
        console.error("Claude API error:", response.status, responseText);
        if (response.status === 401) {
          throw new Error(
            "401 Unauthorized: API key ongeldig of afgewezen. Check ANTHROPIC_API_KEY in Convex Dashboard (Settings → Environment variables). Geen spaties, juiste key van console.anthropic.com. Response: " + responseText.slice(0, 150)
          );
        }
        throw new Error(`Claude API error ${response.status}: ${responseText.slice(0, 200)}`);
      }

      const data = JSON.parse(responseText) as ClaudeAPIResponse;
      if (!data.content?.length || !data.content[0].text) {
        console.error("Claude API: lege of onverwachte response", data);
        throw new Error("Claude API gaf geen antwoord terug");
      }
      return data.content[0].text;
    } catch (error) {
      console.error("Error calling Claude API:", error);
      throw error;
    }
  }
