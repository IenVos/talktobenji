/**
 * Homepage FAQ — beheerbaar via admin, getoond op de homepagina
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { checkAdmin } from "./adminAuth";

/** Haal alle FAQ-items op (admin). */
export const list = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    return ctx.db.query("homepageFaq").withIndex("by_volgorde").collect();
  },
});

/** Haal actieve FAQ-items op (publiek, voor de homepagina). */
export const listActief = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("homepageFaq").withIndex("by_volgorde").collect();
    return items.filter((i) => i.isActief);
  },
});

/** Maak een nieuw FAQ-item aan. */
export const create = mutation({
  args: {
    adminToken: v.string(),
    vraag: v.string(),
    antwoord: v.string(),
    linkTekst: v.optional(v.string()),
    linkHref: v.optional(v.string()),
    volgorde: v.number(),
    isActief: v.boolean(),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const { adminToken, ...data } = args;
    return ctx.db.insert("homepageFaq", data);
  },
});

/** Pas een FAQ-item aan. */
export const update = mutation({
  args: {
    adminToken: v.string(),
    id: v.id("homepageFaq"),
    vraag: v.optional(v.string()),
    antwoord: v.optional(v.string()),
    linkTekst: v.optional(v.string()),
    linkHref: v.optional(v.string()),
    volgorde: v.optional(v.number()),
    isActief: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const { adminToken, id, ...fields } = args;
    const patch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(fields)) {
      if (v !== undefined) patch[k] = v;
    }
    await ctx.db.patch(id, patch);
  },
});

/** Verwijder een FAQ-item. */
export const remove = mutation({
  args: { adminToken: v.string(), id: v.id("homepageFaq") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    await ctx.db.delete(args.id);
  },
});
