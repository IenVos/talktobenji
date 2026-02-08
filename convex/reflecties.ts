/**
 * Mijn reflecties: notities, emotie-tracker, doelen, check-in.
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ============ Notities ============
export const listNotes = query({
  args: { userId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const createNote = mutation({
  args: { userId: v.string(), title: v.optional(v.string()), content: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("notes", {
      userId: args.userId,
      title: args.title ?? undefined,
      content: args.content,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateNote = mutation({
  args: {
    noteId: v.id("notes"),
    userId: v.string(),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.noteId);
    if (!note || note.userId !== args.userId) throw new Error("Notitie niet gevonden");
    const now = Date.now();
    const updates: Record<string, unknown> = { updatedAt: now };
    if (args.title !== undefined) updates.title = args.title;
    if (args.content !== undefined) updates.content = args.content;
    await ctx.db.patch(args.noteId, updates);
    return args.noteId;
  },
});

export const deleteNote = mutation({
  args: { noteId: v.id("notes"), userId: v.string() },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.noteId);
    if (!note || note.userId !== args.userId) throw new Error("Notitie niet gevonden");
    await ctx.db.delete(args.noteId);
    return args.noteId;
  },
});

// ============ Emotie-tracker ============
export const getEmotionForDate = query({
  args: { userId: v.string(), date: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("emotionEntries")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .unique();
  },
});

/** Lijst van eerdere emotie-entries – per datum, nieuwste eerst */
export const listEmotionHistory = query({
  args: { userId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("emotionEntries")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
      .collect();
    const sorted = all.sort((a, b) => (a.date > b.date ? -1 : 1));
    const limit = args.limit ?? 30;
    return sorted.slice(0, limit).map((e) => ({
      date: e.date,
      mood: e.mood,
      note: e.note,
    }));
  },
});

export const setEmotion = mutation({
  args: {
    userId: v.string(),
    date: v.string(),
    mood: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("emotionEntries")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        mood: args.mood,
        note: args.note,
      });
      return existing._id;
    }
    return await ctx.db.insert("emotionEntries", {
      userId: args.userId,
      date: args.date,
      mood: args.mood,
      note: args.note,
      createdAt: now,
    });
  },
});

// ============ Doelen ============
export const listGoals = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("goals")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const createGoal = mutation({
  args: { userId: v.string(), content: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("goals", {
      userId: args.userId,
      content: args.content.trim(),
      completed: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const toggleGoal = mutation({
  args: { goalId: v.id("goals"), userId: v.string() },
  handler: async (ctx, args) => {
    const goal = await ctx.db.get(args.goalId);
    if (!goal || goal.userId !== args.userId) throw new Error("Doel niet gevonden");
    await ctx.db.patch(args.goalId, {
      completed: !goal.completed,
      updatedAt: Date.now(),
    });
    return args.goalId;
  },
});

export const deleteGoal = mutation({
  args: { goalId: v.id("goals"), userId: v.string() },
  handler: async (ctx, args) => {
    const goal = await ctx.db.get(args.goalId);
    if (!goal || goal.userId !== args.userId) throw new Error("Doel niet gevonden");
    await ctx.db.delete(args.goalId);
    return args.goalId;
  },
});

// ============ Dagelijkse check-in ============
const CHECK_IN_QUESTIONS = [
  { key: "hoe_voel" as const, label: "Hoe voel ik me vandaag?" },
  { key: "wat_hielp" as const, label: "Wat hielp me vandaag?" },
  { key: "waar_dankbaar" as const, label: "Waar ben ik dankbaar voor?" },
] as const;

export const getCheckInForDate = query({
  args: { userId: v.string(), date: v.string() },
  handler: async (ctx, args) => {
    const answers = await ctx.db
      .query("checkInAnswers")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .collect();
    const map: Record<string, string> = {};
    answers.forEach((a) => { map[a.questionKey] = a.answer; });
    return { answers: map, questions: CHECK_IN_QUESTIONS };
  },
});

/** Lijst van eerdere check-ins – per datum, nieuwste eerst */
export const listCheckInHistory = query({
  args: { userId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("checkInAnswers")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
      .collect();
    const byDate = new Map<string, Record<string, string>>();
    for (const a of all) {
      if (!byDate.has(a.date)) byDate.set(a.date, {});
      byDate.get(a.date)![a.questionKey] = a.answer;
    }
    const dates = Array.from(byDate.keys()).sort().reverse();
    const limit = args.limit ?? 30;
    return dates.slice(0, limit).map((date) => ({
      date,
      answers: byDate.get(date)!,
    }));
  },
});

export const setCheckInAnswer = mutation({
  args: {
    userId: v.string(),
    date: v.string(),
    questionKey: v.union(
      v.literal("hoe_voel"),
      v.literal("wat_hielp"),
      v.literal("waar_dankbaar")
    ),
    answer: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const all = await ctx.db
      .query("checkInAnswers")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .collect();
    const existing = all.find((a) => a.questionKey === args.questionKey);
    if (existing) {
      await ctx.db.patch(existing._id, { answer: args.answer.trim() });
      return existing._id;
    }
    return await ctx.db.insert("checkInAnswers", {
      userId: args.userId,
      date: args.date,
      questionKey: args.questionKey,
      answer: args.answer.trim(),
      createdAt: now,
    });
  },
});
