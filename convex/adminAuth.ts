/**
 * Admin sessie beheer + checkAdmin helper.
 * Wordt gebruikt door alle admin-functies voor server-side autorisatie.
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Controleer of een admin token geldig is.
 * Importeer deze functie in andere Convex-bestanden en roep aan
 * als eerste regel in elke admin handler.
 */
export async function checkAdmin(ctx: any, adminToken: string) {
  if (!adminToken) throw new Error("Geen admin token");
  const session = await ctx.db
    .query("adminSessions")
    .withIndex("by_token", (q: any) => q.eq("token", adminToken))
    .first();
  if (!session) throw new Error("Ongeldige admin sessie");
  if (session.expiresAt < Date.now()) {
    // Niet hier verwijderen — checkAdmin wordt ook vanuit queries aangeroepen
    // en queries zijn read-only in Convex. Cleanup gebeurt in createSession.
    throw new Error("Admin sessie verlopen");
  }
}

/**
 * Query versie van checkAdmin - voor gebruik in actions via ctx.runQuery.
 * Actions hebben geen ctx.db, dus ze moeten via een query valideren.
 */
export const validateToken = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    if (!args.adminToken) throw new Error("Geen admin token");
    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_token", (q: any) => q.eq("token", args.adminToken))
      .first();
    if (!session) throw new Error("Ongeldige admin sessie");
    if (session.expiresAt < Date.now()) {
      throw new Error("Admin sessie verlopen");
    }
    return true;
  },
});

/** Maak een admin sessie aan (aangeroepen door login API route) */
export const createSession = mutation({
  args: {
    token: v.string(),
    expiresAt: v.number(),
    secret: v.string(),
  },
  handler: async (ctx, args) => {
    const expected = process.env.ADMIN_SESSION_SECRET;
    if (!expected || args.secret !== expected) {
      throw new Error("Niet geautoriseerd");
    }
    // Verwijder verlopen sessies
    const all = await ctx.db.query("adminSessions").collect();
    for (const s of all) {
      if (s.expiresAt < Date.now()) await ctx.db.delete(s._id);
    }
    return await ctx.db.insert("adminSessions", {
      token: args.token,
      expiresAt: args.expiresAt,
    });
  },
});

/** Verwijder een admin sessie (aangeroepen door logout API route) */
export const deleteSession = mutation({
  args: {
    token: v.string(),
    secret: v.string(),
  },
  handler: async (ctx, args) => {
    const expected = process.env.ADMIN_SESSION_SECRET;
    if (!expected || args.secret !== expected) {
      throw new Error("Niet geautoriseerd");
    }
    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    if (session) await ctx.db.delete(session._id);
  },
});
