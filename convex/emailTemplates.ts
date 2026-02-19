/**
 * E-mail templates voor trial reminders — bewerkbaar via admin panel.
 */
import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";

export const DEFAULT_TEMPLATES = {
  trial_day5: {
    subject: "Nog 2 dagen — je proefperiode loopt bijna af",
    bodyText: `We wilden je even laten weten dat je proefperiode over 2 dagen afloopt.\n\nWe hopen dat je de afgelopen dagen hebt kunnen voelen waarvoor Benji er is: een plek waar je je verhaal kwijt kunt, op je eigen tempo.\n\nAls je wilt blijven werken aan wat je bent begonnen, je reflecties, je doelen, je gesprekken, dan is er een abonnement dat daarbij past. En wat je tot nu toe hebt opgebouwd, blijft altijd van jou.`,
  },
  trial_day7: {
    subject: "Vandaag is de laatste dag van je proefperiode",
    bodyText: `Hoe gaat het met je? We hopen dat de afgelopen week met Benji een beetje steun heeft gebracht.\n\nDe afgelopen 7 dagen hebben we je laten proeven van alles wat Benji te bieden heeft, en vandaag is de laatste dag dat je volledige toegang hebt.\n\nHeb je gemerkt dat bepaalde dingen je goed deden? De gesprekken, je reflecties, de check-ins of de memories? Dan is het fijn om te weten dat die gewoon voor je bewaard blijven, wat je ook kiest.\n\nMocht je willen blijven gebruiken wat je de afgelopen tijd hebt ontdekt, dan kan dat via een abonnement dat bij je past. Geen druk, maar we willen je er wel even op wijzen.`,
  },
} as const;

export type TemplateKey = keyof typeof DEFAULT_TEMPLATES;

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
