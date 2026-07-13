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
import { internalMutation, query, type QueryCtx } from "./_generated/server";
import { checkAdmin } from "./adminAuth";
import { DEFAULT_TEMPLATES } from "./emailTemplatesDefaults";
import { NIET_ALLEEN_CONTENT } from "./nietAlleenContent";
import { EENZAAMHEID_CONTENT } from "./nietAlleenEenzaamheidContent";
import { KINDERLOOS_CONTENT } from "./nietAlleenKinderloosContent";

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
  groep: Groep;
  verzonden: number;
  afgeleverd: number;
  geopend: number;
  geklikt: number;
  bounced: number;
  klachten: number;
};

type Groep = "evenHouvast" | "nietAlleen" | "overig";

// Onderwerpen die in houvast.ts hardcoded staan (brief-mail en de mail die de
// brief aankondigt); de opvolgmails komen uit de templates hieronder.
const EH_VASTE_ONDERWERPEN = [
  "Jouw woorden die je hebt gedeeld in Even Houvast",
  "Houvast staat klaar voor je",
];

// Bouwt een index van genormaliseerd onderwerp → programma, zodat de tabel per
// mailstroom kan groeperen. Onderwerpen kunnen in de admin aangepast zijn, dus
// we lezen zowel de defaults als de opgeslagen templates.
async function bouwGroepIndex(ctx: QueryCtx): Promise<Map<string, Groep>> {
  const index = new Map<string, Groep>();
  const zet = (subject: string | undefined, groep: Groep) => {
    if (!subject || !subject.trim()) return;
    index.set(normaliseerOnderwerp(subject), groep);
  };

  for (const onderwerp of EH_VASTE_ONDERWERPEN) zet(onderwerp, "evenHouvast");

  for (const [key, tpl] of Object.entries(DEFAULT_TEMPLATES)) {
    const subject = (tpl as { subject?: string }).subject;
    if (key.startsWith("eh_")) zet(subject, "evenHouvast");
    else if (key.startsWith("niet_alleen")) zet(subject, "nietAlleen");
  }

  for (const tpl of await ctx.db.query("emailTemplates").collect()) {
    if (tpl.key.startsWith("eh_")) zet(tpl.subject, "evenHouvast");
    else if (tpl.key.startsWith("niet_alleen")) zet(tpl.subject, "nietAlleen");
  }

  for (const dag of [...NIET_ALLEEN_CONTENT, ...EENZAAMHEID_CONTENT, ...KINDERLOOS_CONTENT]) {
    zet(dag.subject, "nietAlleen");
  }
  for (const dag of await ctx.db.query("nietAlleenDagTemplates").collect()) {
    zet(dag.subject, "nietAlleen");
  }

  return index;
}

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

    const groepIndex = await bouwGroepIndex(ctx);
    const leegAgg = (onderwerp: string, groep: Groep): StroomAgg => ({
      onderwerp,
      groep,
      verzonden: 0,
      afgeleverd: 0,
      geopend: 0,
      geklikt: 0,
      bounced: 0,
      klachten: 0,
    });

    const totaal = leegAgg("Totaal", "overig");
    const perGroep: Record<Groep, StroomAgg> = {
      evenHouvast: leegAgg("Even Houvast", "evenHouvast"),
      nietAlleen: leegAgg("Niet Alleen", "nietAlleen"),
      overig: leegAgg("Overige mails", "overig"),
    };
    const perStroom = new Map<string, StroomAgg>();

    for (const m of perMail.values()) {
      const label = normaliseerOnderwerp(m.subject);
      const groep = groepIndex.get(label) ?? "overig";
      let s = perStroom.get(label);
      if (!s) {
        s = leegAgg(label, groep);
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

      for (const agg of [s, perGroep[groep], totaal]) {
        if (isVerzonden) agg.verzonden++;
        if (isAfgeleverd) agg.afgeleverd++;
        if (isGeopend) agg.geopend++;
        if (isGeklikt) agg.geklikt++;
        if (isBounced) agg.bounced++;
        if (isKlacht) agg.klachten++;
      }
    }

    const stromen = Array.from(perStroom.values()).sort((a, b) => b.verzonden - a.verzonden);

    // Vaste volgorde: Even Houvast bovenaan, dan Niet Alleen, dan de rest.
    const volgorde: Groep[] = ["evenHouvast", "nietAlleen", "overig"];
    const groepen = volgorde
      .map((g) => ({
        groep: g,
        titel: perGroep[g].onderwerp,
        totaal: perGroep[g],
        stromen: stromen.filter((s) => s.groep === g),
      }))
      .filter((g) => g.totaal.verzonden > 0);

    return {
      dagen,
      heeftData: perMail.size > 0,
      totaal,
      stromen,
      groepen,
    };
  },
});
