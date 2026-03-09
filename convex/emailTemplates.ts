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

  // ── Niet Alleen ────────────────────────────────────────────
  niet_alleen_welkom: {
    subject: "Welkom bij Niet Alleen — dag 1 begint vandaag",
    bodyText: `Fijn dat je er bent. De komende 30 dagen lopen we samen met je mee — één dag tegelijk.\n\nElke ochtend ontvang je een kleine vraag. Geen druk, geen goed of fout — gewoon ruimte voor wat er in je leeft.`,
  },
  niet_alleen_dag: {
    // {dag} wordt vervangen door het dagnummer (1–30)
    subject: "Dag {dag} — jouw moment van vandaag",
    bodyText: `Geen zin vandaag? Dat is ook goed. De pagina blijft open staan.`,
  },
  niet_alleen_dag28: {
    subject: "Nog twee dagen — wat er daarna is",
    bodyText: `Over twee dagen zijn je 30 dagen klaar. Wat je hebt geschreven, is van jou — en het verdwijnt niet zomaar.\n\nOp dag 30 sturen we je een overzicht van alles wat je hebt ingevuld, zodat je het kunt bewaren. Wil je daarna gewoon verdergaan? Dan kun je je account omzetten naar een volledig abonnement.`,
  },
  niet_alleen_dag30: {
    subject: "Je 30 dagen zijn klaar — bewaar wat je hebt geschreven",
    bodyText: `Je hebt het gedaan. 30 dagen. Dat is iets om bij stil te staan.\n\nJe kunt alles wat je hebt geschreven bewaren als je een volledig account neemt. Je hebt daar nog 7 dagen de tijd voor — daarna sluit je gratis account.`,
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
