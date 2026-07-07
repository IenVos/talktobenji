/**
 * Resend e-mail-statistieken.
 *
 * Alle transactionele mails gaan via Resend. Zetten we in Resend een webhook +
 * open/click-tracking aan, dan stuurt Resend bij elke gebeurtenis (sent,
 * delivered, opened, clicked, bounced, complained) een event naar onze
 * HTTP-endpoint (/resend-webhook in http.ts). Die roept `recordEvent` aan.
 *
 * Alle events van dezelfde mail delen hetzelfde emailId. In `stats` groeperen we
 * per mail (emailId) om de reis te reconstrueren en tellen we per mailstroom
 * (genormaliseerd onderwerp) hoeveel er verstuurd, afgeleverd, geopend en
 * aangeklikt is → open-rate en klik-ratio.
 */
import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { checkAdmin } from "./adminAuth";

// Slaat één binnengekomen webhook-event op. Ontdubbelt op de svix-id, want
// Resend/svix kan hetzelfde event meer dan eens afleveren.
export const recordEvent = internalMutation({
  args: {
    emailId: v.string(),
    type: v.string(),
    subject: v.optional(v.string()),
    to: v.optional(v.string()),
    clickLink: v.optional(v.string()),
    createdAt: v.number(),
    svixId: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.svixId) {
      const bestaand = await ctx.db
        .query("resendEmailEvents")
        .withIndex("by_svixId", (q) => q.eq("svixId", args.svixId))
        .first();
      if (bestaand) return; // al verwerkt
    }
    await ctx.db.insert("resendEmailEvents", args);
  },
});

// Normaliseert een onderwerpregel tot een mailstroom-label: haalt [TEST] weg en
// vervangt cijferreeksen door N, zodat "Dag 3 van 30" en "Dag 12 van 30" onder
// één noemer vallen.
function normaliseerOnderwerp(subject: string | undefined): string {
  if (!subject || !subject.trim()) return "(onbekend onderwerp)";
  return subject
    .replace(/^\[TEST\]\s*/i, "")
    .replace(/\d+/g, "N")
    .trim();
}

type StroomAgg = {
  onderwerp: string;
  verzonden: number;
  afgeleverd: number;
  geopend: number;
  geklikt: number;
  bounced: number;
  klachten: number;
};

export const stats = query({
  args: { adminToken: v.string(), sinceDays: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);

    const dagen = args.sinceDays && args.sinceDays > 0 ? args.sinceDays : 30;
    const cutoff = Date.now() - dagen * 24 * 60 * 60 * 1000;

    const events = await ctx.db
      .query("resendEmailEvents")
      .withIndex("by_createdAt", (q) => q.gte("createdAt", cutoff))
      .collect();

    // Reconstrueer per mail (emailId) welke gebeurtenissen zijn voorgekomen.
    type MailInfo = { subject?: string; types: Set<string> };
    const perMail = new Map<string, MailInfo>();
    for (const e of events) {
      let m = perMail.get(e.emailId);
      if (!m) {
        m = { subject: e.subject, types: new Set() };
        perMail.set(e.emailId, m);
      }
      m.types.add(e.type);
      // Onderwerp komt bij sent/delivered mee; bewaar het eerste dat we zien.
      if (!m.subject && e.subject) m.subject = e.subject;
    }

    // Tel per gebeurtenistype "of het is voorgekomen voor deze mail" (uniek per mail).
    const heeft = (m: MailInfo, ...types: string[]) => types.some((t) => m.types.has(t));

    const totaal: StroomAgg = {
      onderwerp: "Totaal",
      verzonden: 0,
      afgeleverd: 0,
      geopend: 0,
      geklikt: 0,
      bounced: 0,
      klachten: 0,
    };
    const perStroom = new Map<string, StroomAgg>();

    for (const m of perMail.values()) {
      const label = normaliseerOnderwerp(m.subject);
      let s = perStroom.get(label);
      if (!s) {
        s = { onderwerp: label, verzonden: 0, afgeleverd: 0, geopend: 0, geklikt: 0, bounced: 0, klachten: 0 };
        perStroom.set(label, s);
      }
      // "Verzonden" = we hebben minstens één event voor deze mail. Bij afgeleverd
      // tellen we ook een sent-event mee als de sent-webhook uitstaat.
      const isVerzonden = m.types.size > 0;
      const isAfgeleverd = heeft(m, "email.delivered");
      const isGeopend = heeft(m, "email.opened");
      const isGeklikt = heeft(m, "email.clicked");
      const isBounced = heeft(m, "email.bounced");
      const isKlacht = heeft(m, "email.complained");

      for (const agg of [s, totaal]) {
        if (isVerzonden) agg.verzonden++;
        if (isAfgeleverd) agg.afgeleverd++;
        if (isGeopend) agg.geopend++;
        if (isGeklikt) agg.geklikt++;
        if (isBounced) agg.bounced++;
        if (isKlacht) agg.klachten++;
      }
    }

    const stromen = Array.from(perStroom.values()).sort((a, b) => b.verzonden - a.verzonden);

    return {
      dagen,
      heeftData: perMail.size > 0,
      totaal,
      stromen,
    };
  },
});
