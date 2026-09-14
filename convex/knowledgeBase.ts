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
import { api } from "./_generated/api";
import { checkAdmin } from "./adminAuth";

// ============================================================================
// QUERIES (Data ophalen)
// ============================================================================

/** Snel controleren of er actieve Q&A's zijn (zonder alles op te halen) */
export const hasActiveItems = query({
  args: {},
  handler: async (ctx) => {
    const first = await ctx.db
      .query("knowledgeBase")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .first();
    return first !== null;
  },
});

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
    adminToken: v.string(),
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
    await checkAdmin(ctx, args.adminToken);
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

    // Plan embedding automatisch in na aanmaken
    await ctx.scheduler.runAfter(2000, api.embeddings.embedAllKbItems, { batchSize: 5 });

    return questionId;
  },
});

/**
 * Update een bestaande Q&A
 */
export const updateQuestion = mutation({
  args: {
    adminToken: v.string(),
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
    await checkAdmin(ctx, args.adminToken);
    const { id, adminToken: _token, ...updates } = args;

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

    // Herbereken embedding als vraag of antwoord is gewijzigd
    if (updates.question !== undefined || updates.answer !== undefined) {
      const newQuestion = cleanedUpdates.question ?? existing.question;
      const newAnswer = cleanedUpdates.answer ?? existing.answer;
      await ctx.scheduler.runAfter(2000, api.embeddings.embedAllKbItems, { batchSize: 5 });
    }

    return id;
  },
});

/**
 * Verwijder een Q&A (soft delete - zet isActive op false)
 */
export const deactivateQuestion = mutation({
  args: { adminToken: v.string(), id: v.id("knowledgeBase") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
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
  args: { adminToken: v.string(), id: v.id("knowledgeBase") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
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
  args: { adminToken: v.string(), id: v.id("knowledgeBase") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    await ctx.db.delete(args.id);
    return args.id;
  },
});

/**
 * Bulk import van Q&As
 * Handig om je bestaande Q&As in één keer te importeren
 */
export const bulkImportQuestions = mutation({
  args: {
    adminToken: v.string(),
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
    await checkAdmin(ctx, args.adminToken);
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

