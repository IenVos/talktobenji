/**
 * E-mail templates voor trial reminders — bewerkbaar via admin panel.
 */
import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";
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

/** Template opslaan / bijwerken (admin panel) */
export const upsertTemplate = mutation({
  args: {
    adminToken: v.optional(v.string()),
    key: v.string(),
    subject: v.string(),
    bodyText: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("emailTemplates")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        subject: args.subject,
        bodyText: args.bodyText,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("emailTemplates", {
      key: args.key,
      subject: args.subject,
      bodyText: args.bodyText,
      updatedAt: Date.now(),
    });
  },
});
