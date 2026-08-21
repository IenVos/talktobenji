/**
 * Beheerbare URL-redirects (301/302), instelbaar via de admin.
 * Uitvoering gebeurt in middleware.ts (cachet listActive kort).
 */
import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { checkAdmin } from "./adminAuth";

/** Tijdelijk: test-redirect zetten/opruimen om de middleware te verifiëren. */
export const _seedTestRedirect = internalMutation({
  args: { on: v.boolean() },
  handler: async (ctx, args) => {
    const from = "/zz-redirect-test-987";
    const existing = await ctx.db.query("redirects").withIndex("by_from", (q) => q.eq("from", from)).first();
    if (!args.on) { if (existing) await ctx.db.delete(existing._id); return { removed: !!existing }; }
    const now = Date.now();
    if (existing) { await ctx.db.patch(existing._id, { active: true, updatedAt: now }); return { updated: true }; }
    await ctx.db.insert("redirects", { from, to: "/waarom-benji", permanent: true, active: true, hits: 0, note: "tijdelijke test", createdAt: now, updatedAt: now });
    return { inserted: true };
  },
});

/** Normaliseer een pad: leidende slash, geen trailing slash (behalve root), lowercase host-onafhankelijk. */
function normalizePath(input: string): string {
  let p = (input || "").trim();
  if (!p) return "/";
  // Volledige URL? Alleen het pad-gedeelte normaliseren kan niet betrouwbaar, dus laat http(s) links met rust als 'to'.
  if (/^https?:\/\//i.test(p)) return p;
  if (!p.startsWith("/")) p = "/" + p;
  // strip query/hash uit de 'from' (matchen op pad)
  p = p.split("#")[0].split("?")[0];
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p;
}

/** Admin: alle redirects (nieuwste eerst). */
export const listAll = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const rows = await ctx.db.query("redirects").collect();
    return rows.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

/** Publiek: actieve redirects, lichte payload voor de middleware. */
export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("redirects").collect();
    return rows
      .filter((r) => r.active)
      .map((r) => ({ from: r.from, to: r.to, permanent: r.permanent }));
  },
});

/** Admin: aanmaken of bijwerken. Matcht op genormaliseerd 'from' (uniek). */
export const upsert = mutation({
  args: {
    adminToken: v.string(),
    id: v.optional(v.id("redirects")),
    from: v.string(),
    to: v.string(),
    permanent: v.boolean(),
    active: v.boolean(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const from = normalizePath(args.from);
    const to = args.to.trim();
    if (!from || from === "/") throw new Error("Ongeldig 'van'-pad.");
    if (!to) throw new Error("'Naar' mag niet leeg zijn.");
    if (from === normalizePath(to)) throw new Error("'Van' en 'naar' mogen niet gelijk zijn.");

    const now = Date.now();
    const fields = { from, to, permanent: args.permanent, active: args.active, note: args.note?.trim() || undefined, updatedAt: now };

    if (args.id) {
      await ctx.db.patch(args.id, fields);
      return args.id;
    }
    // Bestaat er al een regel voor dit pad? Dan bijwerken i.p.v. dubbel.
    const existing = await ctx.db.query("redirects").withIndex("by_from", (q) => q.eq("from", from)).first();
    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return existing._id;
    }
    return ctx.db.insert("redirects", { ...fields, hits: 0, createdAt: now });
  },
});

/** Admin: verwijderen. */
export const remove = mutation({
  args: { adminToken: v.string(), id: v.id("redirects") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    await ctx.db.delete(args.id);
  },
});

/** Admin: aan/uit zetten. */
export const toggle = mutation({
  args: { adminToken: v.string(), id: v.id("redirects"), active: v.boolean() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    await ctx.db.patch(args.id, { active: args.active, updatedAt: Date.now() });
  },
});
