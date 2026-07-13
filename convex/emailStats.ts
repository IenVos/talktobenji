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
    tags: v.optional(v.record(v.string(), v.string())),
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

// Onderwerpen die in houvast.ts hardcoded staan: de brief-mail zelf en de mail
// die de brief aankondigt. De opvolgmails komen uit de templates.
const EH_LOSSE_MAILS: Record<string, string> = {
  "Jouw woorden die je hebt gedeeld in Even Houvast": "De brief zelf",
  "Houvast staat klaar voor je": "Aankondiging van de brief",
};

// Onderwerpen die in de admin zijn gewijzigd vóórdat we die geschiedenis
// bijhielden: oude onderwerpregel → template-key waar hij bij hoorde. Nieuwe
// wijzigingen komen vanzelf mee via `vorigeOnderwerpen` op de template.
const HISTORISCHE_ONDERWERPEN: Record<string, string> = {
  "Ik wil je iets vertellen over een hond die Zorro heette. Mijn hondje.": "eh_huisdier_6",
};

// Waar een verstuurde mail bij hoort. Elke opvolgmail bestaat in zes varianten
// (één per verliestype) met soms verschillende onderwerpregels, en een onderwerp
// kan in de admin hernoemd zijn. We tellen daarom op de mail zélf (`stroomId`,
// bijv. opvolgmail 3) en houden de losse onderwerpregels eronder zichtbaar.
type Herkomst = { groep: Groep; stroomId: string; titel: string };

// Vertaalt een template-key (eh_huisdier_3) naar de mail waar hij bij hoort.
function ehHerkomst(key: string): Herkomst | undefined {
  const match = /^eh_[a-z]+_(\d+)$/.exec(key);
  if (!match) return undefined;
  return { groep: "evenHouvast", stroomId: `eh_${match[1]}`, titel: `Opvolgmail ${match[1]}` };
}

// Labels die we sinds 13 juli 2026 bij elke verzending meesturen. Mails van
// daarvóór hebben ze niet; die vallen terug op de onderwerp-index.
function herkomstVanTags(
  tags: Record<string, string> | undefined,
  label: string
): Herkomst | undefined {
  const mail = tags?.mail;
  if (!tags || !mail) return undefined;
  if (tags.programma === "eh") {
    return { groep: "evenHouvast", stroomId: `eh_${mail}`, titel: `Opvolgmail ${mail}` };
  }
  if (tags.programma === "na") {
    return { groep: "nietAlleen", stroomId: `na_${mail}`, titel: label };
  }
  return undefined;
}

// Bouwt een index van genormaliseerd onderwerp → herkomst. Onderwerpen kunnen in
// de admin aangepast zijn, dus we lezen zowel de defaults als de opgeslagen
// templates, inclusief hun eerdere onderwerpregels.
async function bouwGroepIndex(ctx: QueryCtx): Promise<Map<string, Herkomst>> {
  const index = new Map<string, Herkomst>();
  const zet = (subject: string | undefined, herkomst: Herkomst) => {
    if (!subject || !subject.trim()) return;
    index.set(normaliseerOnderwerp(subject), herkomst);
  };
  // Niet Alleen en losse mails staan op zichzelf: één onderwerp = één mail.
  const opZichzelf = (subject: string, groep: Groep, titel?: string): Herkomst => ({
    groep,
    stroomId: normaliseerOnderwerp(subject),
    titel: titel ?? normaliseerOnderwerp(subject),
  });

  for (const [onderwerp, uitleg] of Object.entries(EH_LOSSE_MAILS)) {
    zet(onderwerp, { ...opZichzelf(onderwerp, "evenHouvast"), titel: uitleg });
  }

  for (const [key, tpl] of Object.entries(DEFAULT_TEMPLATES)) {
    const subject = (tpl as { subject?: string }).subject;
    if (!subject) continue;
    const eh = ehHerkomst(key);
    if (eh) zet(subject, eh);
    else if (key.startsWith("niet_alleen")) zet(subject, opZichzelf(subject, "nietAlleen"));
  }

  for (const tpl of await ctx.db.query("emailTemplates").collect()) {
    const herkomst =
      ehHerkomst(tpl.key) ??
      (tpl.key.startsWith("niet_alleen") ? opZichzelf(tpl.subject, "nietAlleen") : undefined);
    if (!herkomst) continue;
    zet(tpl.subject, herkomst);
    // Al verstuurde mails dragen het onderwerp van tóén; die tellen mee op
    // dezelfde mail, zodat je ziet of een nieuwe titel beter werkt.
    for (const oud of tpl.vorigeOnderwerpen ?? []) zet(oud, herkomst);
  }

  for (const dag of [...NIET_ALLEEN_CONTENT, ...EENZAAMHEID_CONTENT, ...KINDERLOOS_CONTENT]) {
    zet(dag.subject, opZichzelf(dag.subject, "nietAlleen"));
  }
  for (const dag of await ctx.db.query("nietAlleenDagTemplates").collect()) {
    const herkomst = opZichzelf(dag.subject, "nietAlleen");
    zet(dag.subject, herkomst);
    for (const oud of dag.vorigeOnderwerpen ?? []) zet(oud, herkomst);
  }

  for (const [oud, key] of Object.entries(HISTORISCHE_ONDERWERPEN)) {
    const herkomst = ehHerkomst(key);
    if (herkomst) zet(oud, herkomst);
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
    type MailInfo = { subject?: string; tags?: Record<string, string>; types: Set<string> };
    const perMail = new Map<string, MailInfo>();
    for (const e of events) {
      let m = perMail.get(e.emailId);
      if (!m) {
        m = { subject: e.subject, tags: e.tags, types: new Set() };
        perMail.set(e.emailId, m);
      }
      m.types.add(e.type);
      // Onderwerp en labels komen bij sent/delivered mee; bewaar de eerste die we zien.
      if (!m.subject && e.subject) m.subject = e.subject;
      if (!m.tags && e.tags) m.tags = e.tags;
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
    // Eén regel per mail, met daarbinnen een telling per verliestype én per
    // onderwerpregel: zo zie je of een andere titel of een ander type beter loopt.
    type VariantAgg = StroomAgg & { verliestype?: string };
    type StroomOpbouw = StroomAgg & { stroomId: string; varianten: Map<string, VariantAgg> };
    const perStroom = new Map<string, StroomOpbouw>();

    for (const m of perMail.values()) {
      const label = normaliseerOnderwerp(m.subject);
      // Labels (meegestuurd bij verzending) zijn leidend; oudere mails hebben ze
      // niet, dan leiden we de mail af uit de onderwerpregel.
      const herkomst: Herkomst = herkomstVanTags(m.tags, label) ??
        groepIndex.get(label) ?? { groep: "overig", stroomId: label, titel: label };
      const verliestype = m.tags?.verliestype;

      let s = perStroom.get(herkomst.stroomId);
      if (!s) {
        s = {
          ...leegAgg(herkomst.titel, herkomst.groep),
          stroomId: herkomst.stroomId,
          varianten: new Map(),
        };
        perStroom.set(herkomst.stroomId, s);
      }
      const variantSleutel = `${verliestype ?? ""}|${label}`;
      let variant = s.varianten.get(variantSleutel);
      if (!variant) {
        variant = { ...leegAgg(label, herkomst.groep), verliestype };
        s.varianten.set(variantSleutel, variant);
      }
      const groep = herkomst.groep;

      // "Verzonden" = we hebben minstens één event voor deze mail. Bij afgeleverd
      // tellen we ook een sent-event mee als de sent-webhook uitstaat.
      const isVerzonden = m.types.size > 0;
      const isAfgeleverd = heeft(m, "email.delivered");
      const isGeopend = heeft(m, "email.opened");
      const isGeklikt = heeft(m, "email.clicked");
      const isBounced = heeft(m, "email.bounced");
      const isKlacht = heeft(m, "email.complained");

      for (const agg of [variant, s, perGroep[groep], totaal]) {
        if (isVerzonden) agg.verzonden++;
        if (isAfgeleverd) agg.afgeleverd++;
        if (isGeopend) agg.geopend++;
        if (isGeklikt) agg.geklikt++;
        if (isBounced) agg.bounced++;
        if (isKlacht) agg.klachten++;
      }
    }

    // Varianten alleen meesturen als er iets te vergelijken valt (meer dan één
    // verliestype of titel); anders zou elke mail een uitklap krijgen met
    // exact dezelfde cijfers als de regel erboven.
    const stromen = Array.from(perStroom.values())
      .map(({ varianten, ...stroom }) => ({
        ...stroom,
        varianten:
          varianten.size > 1
            ? Array.from(varianten.values()).sort((a, b) => b.verzonden - a.verzonden)
            : [],
      }))
      .sort((a, b) => b.verzonden - a.verzonden);

    // Vaste volgorde: Even Houvast bovenaan, dan Niet Alleen, dan de rest. Binnen
    // Even Houvast op mailnummer, want dat is de volgorde waarin ze aankomen.
    const volgorde: Groep[] = ["evenHouvast", "nietAlleen", "overig"];
    const groepen = volgorde
      .map((g) => ({
        groep: g,
        titel: perGroep[g].onderwerp,
        totaal: perGroep[g],
        stromen: stromen
          .filter((s) => s.groep === g)
          .sort((a, b) => {
            if (g !== "evenHouvast") return b.verzonden - a.verzonden;
            const nr = (s: { stroomId: string }) =>
              Number(/^eh_(\d+)$/.exec(s.stroomId)?.[1] ?? 99);
            return nr(a) - nr(b) || b.verzonden - a.verzonden;
          }),
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
