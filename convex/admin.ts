/**
 * ADMIN FUNCTIES
 *
 * Dit bestand bevat alle functies voor admin/support medewerkers:
 * - Escalations beheren
 * - Analytics bekijken
 * - Feedback modereren
 * - Dashboard statistieken
 */

import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { checkAdmin, logAdminAction } from "./adminAuth";
import { api, internal } from "./_generated/api";

// ============================================================================
// CHAT HISTORY QUERIES (voor admin overzicht)
// ============================================================================

/**
 * Haal alle chat-sessies op voor admin (nieuwste eerst)
 */
export const listChatHistory = query({
  args: {
    adminToken: v.string(),
    limit: v.optional(v.number()),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("resolved"),
        v.literal("escalated"),
        v.literal("abandoned"),
        v.literal("reviewed")
      )
    ),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const allSessions = await ctx.db.query("chatSessions").collect();
    let sessions = allSessions.filter(
      (s) => typeof s.lastActivityAt === "number"
    );

    if (args.status) {
      sessions = sessions.filter((s) => s.status === args.status);
    }

    const sorted = [...sessions].sort(
      (a, b) => (b.lastActivityAt ?? 0) - (a.lastActivityAt ?? 0)
    );

    const limit = Math.min(args.limit ?? 100, 200);

    // Verberg "alleen geopend"-gesprekken: als de bezoeker nooit iets typte
    // (0 gebruikersberichten) valt er niets te beoordelen en kan er ook geen
    // rapport komen, dus dat is ruis in de inbox. We tellen lazy door tot we
    // `limit` echte gesprekken hebben (niet alle berichten van alle sessies).
    const result: any[] = [];
    for (const s of sorted) {
      if (result.length >= limit) break;
      const msgs = await ctx.db
        .query("chatMessages")
        .withIndex("by_session", (q) => q.eq("sessionId", s._id))
        .collect();
      const userMessageCount = msgs.filter((m) => m.role === "user").length;
      if (userMessageCount === 0) continue; // alleen geopend, niets gezegd
      result.push({ ...s, messageCount: msgs.length, userMessageCount });
    }
    return result;
  },
});

/**
 * Haal sessie + berichten op voor admin detailweergave
 */
// getChatHistoryDetail verwijderd (3 aug 2026, privacy). Gaf de volledige ruwe
// gesprekstekst van een sessie terug aan de admin. Werd nergens meer aangeroepen.
// De admin ziet alleen nog de AI-kwaliteitsrapporten, niet de letterlijke berichten.

// ============================================================================
// FEEDBACK QUERIES & MUTATIONS
// ============================================================================

/**
 * Haal alle feedback op
 */
export const getAllFeedback = query({
  args: {
    adminToken: v.string(),
    feedbackType: v.optional(
      v.union(
        v.literal("bug"),
        v.literal("suggestion"),
        v.literal("compliment"),
        v.literal("complaint"),
        v.literal("feature_request")
      )
    ),
    status: v.optional(
      v.union(
        v.literal("new"),
        v.literal("reviewed"),
        v.literal("implemented"),
        v.literal("declined")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    // Fetch all feedback and filter in memory
    let feedback = await ctx.db.query("userFeedback").collect();

    // Filter op type
    if (args.feedbackType) {
      feedback = feedback.filter((f) => f.feedbackType === args.feedbackType);
    }

    // Filter op status
    if (args.status) {
      feedback = feedback.filter((f) => f.status === args.status);
    }

    // Sorteer op createdAt (nieuwste eerst)
    const sorted = feedback.sort((a, b) => b.createdAt - a.createdAt);

    // Limiteer als opgegeven
    const limited = args.limit ? sorted.slice(0, args.limit) : sorted;

    // Voeg image URLs toe
    return Promise.all(
      limited.map(async (f) => ({
        ...f,
        imageUrl: f.imageStorageId
          ? await ctx.storage.getUrl(f.imageStorageId)
          : undefined,
      }))
    );
  },
});

/**
 * Update feedback status
 */
export const updateFeedbackStatus = mutation({
  args: {
    adminToken: v.string(),
    feedbackId: v.id("userFeedback"),
    status: v.union(
      v.literal("new"),
      v.literal("reviewed"),
      v.literal("implemented"),
      v.literal("declined")
    ),
    adminResponse: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const updates: any = {
      status: args.status,
    };

    if (args.adminResponse) {
      updates.adminResponse = args.adminResponse;
    }

    await ctx.db.patch(args.feedbackId, updates);

    return args.feedbackId;
  },
});

/**
 * Verwijder feedback volledig
 */
export const deleteFeedback = mutation({
  args: { adminToken: v.string(), feedbackId: v.id("userFeedback") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) return;
    if (feedback.imageStorageId) {
      try { await ctx.storage.delete(feedback.imageStorageId); } catch {}
    }
    await ctx.db.delete(args.feedbackId);
    await logAdminAction(ctx, `Feedback verwijderd: ${args.feedbackId}`);
  },
});

/**
 * Verwijder alleen de afbeelding van feedback (tekst blijft behouden)
 */
export const deleteFeedbackImage = mutation({
  args: { adminToken: v.string(), feedbackId: v.id("userFeedback") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback?.imageStorageId) return;
    try { await ctx.storage.delete(feedback.imageStorageId); } catch {}
    await ctx.db.patch(args.feedbackId, { imageStorageId: undefined });
  },
});

// ============================================================================
// CHAT BERICHTEN VERWIJDEREN
// ============================================================================

/** Verwijder een hele chat sessie met al zijn berichten */
export const deleteChatSession = mutation({
  args: {
    adminToken: v.string(),
    sessionId: v.id("chatSessions"),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();
    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }
    await ctx.db.delete(args.sessionId);
    await logAdminAction(ctx, `Chat sessie verwijderd: ${args.sessionId} (${messages.length} berichten)`);
  },
});

// exportAllData verwijderd (3 aug 2026, privacy). Was een bulk-export van ALLE
// klanten hun ruwe gesprekken/berichten voor de admin, en werd nergens gebruikt.
// De klant kan zijn EIGEN data (incl. eigen gesprekken) downloaden via
// dataExport.getUserExportData; dat blijft, dat is zijn recht.

/**
 * Voeg een toevoeging toe aan de bestaande rules in botSettings.
 */
export const appendToRules = mutation({
  args: { adminToken: v.string(), addition: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const settings = await ctx.db.query("botSettings").first();
    const current = settings?.rules ?? "";
    const updated = current.trimEnd() + "\n\n" + args.addition.trim();
    if (settings) {
      await ctx.db.patch(settings._id, { rules: updated, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("botSettings", { rules: updated, knowledge: "", updatedAt: Date.now() });
    }
  },
});

/**
 * Voeg een nieuwe knowledge base entry toe vanuit de admin feedback flow.
 */
export const addKnowledgeEntryFromAdmin = mutation({
  args: {
    adminToken: v.string(),
    question: v.string(),
    answer: v.string(),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    return await ctx.db.insert("knowledgeBase", {
      question: args.question,
      answer: args.answer,
      category: args.category,
      tags: [],
      isActive: true,
      usageCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Haal alle onbeantwoorde vragen op, gegroepeerd en gesorteerd op frequentie.
 */
export const getUnansweredQuestions = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const all = await ctx.db.query("unansweredQuestions").order("desc").collect();
    const map: Record<string, { question: string; count: number; lastAt: number; ids: string[] }> = {};
    for (const u of all) {
      const key = u.userQuestion.trim().toLowerCase().slice(0, 150);
      if (!key) continue;
      if (!map[key]) map[key] = { question: u.userQuestion.trim(), count: 0, lastAt: u.createdAt, ids: [] };
      map[key].count += 1;
      map[key].lastAt = Math.max(map[key].lastAt, u.createdAt);
      map[key].ids.push(u._id);
    }
    return Object.values(map).sort((a, b) => b.count - a.count);
  },
});

/**
 * Verwijder alle onbeantwoorde-vraag-entries voor een specifieke vraagsleutel (dismiss).
 */
export const dismissUnansweredQuestion = mutation({
  args: { adminToken: v.string(), ids: v.array(v.id("unansweredQuestions")) },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    for (const id of args.ids) {
      await ctx.db.delete(id);
    }
  },
});

/** Genereer een trainingsuggestie op basis van een kwaliteitsrapport (admin only). */
export const suggestFixFromRapport = action({
  args: { adminToken: v.string(), rapport: v.string() },
  handler: async (ctx, args) => {
    await ctx.runQuery(api.adminAuth.validateToken, { adminToken: args.adminToken });

    const prompt = `Je bent een kwaliteitscontroleur voor Benji, een empathische rouw-chatbot.
Hieronder staat een kwaliteitsrapport over een gesprek. Het rapport bevat al een "Actie" punt.
Vertaal die Actie naar een concrete verbetering voor Benji.

RAPPORT:
${args.rapport}

Kies één van twee opties:
- "rules": als het een gedragsregel is (toon, aanpak, wanneer iets te doen/laten, crisisprotocol)
- "knowledge": als Benji specifieke inhoudelijke kennis mist over een onderwerp

Antwoord ALLEEN in dit JSON formaat, geen tekst erbuiten:
{
  "probleem": "één zin wat er fout ging",
  "type": "rules" of "knowledge",
  "reden": "één zin waarom deze keuze",
  "toevoeging": "de concrete tekst die toegevoegd moet worden aan de rules (bullet point stijl; bij knowledge leeg laten)",
  "knowledge_question": "bij knowledge: de vraag in de knowledge base (bij rules leeg laten)",
  "knowledge_answer": "bij knowledge: het antwoord voor Benji (bij rules leeg laten)",
  "knowledge_category": "bij knowledge: de categorie bijv. Rouw en verlies (bij rules leeg laten)"
}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 600,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json() as { content?: { type: string; text: string }[] };
    const text = data.content?.[0]?.text ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        return { probleem: "Kon niet analyseren", type: "rules", reden: "", toevoeging: text, knowledge_question: "", knowledge_answer: "", knowledge_category: "" };
      }
    }
    return { probleem: "Geen analyse beschikbaar", type: "rules", reden: "", toevoeging: "", knowledge_question: "", knowledge_answer: "", knowledge_category: "" };
  },
});

/** Heranalyse: plan rapporten in voor alle sessies zonder adminRapport (admin only). */
export const retriggerRapporten = mutation({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);

    const allSessions = await ctx.db.query("chatSessions").collect();
    const pending = allSessions.filter(
      (s) => !s.adminRapport && s.status !== "active"
    );

    // Sla lege/alleen-geopend gesprekken over: analyzeSessionAdmin heeft minstens
    // 2 berichten nodig, dus retriggeren zou daar eeuwig falen (whack-a-mole met
    // de "zonder rapport"-teller). Alleen echte gesprekken opnieuw inplannen.
    let ingepland = 0;
    for (const session of pending) {
      const msgs = await ctx.db
        .query("chatMessages")
        .withIndex("by_session", (q) => q.eq("sessionId", session._id))
        .collect();
      if (msgs.length < 2) continue;
      await ctx.scheduler.runAfter(0, internal.ai.analyzeSessionAdmin, {
        sessionId: session._id,
      });
      ingepland++;
    }

    return ingepland;
  },
});

/**
 * Zet de status van een sessie handmatig (door admin na beoordeling).
 */
/** Eenmalige migratie: verplaats alle bestaande 'abandoned' sessies naar 'reviewed' */
export const migreerAbandonedNaarReviewed = mutation({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const sessions = await ctx.db.query("chatSessions").collect();
    const abandoned = sessions.filter((s: any) => s.status === "abandoned" && s.reviewedAt);
    for (const s of abandoned) {
      await ctx.db.patch(s._id, { status: "reviewed" });
    }
    return { gemigreerd: abandoned.length };
  },
});

export const setSessionStatus = mutation({
  args: {
    adminToken: v.string(),
    sessionId: v.id("chatSessions"),
    status: v.union(
      v.literal("resolved"),
      v.literal("escalated"),
      v.literal("abandoned"),
      v.literal("reviewed")
    ),
    clearReviewed: v.optional(v.boolean()), // Zet terug naar inbox (Alle)
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    if (args.clearReviewed) {
      await ctx.db.patch(args.sessionId, {
        status: args.status,
        reviewedAt: undefined,
      });
    } else {
      await ctx.db.patch(args.sessionId, {
        status: args.status,
        reviewedAt: Date.now(),
      });
    }
  },
});
