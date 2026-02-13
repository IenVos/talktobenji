/**
 * Notities / dagboek – per gebruiker.
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

async function requireAuth(ctx: any, userId: string) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Niet ingelogd");
  if (identity.subject !== userId) throw new Error("Geen toegang");
}

export const listNotes = query({
  args: { userId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.userId);
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit ?? 50);
    return notes;
  },
});

export const getNote = query({
  args: { noteId: v.id("notes") },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.noteId);
    if (!note) return null;
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || identity.subject !== note.userId) return null;
    return note;
  },
});

export const createNote = mutation({
  args: {
    userId: v.string(),
    title: v.optional(v.string()),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.userId);
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
    await requireAuth(ctx, args.userId);
    const note = await ctx.db.get(args.noteId);
    if (!note || note.userId !== args.userId) {
      throw new Error("Notitie niet gevonden of geen toegang");
    }
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
    await requireAuth(ctx, args.userId);
    const note = await ctx.db.get(args.noteId);
    if (!note || note.userId !== args.userId) {
      throw new Error("Notitie niet gevonden of geen toegang");
    }
    await ctx.db.delete(args.noteId);
    return args.noteId;
  },
});
