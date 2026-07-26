/**
 * Nieuwsbrief-opt-ins in het eigen systeem.
 *
 * Vroeger gingen deze aanmeldingen naar MailerLite. Sinds we dat loslaten bewaren
 * we de toestemming zelf in de tabel nieuwsbriefOptins, zodat de maandmail uit het
 * eigen e-mailsysteem deze mensen later kan bereiken. Eén rij per e-mailadres.
 *
 * Let op: dit legt alleen de wens vast om post te ontvangen. Wie zich afmeldt komt
 * in ehAfmeldingen; de verzendlogica van het eigen mailsysteem controleert dáár op,
 * dus een afmelding werkt ook voor de nieuwsbrief zonder dat we hier iets hoeven te
 * verwijderen.
 */
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const registreerOptin = mutation({
  args: {
    email: v.string(),
    naam: v.optional(v.string()),
    bron: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    if (!email || !email.includes("@")) return { ok: false };

    const bestaand = await ctx.db
      .query("nieuwsbriefOptins")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (bestaand) {
      // Al aangemeld: naam aanvullen als die eerder ontbrak, verder niets.
      if (!bestaand.naam && args.naam?.trim()) {
        await ctx.db.patch(bestaand._id, { naam: args.naam.trim() });
      }
      return { ok: true, nieuw: false };
    }

    await ctx.db.insert("nieuwsbriefOptins", {
      email,
      naam: args.naam?.trim() || undefined,
      bron: args.bron?.trim() || undefined,
      createdAt: Date.now(),
    });
    return { ok: true, nieuw: true };
  },
});
