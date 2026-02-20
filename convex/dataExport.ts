import { v } from "convex/values";
import { query } from "./_generated/server";

function checkSecret(secret: string) {
  const envSecret = process.env.CONVEX_AUTH_ADAPTER_SECRET;
  if (!envSecret?.trim()) throw new Error("Missing CONVEX_AUTH_ADAPTER_SECRET");
  const normalize = (s: string) => s.replace(/\s+/g, "").trim();
  if (normalize(secret) !== normalize(envSecret)) {
    throw new Error("Credentials API called without correct secret value");
  }
}

export const getUserExportData = query({
  args: { secret: v.string(), userId: v.string() },
  handler: async (ctx, args) => {
    checkSecret(args.secret);

    const [sessions, notes, checkIns, goals, memories, emotionEntries] = await Promise.all([
      ctx.db.query("chatSessions").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect(),
      ctx.db.query("notes").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect(),
      ctx.db.query("checkInEntries").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect(),
      ctx.db.query("goals").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect(),
      ctx.db.query("memories").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect(),
      ctx.db.query("emotionEntries").withIndex("by_user_date", (q) => q.eq("userId", args.userId)).collect(),
    ]);

    // Haal berichten op per gesprek
    const sessionsWithMessages = await Promise.all(
      sessions.map(async (session) => {
        const messages = await ctx.db
          .query("chatMessages")
          .withIndex("by_session", (q) => q.eq("sessionId", session._id))
          .collect();
        return {
          id: session._id,
          startedAt: new Date(session.startedAt).toISOString(),
          topic: session.topic ?? null,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
            createdAt: new Date(m.createdAt).toISOString(),
          })),
        };
      })
    );

    return {
      exportedAt: new Date().toISOString(),
      gesprekken: sessionsWithMessages,
      notities: notes.map((n) => ({
        title: n.title ?? null,
        content: n.content,
        createdAt: new Date(n.createdAt).toISOString(),
      })),
      checkIns: checkIns.map((c) => ({
        hoe_voel: c.hoe_voel,
        wat_hielp: c.wat_hielp,
        waar_dankbaar: c.waar_dankbaar,
        createdAt: new Date(c.createdAt).toISOString(),
      })),
      doelen: goals.map((g) => ({
        content: g.content,
        completed: g.completed,
        createdAt: new Date(g.createdAt).toISOString(),
      })),
      herinneringen: memories.map((m) => ({
        text: m.text,
        emotion: m.emotion ?? null,
        memoryDate: m.memoryDate ?? null,
        createdAt: new Date(m.createdAt).toISOString(),
      })),
      stemming: emotionEntries.map((e) => ({
        date: e.date,
        mood: e.mood,
        note: e.note ?? null,
      })),
    };
  },
});
