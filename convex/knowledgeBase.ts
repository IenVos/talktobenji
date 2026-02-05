/**
 * KNOWLEDGE BASE FUNCTIES
 *
 * Dit bestand bevat alle functies om Q&A's te beheren in de kennisbank.
 * - Queries = data ophalen (lezen)
 * - Mutations = data wijzigen (toevoegen/updaten/verwijderen)
 * 
 * HOE VUL JE JE KNOWLEDGE BASE?
 * ==============================
 * 
 * Je knowledge base bestaat uit Q&As (Vragen & Antwoorden) die gebruikt worden
 * door de chatbot om specifieke vragen te beantwoorden.
 * 
 * VERSCHIL TUSSEN KNOWLEDGE BASE EN SETTINGS:
 * --------------------------------------------
 * - SETTINGS (settings.ts): Algemene kennis en regels voor ALLE chats
 *   → Bijvoorbeeld: "Ons bedrijf heet TalkToBenji..."
 * 
 * - KNOWLEDGE BASE (dit bestand): Specifieke Q&As voor concrete vragen
 *   → Bijvoorbeeld: "Hoe maak ik een account aan?" → "Ga naar..."
 * 
 * HOE Q&As TOEVOEGEN:
 * ===================
 * 
 * OPTIE 1: Via Admin Dashboard (aanbevolen)
 * - Ga naar /admin in je app
 * - Klik op "Knowledge Base" of "Q&As beheren"
 * - Voeg nieuwe Q&As toe via het formulier
 * 
 * OPTIE 2: Via Code (voor development)
 * ```typescript
 * import { useMutation } from "convex/react";
 * import { api } from "@/convex/_generated/api";
 * 
 * const addQuestion = useMutation(api.knowledgeBase.addQuestion);
 * 
 * await addQuestion({
 *   question: "Hoe maak ik een account aan?",
 *   answer: "Ga naar de registratie pagina en vul je gegevens in...",
 *   category: "Account",
 *   tags: ["account", "registratie", "aanmaken"],
 *   alternativeQuestions: [
 *     "Hoe registreer ik me?",
 *     "Account aanmaken"
 *   ],
 *   priority: 5 // 1-10, hoger = belangrijker
 * });
 * ```
 * 
 * OPTIE 3: Bulk Import (veel Q&As tegelijk)
 * ```typescript
 * const bulkImport = useMutation(api.knowledgeBase.bulkImportQuestions);
 * 
 * await bulkImport({
 *   questions: [
 *     {
 *       question: "Vraag 1",
 *       answer: "Antwoord 1",
 *       category: "Account",
 *       tags: ["tag1", "tag2"]
 *     },
 *     {
 *       question: "Vraag 2",
 *       answer: "Antwoord 2",
 *       category: "Billing",
 *       tags: ["tag3"]
 *     }
 *   ]
 * });
 * ```
 * 
 * OPTIE 4: Via Convex Dashboard
 * - Ga naar https://dashboard.convex.dev
 * - Kies je project → "Functions"
 * - Zoek "knowledgeBase:addQuestion" of "knowledgeBase:bulkImportQuestions"
 * - Klik "Run" en vul de parameters in
 * 
 * BELANGRIJKE VELDEN:
 * -------------------
 * - question: De hoofdvraag (verplicht)
 * - answer: Het antwoord (verplicht)
 * - category: Categorie voor organisatie (bijv. "Account", "Billing")
 * - tags: Zoekwoorden voor betere matching (array)
 * - alternativeQuestions: Andere manieren om dezelfde vraag te stellen
 * - priority: 1-10, hoger = belangrijker bij matching
 * - isActive: true/false, inactive Q&As worden niet gebruikt
 * 
 * HOE WERKT HET MET DE AI?
 * -------------------------
 * Wanneer een gebruiker een vraag stelt:
 * 1. De AI krijgt de knowledge en rules uit settings.ts
 * 2. De AI kan ook relevante Q&As uit de knowledge base gebruiken
 * 3. De AI combineert alles tot een natuurlijk antwoord
 * 
 * Zie ai.ts voor de volledige flow.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================================================
// QUERIES (Data ophalen)
// ============================================================================

/**
 * Haal ALLE Q&As op uit de kennisbank
 * Handig voor admin dashboard en overzichtspagina's
 */
export const getAllQuestions = query({
  // Optionele parameters om te filteren
  args: {
    category: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Fetch all questions and filter in memory
    let questions = await ctx.db.query("knowledgeBase").collect();

    // Filter op categorie als opgegeven
    if (args.category) {
      questions = questions.filter((q) => q.category === args.category);
    }

    // Filter op actieve status
    if (args.isActive !== undefined) {
      questions = questions.filter((q) => q.isActive === args.isActive);
    }

    // Sorteer op updatedAt (nieuwste eerst)
    return questions.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

/**
 * Zoek Q&As op basis van een zoekterm
 * Deze functie zoekt in: vraag, antwoord, tags en alternatieve vragen
 */
export const searchQuestions = query({
  args: {
    searchTerm: v.string(),
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const searchLower = args.searchTerm.toLowerCase().trim();
    const words = searchLower.split(/\s+/).filter(Boolean);
    if (words.length === 0) return [];

    // Haal alle actieve Q&As op
    let query = ctx.db.query("knowledgeBase")
      .withIndex("by_active", (q) => q.eq("isActive", true));

    // Filter op categorie als opgegeven
    if (args.category) {
      query = query.filter((q) => q.eq(q.field("category"), args.category));
    }

    const allQuestions = await query.collect();

    const textOf = (q: typeof allQuestions[0]) => {
      const parts = [
        q.question,
        q.questionEn ?? "",
        q.answer,
        q.answerEn ?? "",
        ...(q.tags ?? []),
        ...(q.alternativeQuestions ?? []),
        ...(q.alternativeQuestionsEn ?? []),
      ];
      return parts.join(" ").toLowerCase();
    };

    // Match: alle woorden moeten ergens in vraag/antwoord/tags voorkomen (voor suggesties)
    const matchingQuestions = allQuestions.filter((q) => {
      const full = textOf(q);
      return words.every((w) => full.includes(w));
    });

    // Sorteer op prioriteit en usage count
    const sorted = matchingQuestions.sort((a, b) => {
      // Eerst op prioriteit
      const priorityDiff = (b.priority || 0) - (a.priority || 0);
      if (priorityDiff !== 0) return priorityDiff;

      // Dan op usage count
      return (b.usageCount || 0) - (a.usageCount || 0);
    });

    // Limiteer resultaten als opgegeven
    return args.limit ? sorted.slice(0, args.limit) : sorted;
  },
});

/**
 * Haal een specifieke Q&A op via ID
 */
export const getQuestionById = query({
  args: { id: v.id("knowledgeBase") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Haal alle categorieën op (uniek)
 * Handig voor dropdown filters
 */
export const getCategories = query({
  handler: async (ctx) => {
    const questions = await ctx.db.query("knowledgeBase").collect();
    const categories = Array.from(new Set(questions.map((q) => q.category)));
    return categories.sort();
  },
});

/**
 * Haal populairste Q&As op (meest gebruikt)
 */
export const getPopularQuestions = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const questions = await ctx.db
      .query("knowledgeBase")
      .withIndex("by_usage")
      .order("desc")
      .collect();

    const limit = args.limit || 10;
    return questions.slice(0, limit);
  },
});

// ============================================================================
// MUTATIONS (Data wijzigen)
// ============================================================================

/**
 * Voeg een nieuwe Q&A toe aan de kennisbank
 * 
 * GEBRUIK:
 * --------
 * ```typescript
 * // Via React component
 * const addQuestion = useMutation(api.knowledgeBase.addQuestion);
 * 
 * await addQuestion({
 *   question: "Hoe maak ik een account aan?",
 *   answer: "Ga naar de registratie pagina op /register en vul je gegevens in.",
 *   category: "Account",
 *   tags: ["account", "registratie", "aanmaken"],
 *   alternativeQuestions: [
 *     "Hoe registreer ik me?",
 *     "Account aanmaken",
 *     "Nieuwe gebruiker worden"
 *   ],
 *   priority: 8 // 1-10, hoger = belangrijker
 * });
 * ```
 * 
 * TIPS:
 * -----
 * - Gebruik alternativeQuestions voor verschillende manieren om dezelfde vraag te stellen
 * - Tags helpen bij het vinden van relevante Q&As
 * - Priority bepaalt welke Q&A wordt gebruikt als er meerdere matches zijn
 * - Category helpt bij organisatie en filtering
 */
export const addQuestion = mutation({
  args: {
    // Nederlandse velden (verplicht)
    question: v.string(),
    answer: v.string(),
    alternativeQuestions: v.optional(v.array(v.string())),
    alternativeAnswers: v.optional(v.array(v.string())),
    // Engelse velden (optioneel)
    questionEn: v.optional(v.string()),
    answerEn: v.optional(v.string()),
    alternativeQuestionsEn: v.optional(v.array(v.string())),
    // Gemeenschappelijke velden
    category: v.string(),
    tags: v.array(v.string()),
    priority: v.optional(v.number()),
    createdBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validatie: vraag en antwoord mogen niet leeg zijn
    if (args.question.trim().length === 0) {
      throw new Error("Vraag mag niet leeg zijn");
    }
    if (args.answer.trim().length === 0) {
      throw new Error("Antwoord mag niet leeg zijn");
    }

    const now = Date.now();

    const questionId = await ctx.db.insert("knowledgeBase", {
      question: args.question.trim(),
      answer: args.answer.trim(),
      alternativeQuestions: args.alternativeQuestions || [],
      alternativeAnswers: args.alternativeAnswers || [],
      questionEn: args.questionEn?.trim() || undefined,
      answerEn: args.answerEn?.trim() || undefined,
      alternativeQuestionsEn: args.alternativeQuestionsEn || undefined,
      category: args.category,
      tags: args.tags,
      priority: args.priority || 1,
      isActive: true,
      usageCount: 0,
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });

    return questionId;
  },
});

/**
 * Update een bestaande Q&A
 */
export const updateQuestion = mutation({
  args: {
    id: v.id("knowledgeBase"),
    // Nederlandse velden
    question: v.optional(v.string()),
    answer: v.optional(v.string()),
    alternativeQuestions: v.optional(v.array(v.string())),
    alternativeAnswers: v.optional(v.array(v.string())),
    // Engelse velden
    questionEn: v.optional(v.string()),
    answerEn: v.optional(v.string()),
    alternativeQuestionsEn: v.optional(v.array(v.string())),
    // Gemeenschappelijke velden
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    priority: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // Check of de Q&A bestaat
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Q&A niet gevonden");
    }

    // Trim string velden als ze worden geüpdatet
    const cleanedUpdates: any = { ...updates };
    if (updates.question !== undefined) cleanedUpdates.question = updates.question.trim();
    if (updates.answer !== undefined) cleanedUpdates.answer = updates.answer.trim();
    if (updates.questionEn !== undefined) cleanedUpdates.questionEn = updates.questionEn.trim() || undefined;
    if (updates.answerEn !== undefined) cleanedUpdates.answerEn = updates.answerEn.trim() || undefined;
    cleanedUpdates.updatedAt = Date.now();

    // Update met nieuwe waarden
    await ctx.db.patch(id, cleanedUpdates);

    return id;
  },
});

/**
 * Verwijder een Q&A (soft delete - zet isActive op false)
 */
export const deactivateQuestion = mutation({
  args: { id: v.id("knowledgeBase") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      isActive: false,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

/**
 * Activeer een Q&A weer
 */
export const activateQuestion = mutation({
  args: { id: v.id("knowledgeBase") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      isActive: true,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

/**
 * Verwijder een Q&A permanent (gebruik met voorzichtigheid!)
 */
export const deleteQuestion = mutation({
  args: { id: v.id("knowledgeBase") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});

/**
 * Verhoog de usage count van een Q&A
 * Wordt aangeroepen telkens als deze Q&A gebruikt wordt voor een antwoord
 */
export const incrementUsageCount = mutation({
  args: { id: v.id("knowledgeBase") },
  handler: async (ctx, args) => {
    const question = await ctx.db.get(args.id);
    if (!question) {
      throw new Error("Q&A niet gevonden");
    }

    await ctx.db.patch(args.id, {
      usageCount: (question.usageCount || 0) + 1,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update de gemiddelde rating van een Q&A
 */
export const updateAverageRating = mutation({
  args: {
    id: v.id("knowledgeBase"),
    newRating: v.number(),
  },
  handler: async (ctx, args) => {
    const question = await ctx.db.get(args.id);
    if (!question) {
      throw new Error("Q&A niet gevonden");
    }

    // Bereken nieuw gemiddelde
    // (dit is een simpele implementatie - voor productie zou je alle ratings willen opslaan)
    const currentAvg = question.averageRating || 0;
    const usageCount = question.usageCount || 1;
    const newAvg = (currentAvg * usageCount + args.newRating) / (usageCount + 1);

    await ctx.db.patch(args.id, {
      averageRating: newAvg,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Bulk import van Q&As
 * Handig om je bestaande Q&As in één keer te importeren
 */
export const bulkImportQuestions = mutation({
  args: {
    questions: v.array(
      v.object({
        // Nederlandse velden (verplicht)
        question: v.string(),
        answer: v.string(),
        alternativeQuestions: v.optional(v.array(v.string())),
        alternativeAnswers: v.optional(v.array(v.string())),
        // Engelse velden (optioneel)
        questionEn: v.optional(v.string()),
        answerEn: v.optional(v.string()),
        alternativeQuestionsEn: v.optional(v.array(v.string())),
        // Gemeenschappelijke velden
        category: v.string(),
        tags: v.array(v.string()),
        priority: v.optional(v.number()),
      })
    ),
    createdBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const ids = [];

    for (const q of args.questions) {
      const id = await ctx.db.insert("knowledgeBase", {
        question: q.question.trim(),
        answer: q.answer.trim(),
        alternativeQuestions: q.alternativeQuestions || [],
        alternativeAnswers: q.alternativeAnswers || [],
        questionEn: q.questionEn?.trim() || undefined,
        answerEn: q.answerEn?.trim() || undefined,
        alternativeQuestionsEn: q.alternativeQuestionsEn || undefined,
        category: q.category,
        tags: q.tags,
        priority: q.priority || 1,
        isActive: true,
        usageCount: 0,
        createdBy: args.createdBy,
        createdAt: now,
        updatedAt: now,
      });
      ids.push(id);
    }

    return {
      count: ids.length,
      ids,
    };
  },
});

/**
 * HELPER FUNCTIE: Vind de beste match voor een gebruikersvraag
 * Dit is een simpele versie - later kun je dit uitbreiden met AI
 */
export const findBestMatch = query({
  args: {
    userQuestion: v.string(),
    threshold: v.optional(v.number()), // Minimum similarity score (0-1)
  },
  handler: async (ctx, args) => {
    const allQuestions = await ctx.db
      .query("knowledgeBase")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    const userQuestionLower = args.userQuestion.toLowerCase();
    const threshold = args.threshold || 0.3;

    // Simpele keyword matching (voor nu)
    // Later kun je dit vervangen door embeddings of AI
    const scored = allQuestions.map((q) => {
      let score = 0;

      // Check overlap met hoofdvraag
      if (q.question.toLowerCase().includes(userQuestionLower)) score += 1.0;
      if (userQuestionLower.includes(q.question.toLowerCase())) score += 0.8;

      // Check alternatieve vragen
      if (q.alternativeQuestions) {
        for (const alt of q.alternativeQuestions) {
          if (alt.toLowerCase().includes(userQuestionLower)) score += 0.9;
          if (userQuestionLower.includes(alt.toLowerCase())) score += 0.7;
        }
      }

      // Check tags
      for (const tag of q.tags) {
        if (userQuestionLower.includes(tag.toLowerCase())) score += 0.5;
      }

      return { ...q, matchScore: score };
    });

    // Filter op threshold en sorteer
    const filtered = scored
      .filter((q) => q.matchScore >= threshold)
      .sort((a, b) => {
        // Eerst op match score
        if (b.matchScore !== a.matchScore) {
          return b.matchScore - a.matchScore;
        }
        // Dan op prioriteit
        if ((b.priority || 0) !== (a.priority || 0)) {
          return (b.priority || 0) - (a.priority || 0);
        }
        // Dan op populariteit
        return (b.usageCount || 0) - (a.usageCount || 0);
      });

    return filtered.length > 0 ? filtered[0] : null;
  },
});
