/**
 * E-mail templates voor trial reminders — bewerkbaar via admin panel.
 * Ook: Niet Alleen dag-overrides (bewerkbare versies van de 30 dagelijkse mails).
 */
import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";
import { checkAdmin } from "./adminAuth";
export { DEFAULT_TEMPLATES, type TemplateKey } from "./emailTemplatesDefaults";

/** Intern opvragen (gebruikt in emails.ts) */
export const getTemplateInternal = internalQuery({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("emailTemplates")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
  },
});

/** Alle templates ophalen (admin panel) */
export const listTemplates = query({
  args: { adminToken: v.optional(v.string()) },
  handler: async (ctx) => {
    return await ctx.db.query("emailTemplates").collect();
  },
});

// ─────────────────────────────────────────
// Niet Alleen dag-overrides
// ─────────────────────────────────────────

/** Alle dag-overrides ophalen (admin panel) */
export const listDagTemplates = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    return await ctx.db.query("nietAlleenDagTemplates").collect();
  },
});

/** Intern opvragen van een dag-override (gebruikt in email sending) */
export const getDagTemplateInternal = internalQuery({
  args: { dag: v.number(), verliesType: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("nietAlleenDagTemplates")
      .withIndex("by_dag_type", (q) => q.eq("dag", args.dag).eq("verliesType", args.verliesType))
      .unique();
  },
});

/** Dag-override opslaan of bijwerken (admin panel) */
export const upsertDagTemplate = mutation({
  args: {
    adminToken: v.string(),
    dag: v.number(),
    verliesType: v.string(),
    subject: v.string(),
    mailTekst: v.string(),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const existing = await ctx.db
      .query("nietAlleenDagTemplates")
      .withIndex("by_dag_type", (q) => q.eq("dag", args.dag).eq("verliesType", args.verliesType))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { subject: args.subject, mailTekst: args.mailTekst, updatedAt: Date.now() });
      return existing._id;
    }
    return await ctx.db.insert("nietAlleenDagTemplates", {
      dag: args.dag,
      verliesType: args.verliesType,
      subject: args.subject,
      mailTekst: args.mailTekst,
      updatedAt: Date.now(),
    });
  },
});

/** Dag-override verwijderen (terugzetten naar default) */
export const deleteDagTemplate = mutation({
  args: { adminToken: v.string(), dag: v.number(), verliesType: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const existing = await ctx.db
      .query("nietAlleenDagTemplates")
      .withIndex("by_dag_type", (q) => q.eq("dag", args.dag).eq("verliesType", args.verliesType))
      .unique();
    if (existing) await ctx.db.delete(existing._id);
  },
});

/** Template opslaan / bijwerken (admin panel) */
export const upsertTemplate = mutation({
  args: {
    adminToken: v.optional(v.string()),
    key: v.string(),
    subject: v.string(),
    bodyText: v.string(),
    aanhef: v.optional(v.string()),
    buttonText: v.optional(v.string()),
    buttonUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("emailTemplates")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();

    const fields = {
      subject: args.subject,
      bodyText: args.bodyText,
      aanhef: args.aanhef,
      buttonText: args.buttonText,
      buttonUrl: args.buttonUrl,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return existing._id;
    }

    return await ctx.db.insert("emailTemplates", { key: args.key, ...fields });
  },
});
