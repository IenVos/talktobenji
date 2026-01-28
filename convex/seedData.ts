/**
 * SEED DATA SCRIPT
 *
 * Dit script vult je database met voorbeeld Q&As om snel te kunnen testen.
 * Run dit via de Convex dashboard of als scheduled function.
 *
 * GEBRUIK:
 * 1. Ga naar Convex Dashboard
 * 2. Klik op "Functions"
 * 3. Zoek naar "seedData:seedKnowledgeBase"
 * 4. Klik "Run" om uit te voeren
 */

import { mutation } from "./_generated/server";

/**
 * Seed de knowledge base – TalkToBenji start met een lege knowledge base.
 * Voeg eventueel later Q&As toe via het admin panel (/admin/knowledge).
 */
export const seedKnowledgeBase = mutation({
  handler: async (ctx) => {
    const existing = await ctx.db.query("knowledgeBase").collect();
    return {
      message: "TalkToBenji: knowledge base blijft leeg. Voeg Q&As toe via /admin/knowledge indien gewenst.",
      existingCount: existing.length,
      count: 0,
    };
  },
});

/**
 * Verwijder ALLE data uit de database (gebruik met voorzichtigheid!)
 * Handig voor development/testing
 */
export const clearAllData = mutation({
  handler: async (ctx) => {
    // Verwijder alle Q&As
    const questions = await ctx.db.query("knowledgeBase").collect();
    for (const q of questions) {
      await ctx.db.delete(q._id);
    }

    // Verwijder alle sessies
    const sessions = await ctx.db.query("chatSessions").collect();
    for (const s of sessions) {
      await ctx.db.delete(s._id);
    }

    // Verwijder alle berichten
    const messages = await ctx.db.query("chatMessages").collect();
    for (const m of messages) {
      await ctx.db.delete(m._id);
    }

    // Verwijder alle escalations
    const escalations = await ctx.db.query("escalations").collect();
    for (const e of escalations) {
      await ctx.db.delete(e._id);
    }

    // Verwijder alle feedback
    const feedback = await ctx.db.query("userFeedback").collect();
    for (const f of feedback) {
      await ctx.db.delete(f._id);
    }

    // Verwijder alle analytics
    const analytics = await ctx.db.query("analytics").collect();
    for (const a of analytics) {
      await ctx.db.delete(a._id);
    }

    return {
      message: "Alle data verwijderd",
      deleted: {
        questions: questions.length,
        sessions: sessions.length,
        messages: messages.length,
        escalations: escalations.length,
        feedback: feedback.length,
        analytics: analytics.length,
      },
    };
  },
});

/**
 * Template voor je eigen Q&As
 * Kopieer deze structuur en vul je eigen Q&As in!
 */
export const addYourOwnQAs = mutation({
  handler: async (ctx) => {
    const now = Date.now();

    // VOEG HIER JE EIGEN Q&As TOE
    const myQuestions = [
      // Voorbeeld template:
      {
        question: "Je vraag hier",
        answer: "Je antwoord hier - kan meerdere zinnen zijn!",
        category: "kies: account, features, billing, privacy, of technical",
        tags: ["tag1", "tag2", "tag3"],
        alternativeQuestions: [
          "Andere manier om dezelfde vraag te stellen",
          "Nog een alternatief",
        ],
        priority: 3, // 1-5, waarbij 5 = hoogste prioriteit
      },
      // Voeg meer Q&As toe...
    ];

    const insertedIds = [];
    for (const q of myQuestions) {
      const id = await ctx.db.insert("knowledgeBase", {
        ...q,
        isActive: true,
        usageCount: 0,
        createdBy: "manual_import",
        createdAt: now,
        updatedAt: now,
      });
      insertedIds.push(id);
    }

    return {
      message: `${insertedIds.length} Q&As toegevoegd`,
      ids: insertedIds,
    };
  },
});
