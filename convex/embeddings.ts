/**
 * Embeddings — semantisch zoeken via Voyage AI
 *
 * - embedText: berekent een vector voor een stuk tekst
 * - embedAllKbItems: verwerkt alle Q&A's zonder embedding (batch)
 * - searchKb: vindt meest relevante Q&A's op basis van betekenis
 */
import { v } from "convex/values";
import { action, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const VOYAGE_MODEL = "voyage-multilingual-2";

/** Bereken embedding via Voyage AI */
async function embedText(text: string): Promise<number[]> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) throw new Error("VOYAGE_API_KEY niet ingesteld");

  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: VOYAGE_MODEL,
      input: [text.slice(0, 4000)],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Voyage API fout: ${err}`);
  }

  const data = await res.json() as { data: { embedding: number[] }[] };
  return data.data[0].embedding;
}

/** Haal Q&A's op zonder embedding */
export const getItemsWithoutEmbedding = internalQuery({
  args: { limit: v.number() },
  handler: async (ctx, args): Promise<{ _id: Id<"knowledgeBase">; question: string; answer: string }[]> => {
    const items = await ctx.db.query("knowledgeBase").collect();
    return items
      .filter((i) => i.isActive && !i.embedding)
      .slice(0, args.limit)
      .map((i) => ({ _id: i._id, question: i.question, answer: i.answer }));
  },
});

/** Sla embedding op voor één Q&A */
export const saveEmbedding = internalMutation({
  args: { id: v.id("knowledgeBase"), embedding: v.array(v.float64()) },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { embedding: args.embedding });
  },
});

/** Verwerk alle Q&A's zonder embedding — roep meerdere keren aan tot klaar */
export const embedAllKbItems = action({
  args: { batchSize: v.optional(v.number()) },
  handler: async (ctx, args): Promise<{ done: boolean; verwerkt: number }> => {
    const batch = args.batchSize ?? 20;
    const items = await ctx.runQuery(internal.embeddings.getItemsWithoutEmbedding, {
      limit: batch,
    });

    if (items.length === 0) return { done: true, verwerkt: 0 };

    let verwerkt = 0;
    for (const item of items) {
      const text = `${item.question}\n\n${item.answer}`;
      const embedding = await embedText(text);
      await ctx.runMutation(internal.embeddings.saveEmbedding, {
        id: item._id,
        embedding,
      });
      verwerkt++;
    }

    return { done: items.length < batch, verwerkt };
  },
});

/** Haal één Q&A op (intern) */
export const getKbItem = internalQuery({
  args: { id: v.id("knowledgeBase") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/** Zoek meest relevante Q&A's via vector search */
export const searchKb = action({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<any[]> => {
    const embedding = await embedText(args.query);
    const limit = args.limit ?? 3;

    const results = await ctx.vectorSearch("knowledgeBase", "by_embedding", {
      vector: embedding,
      limit: limit + 5,
      filter: (q) => q.eq("isActive", true),
    });

    // Minimale score: onder 0.47 is de match te zwak om mee te sturen
    const MIN_SCORE = 0.47;
    const relevantResults = results.filter((r) => r._score >= MIN_SCORE).slice(0, limit);

    const items = await Promise.all(
      relevantResults.map(async (r) => {
        const item = await ctx.runQuery(internal.embeddings.getKbItem, { id: r._id });
        return item ? { ...item, score: r._score } : null;
      })
    );

    return items.filter(Boolean);
  },
});

/** Sla embedding op voor een sessie-samenvatting */
export const saveSummaryEmbedding = internalMutation({
  args: { sessionId: v.id("chatSessions"), embedding: v.array(v.float64()) },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, { summaryEmbedding: args.embedding });
  },
});

/** Bereken en sla embedding op voor een sessie-samenvatting (wordt aangeroepen na summarizeSession) */
export const embedSessionSummary = action({
  args: { sessionId: v.id("chatSessions"), summary: v.string() },
  handler: async (ctx, args) => {
    const embedding = await embedText(args.summary);
    await ctx.runMutation(internal.embeddings.saveSummaryEmbedding, {
      sessionId: args.sessionId,
      embedding,
    });
  },
});

/** Zoek semantisch relevante sessie-samenvattingen voor een gebruiker */
export const searchSessionSummaries = action({
  args: {
    query: v.string(),
    userId: v.string(),
    excludeSessionId: v.id("chatSessions"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{ startedAt: number; summary: string; score: number }[]> => {
    const embedding = await embedText(args.query);
    const limit = args.limit ?? 3;

    const results = await ctx.vectorSearch("chatSessions", "by_summary_embedding", {
      vector: embedding,
      limit: limit + 5,
      filter: (q) => q.eq("userId", args.userId),
    });

    const items = await Promise.all(
      results
        .filter((r) => r._id !== args.excludeSessionId)
        .slice(0, limit)
        .map(async (r) => {
          const session = await ctx.runQuery(internal.embeddings.getSession, { id: r._id });
          if (!session?.summary || !session.summarizedAt) return null;
          return { startedAt: session.startedAt, summary: session.summary, score: r._score };
        })
    );

    return items.filter(Boolean) as { startedAt: number; summary: string; score: number }[];
  },
});

/** Haal één sessie op (intern) */
export const getSession = internalQuery({
  args: { id: v.id("chatSessions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/** Embed alle bestaande sessie-samenvattingen die nog geen embedding hebben */
export const embedAllSessionSummaries = action({
  args: { batchSize: v.optional(v.number()) },
  handler: async (ctx, args): Promise<{ done: boolean; verwerkt: number }> => {
    const batch = args.batchSize ?? 10;
    // Haal sessies op zonder embedding maar met samenvatting
    const sessies = await ctx.runQuery(internal.embeddings.getSessionsWithoutEmbedding, { limit: batch });
    if (sessies.length === 0) return { done: true, verwerkt: 0 };

    for (const s of sessies) {
      const embedding = await embedText(s.summary);
      await ctx.runMutation(internal.embeddings.saveSummaryEmbedding, {
        sessionId: s._id,
        embedding,
      });
    }
    return { done: sessies.length < batch, verwerkt: sessies.length };
  },
});

/** Haal sessies op met samenvatting maar zonder embedding (intern) */
export const getSessionsWithoutEmbedding = internalQuery({
  args: { limit: v.number() },
  handler: async (ctx, args): Promise<{ _id: Id<"chatSessions">; summary: string }[]> => {
    const all = await ctx.db.query("chatSessions").collect();
    return all
      .filter((s) => s.summary && s.summarizedAt && !s.summaryEmbedding)
      .slice(0, args.limit)
      .map((s) => ({ _id: s._id, summary: s.summary! }));
  },
});
