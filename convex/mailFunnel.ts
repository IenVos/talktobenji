/**
 * Eigen e-mailsysteem (evergreen funnel) — Convex-kant.
 *
 * Staat volledig los van de Even Houvast-reeks (convex/evenHouvastOpvolg.ts), die
 * op zijn eigen code blijft draaien. Zie PLAN_EVERGREEN_FUNNEL.md.
 *
 * STAP 1 (dit bestand nu): alleen lezen. Een overzicht van de eenmalige
 * reactivatie-doelgroep, met exacte aantallen, uitsplitsing per verliestype, de
 * redenen waarom leads afvallen, en een bounce-waarschuwing. Er verstuurt niets.
 */
import {
  query,
  mutation,
  action,
  internalQuery,
  internalMutation,
  internalAction,
} from "./_generated/server";
import { v } from "convex/values";
import { internal, api } from "./_generated/api";
import { checkAdmin } from "./adminAuth";
import {
  appBase,
  mailAlinea,
  mailKnop,
  mailWrapper,
  mailHandtekeningIen,
  ehFooter,
  ehAfmeldUrl,
  nietAlleenUrlVoorType,
} from "./ehMailFooter";
import { BENJI_BLOK_MARKER } from "./ehConcepten";

const DAG_MS = 24 * 60 * 60 * 1000;

// Gelijk aan evenHouvastOpvolg.ts: leads van vóór deze datum kregen alleen de
// brief en nooit de opvolgreeks, en vallen dus buiten de reactivatie.
const EH_OPVOLG_START = Date.UTC(2026, 5, 25); // 25 juni 2026

// De reeks telt zes opvolgmails. "Helemaal doorlopen" = alle zes gehad.
const ALLE_MAILNUMMERS = [1, 2, 3, 4, 5, 6];

// Minimale rust na de laatste opvolgmail voordat we opnieuw mailen.
const MIN_RUST_DAGEN = 3;

const EH_TYPES = ["persoon", "huisdier", "scheiding", "eenzaamheid", "kinderloos"];
const ALGEMEEN = "algemeen";
function normType(t?: string | null): string {
  return t && EH_TYPES.includes(t) ? t : ALGEMEEN;
}

/**
 * Berekent de reactivatie-doelgroep en de afvalredenen. Eén bron van waarheid voor
 * de eligibiliteitsregels: gebruikt door het overzicht én door de verzending, zodat
 * die nooit uit elkaar lopen. Neemt alleen ctx.db (geen auth), zodat ook interne
 * queries hem kunnen aanroepen.
 */
async function analyseReactivatie(ctx: any) {
  const nu = Date.now();

  const [brieven, verzonden, afmeldingen, naProfielen, subs, tokens, excluded] =
    await Promise.all([
        ctx.db.query("houvastBrieven").collect(),
        ctx.db.query("ehOpvolgVerzonden").collect(),
        ctx.db.query("ehAfmeldingen").collect(),
        ctx.db.query("nietAlleenProfiles").collect(),
        ctx.db.query("userSubscriptions").collect(),
        ctx.db.query("benjiStartTokens").collect(),
        ctx.db.query("analyticsExcludedEmails").collect(),
      ]);

    // Snelle opzoeksets per e-mailadres (alles lowercase).
    const afgemeldSet = new Set(afmeldingen.map((a: any) => a.email.toLowerCase()));
    const naSet = new Set(naProfielen.map((p: any) => p.email.toLowerCase()));
    const tokenSet = new Set(tokens.map((t: any) => t.email.toLowerCase()));
    const testSet = new Set(excluded.map((e: any) => e.email.toLowerCase()));

    // Elk e-mailadres met een subscription-rij heeft (of had) toegang; betaalde rij
    // = koper. We willen niemand 7 dagen gratis beloven die al toegang heeft.
    const heeftSubSet = new Set<string>();
    const kochtSet = new Set<string>();
    for (const s of subs) {
      if (!s.email) continue;
      const e = s.email.toLowerCase();
      heeftSubSet.add(e);
      if ((s.pricePaid ?? 0) > 0) kochtSet.add(e);
    }

    // Verstuurde opvolgmails per e-mailadres verzamelen (welke nummers + laatste).
    const gestuurdPerEmail = new Map<string, { nummers: Set<number>; laatste: number }>();
    for (const v of verzonden) {
      const e = v.email.toLowerCase();
      const rec = gestuurdPerEmail.get(e) ?? { nummers: new Set<number>(), laatste: 0 };
      rec.nummers.add(v.mailNummer);
      if (v.sentAt > rec.laatste) rec.laatste = v.sentAt;
      gestuurdPerEmail.set(e, rec);
    }

    // Unieke leads na de startdatum, met hun naam en verliestype (laatste brief).
    type Lead = { email: string; naam: string | null; type: string; briefAt: number };
    const leadPerEmail = new Map<string, Lead>();
    let voorStart = 0;
    for (const b of brieven) {
      if (b.sentAt < EH_OPVOLG_START) {
        voorStart++;
        continue;
      }
      const e = b.email.toLowerCase();
      const bestaand = leadPerEmail.get(e);
      if (!bestaand || b.sentAt > bestaand.briefAt) {
        leadPerEmail.set(e, {
          email: e,
          naam: b.naam ?? null,
          type: normType(b.verliesType),
          briefAt: b.sentAt,
        });
      }
    }

    // Tel per verliestype (voor de doelgroep) en de afvalredenen (voor de
    // series-voltooiers die tóch afvielen).
    const doelgroep: {
      email: string;
      naam: string | null;
      type: string;
      dagenSindsLaatste: number;
    }[] = [];
    const perType: Record<string, number> = {};
    let nogInReeks = 0; // wel na startdatum, maar nog niet alle 6 gehad
    let teKortGeleden = 0; // reeks af, maar laatste mail < 3 dagen geleden
    const redenen = { afgemeld: 0, gekocht: 0, alBenji: 0, testadres: 0 };

    for (const lead of leadPerEmail.values()) {
      const g = gestuurdPerEmail.get(lead.email);
      const compleet = !!g && ALLE_MAILNUMMERS.every((n) => g.nummers.has(n));
      if (!compleet) {
        nogInReeks++;
        continue;
      }

      // Vanaf hier: reeks helemaal doorlopen. Waarom valt iemand af?
      if (testSet.has(lead.email)) {
        redenen.testadres++;
        continue;
      }
      if (kochtSet.has(lead.email) || naSet.has(lead.email)) {
        redenen.gekocht++;
        continue;
      }
      if (afgemeldSet.has(lead.email)) {
        redenen.afgemeld++;
        continue;
      }
      // Nog nooit Benji gezien (geen token) én nog geen toegang (geen sub).
      if (tokenSet.has(lead.email) || heeftSubSet.has(lead.email)) {
        redenen.alBenji++;
        continue;
      }

      const dagenSindsLaatste = Math.floor((nu - (g!.laatste || lead.briefAt)) / DAG_MS);
      if (dagenSindsLaatste < MIN_RUST_DAGEN) {
        teKortGeleden++;
        continue;
      }

      doelgroep.push({ email: lead.email, naam: lead.naam, type: lead.type, dagenSindsLaatste });
      perType[lead.type] = (perType[lead.type] ?? 0) + 1;
    }

    doelgroep.sort((a, b) => a.dagenSindsLaatste - b.dagenSindsLaatste);

    return {
      totaal: doelgroep.length,
      perType: Object.entries(perType)
        .map(([type, aantal]) => ({ type, aantal }))
        .sort((a, b) => b.aantal - a.aantal),
      redenen,
      nogInReeks,
      teKortGeleden,
      voorStart,
      uniekeLeadsNaStart: leadPerEmail.size,
      lijst: doelgroep,
    };
}

/**
 * De eenmalige reactivatie-doelgroep (admin-overzicht). Dunne wrapper om
 * analyseReactivatie met een auth-check.
 */
export const reactivatieDoelgroep = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    return await analyseReactivatie(ctx);
  },
});

/**
 * Bounce-waarschuwing: hoeveel adressen in de reactivatie-doelgroep eerder een
 * harde bounce of klacht gaven. resendEmailEvents heeft geen index op ontvanger,
 * dus dit is een aparte doorloop; daarom losgetrokken van het hoofdoverzicht.
 * We filteren niet hard, we tonen het alleen als waarschuwing (zie het plan).
 */
export const reactivatieBounceCheck = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);

    // Bepaal eerst de doelgroep-adressen (zelfde regels, compact herhaald).
    const [brieven, verzonden, afmeldingen, naProfielen, subs, tokens, excluded, events] =
      await Promise.all([
        ctx.db.query("houvastBrieven").collect(),
        ctx.db.query("ehOpvolgVerzonden").collect(),
        ctx.db.query("ehAfmeldingen").collect(),
        ctx.db.query("nietAlleenProfiles").collect(),
        ctx.db.query("userSubscriptions").collect(),
        ctx.db.query("benjiStartTokens").collect(),
        ctx.db.query("analyticsExcludedEmails").collect(),
        ctx.db.query("resendEmailEvents").collect(),
      ]);

    const afgemeldSet = new Set(afmeldingen.map((a: any) => a.email.toLowerCase()));
    const naSet = new Set(naProfielen.map((p: any) => p.email.toLowerCase()));
    const tokenSet = new Set(tokens.map((t: any) => t.email.toLowerCase()));
    const testSet = new Set(excluded.map((e: any) => e.email.toLowerCase()));
    const heeftSubSet = new Set<string>();
    const kochtSet = new Set<string>();
    for (const s of subs) {
      if (!s.email) continue;
      const e = s.email.toLowerCase();
      heeftSubSet.add(e);
      if ((s.pricePaid ?? 0) > 0) kochtSet.add(e);
    }
    const gestuurdPerEmail = new Map<string, Set<number>>();
    for (const v of verzonden) {
      const e = v.email.toLowerCase();
      const set = gestuurdPerEmail.get(e) ?? new Set<number>();
      set.add(v.mailNummer);
      gestuurdPerEmail.set(e, set);
    }

    const doelSet = new Set<string>();
    const uniek = new Set<string>();
    for (const b of brieven) {
      if (b.sentAt < EH_OPVOLG_START) continue;
      uniek.add(b.email.toLowerCase());
    }
    for (const e of uniek) {
      const nums = gestuurdPerEmail.get(e);
      const compleet = !!nums && ALLE_MAILNUMMERS.every((n) => nums.has(n));
      if (!compleet) continue;
      if (testSet.has(e) || kochtSet.has(e) || naSet.has(e) || afgemeldSet.has(e)) continue;
      if (tokenSet.has(e) || heeftSubSet.has(e)) continue;
      doelSet.add(e);
    }

    // Adressen met een harde bounce of klacht.
    const bouncedSet = new Set<string>();
    for (const ev of events) {
      const t = (ev.type || "").toLowerCase();
      if (!ev.to) continue;
      if (t.includes("bounced") || t.includes("complained")) {
        bouncedSet.add(ev.to.toLowerCase());
      }
    }

    const geraakt = [...doelSet].filter((e) => bouncedSet.has(e));
    return { aantal: geraakt.length, adressen: geraakt.slice(0, 50) };
  },
});

// ── Reactivatiemail: opstellen + testen ──────────────────────────────────────
// De eenmalige mail voor de doelgroep hierboven. Kleine plaatshoudertekst; Ien
// past de echte tekst zelf aan in de admin. [benji-blok] rendert het Benji-kaartje
// met een persoonlijke één-klik-link. Er verstuurt hier nog niets naar de doelgroep:
// alleen een testmail naar een zelf ingevuld adres.

const DOELGROEP_REACTIVATIE = "reactivatie";

const REACTIVATIE_DEFAULT = {
  subject: "Ik heb iets nieuws voor je gemaakt",
  bodyText:
    "Hoi {voornaam},\n\n" +
    "Dit is een korte testtekst. Sinds jij destijds je verhaal met me deelde, heb ik iets nieuws gemaakt: Benji. Een plek om je verhaal kwijt te kunnen, wanneer jij wilt. Ook midden in de nacht.\n\n" +
    "[benji-blok]\n\n" +
    "Lieve groet,\n\n" +
    "P.S. Dit is een voorbeeld van een P.S. Zet een regel die met P.S. begint onderaan je tekst, dan komt hij netjes onder mijn handtekening.",
  buttonText: "",
  buttonUrl: "",
  imageUrl: "",
  imageCaption: "",
};

// Afsluitgroeten die vlak boven de handtekening horen (net als in de EH-mails).
const AFSLUITINGEN = [
  "lieve groet", "lieve groetjes", "veel liefs", "liefs", "met liefs",
  "warme groet", "een warme groet", "met warme groet", "groetjes",
  "warme groetjes", "veel sterkte", "sterkte",
];
function isAfsluiting(par: string): boolean {
  const g = par.toLowerCase().replace(/[.,!\s]+$/g, "").trim();
  return AFSLUITINGEN.includes(g);
}

// Marker om de geüploade afbeelding midden in de tekst te tonen: losse regel [afbeelding].
const AFBEELDING_MARKER = /^\[afbeelding\]$/i;

function inlineAfbeelding(imageUrl: string, caption?: string): string {
  const img = `<img src="${imageUrl}" alt="" style="width:100%;max-width:480px;height:auto;border-radius:12px;display:block;margin:0 auto;" />`;
  const cap = caption
    ? `<p style="font-size:13px;color:#6b6460;text-align:center;margin:10px 0 0 0;">${caption}</p>`
    : "";
  return `<div style="margin:24px 0;">${img}${cap}</div>`;
}

// Klikbare cover-afbeelding boven de knop (linkt naar de knop-URL indien aanwezig).
function coverBlok(imageUrl: string, linkUrl?: string, caption?: string): string {
  const img = `<img src="${imageUrl}" alt="" style="max-width:240px;width:100%;height:auto;border-radius:10px;display:block;margin:0 auto;box-shadow:0 4px 18px rgba(0,0,0,0.12);" />`;
  const inner = linkUrl ? `<a href="${linkUrl}" style="text-decoration:none;display:inline-block;">${img}</a>` : img;
  const cap = caption
    ? `<p style="font-size:13px;color:#6b6460;margin:12px 0 0 0;">${caption}</p>`
    : "";
  return `<div style="margin:26px 0;text-align:center;">${inner}${cap}</div>`;
}

// Het Benji-kaartje met persoonlijke één-klik-link (zelfde stijl als in de EH-mails).
function benjiBlokHtml(benjiUrl: string): string {
  return `<div style="margin:26px 0 6px;background:#ffffff;border:1px solid #e7ded1;border-radius:16px;padding:24px 22px;text-align:center;"><p style="font-size:16px;font-weight:700;color:#3d3530;margin:0 0 8px;">7 dagen gratis met Benji</p><p style="font-size:14px;line-height:1.6;color:#6b6460;margin:0 0 18px;">Een plek om je verhaal kwijt te kunnen, wanneer jij wilt. Ook midden in de nacht.</p><a href="${benjiUrl}" style="display:inline-block;background:#fdf9f4;color:#9a8168;border:1.5px solid #9a8168;padding:11px 24px;border-radius:12px;font-weight:600;font-size:15px;text-decoration:none;">Maak kennis met Benji &rarr;</a><p style="font-size:12px;line-height:1.5;color:#9a938c;margin:14px 0 0;">Geen formulier, geen wachtwoord.</p></div>`;
}

// Verstuur één mail via Resend, met retry bij tijdelijke fouten (zelfde patroon als
// de EH-opvolgmails). Tags zijn "reactivatie" zodat de statistieken deze stroom
// apart kunnen tellen en niet als EH-opvolgmail lezen.
async function verstuurReactivatieEmail(args: {
  to: string;
  subject: string;
  html: string;
  apiKey: string;
}) {
  const FROM = "Ien van Talk To Benji <contactmetien@talktobenji.com>";
  for (let poging = 1; poging <= 4; poging++) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${args.apiKey}` },
      body: JSON.stringify({
        from: FROM,
        to: [args.to],
        subject: args.subject,
        html: args.html,
        tags: [
          { name: "programma", value: "reactivatie" },
          { name: "mail", value: "reactivatie" },
        ],
      }),
    });
    if (res.ok) return;
    const detail = await res.text();
    const tijdelijk = res.status === 429 || res.status >= 500;
    if (!tijdelijk || poging === 4) {
      throw new Error(`Reactivatiemail mislukt (status ${res.status}): ${detail}`);
    }
    await new Promise((r) => setTimeout(r, poging * 1500));
  }
}

// Bouw de HTML van de reactivatiemail voor één ontvanger. Maakt (indien nodig) een
// persoonlijk Benji-token aan als de tekst [benji-blok] bevat.
async function bouwReactivatieHtml(
  ctx: any,
  args: {
    email: string;
    naam?: string;
    subject: string;
    bodyText: string;
    buttonText?: string;
    buttonUrl?: string;
    imageUrl?: string;
    imageCaption?: string;
    type?: string;
  }
): Promise<string> {
  const voornaam = (args.naam || "").trim().split(" ")[0];
  const body = args.bodyText
    .replace(/\{voornaam\}/g, voornaam)
    .replace(/(Hi|Hoi)\s+,/g, "$1,");

  const imageUrl = (args.imageUrl || "").trim() || undefined;
  const imageCaption = (args.imageCaption || "").trim() || undefined;

  // Benji-kaartje: alleen als de marker aanwezig is, dan een persoonlijk token.
  const heeftBlok = body.includes(BENJI_BLOK_MARKER);
  let blokHtml = "";
  if (heeftBlok) {
    const token = await ctx.runMutation(internal.benjiStart.genereerTokenInternal, {
      email: args.email,
      naam: args.naam,
    });
    blokHtml = benjiBlokHtml(`${appBase()}/benji-start?token=${token}`);
  }

  const knopTekst = (args.buttonText || "").trim();
  const knopUrl = (args.buttonUrl || "").trim();
  const toonKnop = !!knopTekst && !!knopUrl;

  const psStijl = (p: string) =>
    `<p style="font-size:14px;line-height:1.75;color:#718096;margin-top:20px;">${p.replace(/\n/g, "<br/>")}</p>`;

  // Alles verschijnt in de volgorde van de tekst. Markers ([benji-blok], [afbeelding],
  // [knop]) worden op hun eigen plek getoond, zodat je ze vrij kunt verschuiven. De
  // foto-handtekening hangt automatisch onder de afsluitgroet ("Lieve groet,").
  const KNOP_MARKER = /^\[knop\]$/i;
  const isBenji = (p: string) => p.includes(BENJI_BLOK_MARKER);

  const alineas = body
    .split(/\n\n+/)
    .map((p: string) => p.trim())
    .filter(Boolean);

  const gebruiktAfbeelding = alineas.some((p: string) => AFBEELDING_MARKER.test(p));
  const gebruiktKnop = alineas.some((p: string) => KNOP_MARKER.test(p));
  // Laatste afsluitgroet bepaalt waar de foto-handtekening komt.
  let groetIndex = -1;
  alineas.forEach((p: string, i: number) => {
    if (isAfsluiting(p)) groetIndex = i;
  });

  const coverHtml = imageUrl ? coverBlok(imageUrl, knopUrl || undefined, imageCaption) : "";
  const knopHtml = toonKnop ? mailKnop(knopTekst, knopUrl) : "";
  // Afbeelding/knop zonder eigen marker vallen terug op een vaste plek: vlak vóór de
  // afsluitgroet (of, zonder groet, onderaan de tekst).
  const autoVoorGroet =
    `${!gebruiktAfbeelding ? coverHtml : ""}${!gebruiktKnop ? knopHtml : ""}`;

  const stukken: string[] = [];
  alineas.forEach((p: string, i: number) => {
    if (isBenji(p)) {
      stukken.push(blokHtml);
    } else if (AFBEELDING_MARKER.test(p)) {
      if (imageUrl) stukken.push(inlineAfbeelding(imageUrl, imageCaption));
    } else if (KNOP_MARKER.test(p)) {
      if (toonKnop) stukken.push(knopHtml);
    } else if (i === groetIndex) {
      stukken.push(autoVoorGroet);
      stukken.push(mailAlinea(p));
      stukken.push(mailHandtekeningIen());
    } else if (/^p\.?\s*s\.?/i.test(p)) {
      stukken.push(psStijl(p));
    } else {
      stukken.push(mailAlinea(p));
    }
  });

  // Geen afsluitgroet gevonden: zet afbeelding/knop en de handtekening onderaan.
  if (groetIndex === -1) {
    stukken.push(autoVoorGroet);
    stukken.push(mailHandtekeningIen());
  }

  const type = args.type || "algemeen";
  const afmeldUrl = await ehAfmeldUrl(args.email, "reactivatie", type);

  return mailWrapper(`
    ${stukken.join("\n")}
    ${ehFooter(nietAlleenUrlVoorType(type), afmeldUrl)}
  `);
}

/** De opgeslagen reactivatiemail (of de default als er nog niets is opgeslagen). */
export const getReactivatieMail = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const rij = await ctx.db
      .query("funnelLosseMails")
      .filter((q) => q.eq(q.field("doelgroep"), DOELGROEP_REACTIVATIE))
      .first();
    return {
      subject: rij?.subject ?? REACTIVATIE_DEFAULT.subject,
      bodyText: rij?.bodyText ?? REACTIVATIE_DEFAULT.bodyText,
      buttonText: rij?.buttonText ?? REACTIVATIE_DEFAULT.buttonText,
      buttonUrl: rij?.buttonUrl ?? REACTIVATIE_DEFAULT.buttonUrl,
      imageUrl: rij?.imageUrl ?? REACTIVATIE_DEFAULT.imageUrl,
      imageCaption: rij?.imageCaption ?? REACTIVATIE_DEFAULT.imageCaption,
      opgeslagen: !!rij,
    };
  },
});

/** Sla de reactivatiemail op (één rij; upsert). */
export const saveReactivatieMail = mutation({
  args: {
    adminToken: v.string(),
    subject: v.string(),
    bodyText: v.string(),
    buttonText: v.optional(v.string()),
    buttonUrl: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    imageCaption: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const bestaand = await ctx.db
      .query("funnelLosseMails")
      .filter((q) => q.eq(q.field("doelgroep"), DOELGROEP_REACTIVATIE))
      .first();
    const velden = {
      subject: args.subject,
      bodyText: args.bodyText,
      buttonText: args.buttonText?.trim() || undefined,
      buttonUrl: args.buttonUrl?.trim() || undefined,
      imageUrl: args.imageUrl?.trim() || undefined,
      imageCaption: args.imageCaption?.trim() || undefined,
      updatedAt: Date.now(),
    };
    if (bestaand) {
      await ctx.db.patch(bestaand._id, velden);
    } else {
      await ctx.db.insert("funnelLosseMails", {
        ...velden,
        doelgroep: DOELGROEP_REACTIVATIE,
        status: "concept",
      });
    }
    return { ok: true };
  },
});

/**
 * Stuur een testmail naar één zelf gekozen adres. Gebruikt de opgeslagen tekst als
 * die er is, anders de default. Verstuurt NIET naar de doelgroep.
 */
export const stuurTestReactivatie = action({
  args: {
    adminToken: v.string(),
    email: v.string(),
    naam: v.optional(v.string()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ ok: boolean }> => {
    await ctx.runQuery(api.adminAuth.validateToken, { adminToken: args.adminToken });
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY ontbreekt");

    const mail = await ctx.runQuery(api.mailFunnel.getReactivatieMail, {
      adminToken: args.adminToken,
    });
    const html = await bouwReactivatieHtml(ctx, {
      email: args.email,
      naam: args.naam,
      subject: mail.subject,
      bodyText: mail.bodyText,
      buttonText: mail.buttonText,
      buttonUrl: mail.buttonUrl,
      imageUrl: mail.imageUrl,
      imageCaption: mail.imageCaption,
      type: args.type,
    });
    await verstuurReactivatieEmail({ to: args.email, subject: mail.subject, html, apiKey });
    return { ok: true };
  },
});

// ── Echte verzending naar de doelgroep (gespreid, stopbaar) ──────────────────
// Kleine groepjes met een pauze ertussen, via een zichzelf-herhalende taak. Zo
// blijven de pieken klein (Outlook/Hotmail knijpen bij bursts) en is de noodrem
// simpel: één vlag, en de volgende ronde stopt. Dedup en doorstroom naar de
// evergreen funnel gebeuren per mail, vlak vóór verzending.

const DEFAULT_BATCH = 25;
const DEFAULT_INTERVAL_SEC = 60;

// Speciaal mailnummer waarmee de reactivatiemail in ehOpvolgVerzonden wordt gelogd.
// Valt buiten de EH-reeks (1..6), dus de EH-cron en -overzichten negeren het; het
// geeft ons gratis dedup: nooit tweemaal dezelfde reactivatiemail.
const REACTIVATIE_MAILNR = 100;

/** Config + voortgang van de reactivatie-verzending (interne rij). */
export const _reactivatieConfig = internalQuery({
  args: {},
  handler: async (ctx) => {
    const rij = await ctx.db
      .query("funnelLosseMails")
      .filter((q) => q.eq(q.field("doelgroep"), DOELGROEP_REACTIVATIE))
      .first();
    if (!rij) return null;
    return {
      subject: rij.subject,
      bodyText: rij.bodyText,
      buttonText: rij.buttonText,
      buttonUrl: rij.buttonUrl,
      imageUrl: rij.imageUrl,
      imageCaption: rij.imageCaption,
      status: rij.status,
      gestopt: !!rij.gestopt,
      batchGrootte: rij.batchGrootte ?? DEFAULT_BATCH,
      intervalSec: rij.intervalSec ?? DEFAULT_INTERVAL_SEC,
      aantalVerzonden: rij.aantalVerzonden ?? 0,
    };
  },
});

/** De nog te versturen adressen (doelgroep minus wie de reactivatiemail al kreeg). */
export const _reactivatieResterend = internalQuery({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    const analyse = await analyseReactivatie(ctx);
    const verzonden = await ctx.db.query("ehOpvolgVerzonden").collect();
    const alGehad = new Set(
      verzonden
        .filter((v: any) => v.mailNummer === REACTIVATIE_MAILNR)
        .map((v: any) => v.email.toLowerCase())
    );
    const resterend = analyse.lijst.filter((l: any) => !alGehad.has(l.email));
    return {
      totaalResterend: resterend.length,
      batch: resterend.slice(0, args.limit),
    };
  },
});

/** Log de reactivatiemail als verzonden én zet de lead in de evergreen funnel. */
export const _logReactivatieVerzonden = internalMutation({
  args: {
    email: v.string(),
    naam: v.optional(v.string()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase();

    // Dedup-log in ehOpvolgVerzonden (mailnummer 100).
    const bestaand = await ctx.db
      .query("ehOpvolgVerzonden")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();
    if (!bestaand.some((e: any) => e.mailNummer === REACTIVATIE_MAILNR)) {
      await ctx.db.insert("ehOpvolgVerzonden", {
        email,
        mailNummer: REACTIVATIE_MAILNR,
        sentAt: Date.now(),
      });
    }

    // Doorstroom naar de evergreen funnel: eigen dag 1 vanaf nu. Bestaat de lead al,
    // dan niet opnieuw inschrijven.
    const lead = await ctx.db
      .query("funnelLeads")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (!lead) {
      await ctx.db.insert("funnelLeads", {
        email,
        naam: args.naam?.trim() || undefined,
        verliesType: args.type || undefined,
        ingestroomdOp: Date.now(),
        bron: "reactivatie",
        status: "in-backend",
        updatedAt: Date.now(),
      });
    }
  },
});

/** Zet de verzendstatus (bezig/verzonden) en de teller bij. */
export const _reactivatieStatusZet = internalMutation({
  args: {
    status: v.optional(v.string()),
    aantalErbij: v.optional(v.number()),
    verstuurdOp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const rij = await ctx.db
      .query("funnelLosseMails")
      .filter((q) => q.eq(q.field("doelgroep"), DOELGROEP_REACTIVATIE))
      .first();
    if (!rij) return;
    const patch: any = { updatedAt: Date.now() };
    if (args.status) patch.status = args.status;
    if (args.aantalErbij) patch.aantalVerzonden = (rij.aantalVerzonden ?? 0) + args.aantalErbij;
    if (args.verstuurdOp) patch.verstuurdOp = args.verstuurdOp;
    await ctx.db.patch(rij._id, patch);
  },
});

/**
 * Eén verzendronde: stuur een groepje, log per mail, en plan de volgende ronde in.
 * Stopt vanzelf als de lijst leeg is of als de noodrem aan staat. Her-controleert
 * per mail of iemand niet net is afgemeld of heeft gekocht (analyse doet dat al).
 */
export const _reactivatieRonde = internalAction({
  args: {},
  handler: async (ctx): Promise<void> => {
    const cfg = await ctx.runQuery(internal.mailFunnel._reactivatieConfig, {});
    if (!cfg || cfg.status !== "bezig") return;
    if (cfg.gestopt) {
      await ctx.runMutation(internal.mailFunnel._reactivatieStatusZet, { status: "concept" });
      return;
    }
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return;

    const { batch, totaalResterend } = await ctx.runQuery(
      internal.mailFunnel._reactivatieResterend,
      { limit: cfg.batchGrootte }
    );

    if (batch.length === 0) {
      await ctx.runMutation(internal.mailFunnel._reactivatieStatusZet, {
        status: "verzonden",
        verstuurdOp: Date.now(),
      });
      return;
    }

    let verstuurd = 0;
    for (const lead of batch) {
      try {
        const html = await bouwReactivatieHtml(ctx, {
          email: lead.email,
          naam: lead.naam ?? undefined,
          subject: cfg.subject,
          bodyText: cfg.bodyText,
          buttonText: cfg.buttonText,
          buttonUrl: cfg.buttonUrl,
          imageUrl: cfg.imageUrl,
          imageCaption: cfg.imageCaption,
          type: lead.type,
        });
        await verstuurReactivatieEmail({ to: lead.email, subject: cfg.subject, html, apiKey });
        await ctx.runMutation(internal.mailFunnel._logReactivatieVerzonden, {
          email: lead.email,
          naam: lead.naam ?? undefined,
          type: lead.type,
        });
        verstuurd++;
      } catch (e) {
        // Niet fataal: niet loggen, dan pakt een volgende ronde deze lead opnieuw.
        console.error(`Reactivatiemail mislukt voor ${lead.email}:`, e);
      }
    }

    if (verstuurd > 0) {
      await ctx.runMutation(internal.mailFunnel._reactivatieStatusZet, { aantalErbij: verstuurd });
    }

    // Nog meer te doen? Plan de volgende ronde na de ingestelde pauze.
    if (totaalResterend - verstuurd > 0) {
      await ctx.scheduler.runAfter(
        cfg.intervalSec * 1000,
        internal.mailFunnel._reactivatieRonde,
        {}
      );
    } else {
      await ctx.runMutation(internal.mailFunnel._reactivatieStatusZet, {
        status: "verzonden",
        verstuurdOp: Date.now(),
      });
    }
  },
});

/** Status + voortgang voor de admin. */
export const reactivatieVerzendStatus = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const analyse = await analyseReactivatie(ctx);
    const verzonden = await ctx.db.query("ehOpvolgVerzonden").collect();
    const alGehad = new Set(
      verzonden
        .filter((v: any) => v.mailNummer === REACTIVATIE_MAILNR)
        .map((v: any) => v.email.toLowerCase())
    );
    const resterend = analyse.lijst.filter((l: any) => !alGehad.has(l.email)).length;

    const rij = await ctx.db
      .query("funnelLosseMails")
      .filter((q) => q.eq(q.field("doelgroep"), DOELGROEP_REACTIVATIE))
      .first();

    return {
      status: rij?.status ?? "concept",
      gestopt: !!rij?.gestopt,
      batchGrootte: rij?.batchGrootte ?? DEFAULT_BATCH,
      intervalSec: rij?.intervalSec ?? DEFAULT_INTERVAL_SEC,
      aantalVerzonden: rij?.aantalVerzonden ?? 0,
      totaalDoelgroep: analyse.lijst.length,
      resterend,
    };
  },
});

/**
 * Start de verzending naar de hele doelgroep. Slaat eerst de instellingen op,
 * zet de status op "bezig" en trapt de eerste ronde af. Vereist bevestiging.
 */
export const startReactivatieVerzending = mutation({
  args: {
    adminToken: v.string(),
    bevestig: v.boolean(),
    batchGrootte: v.optional(v.number()),
    intervalSec: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    if (!args.bevestig) throw new Error("Bevestiging ontbreekt");

    const rij = await ctx.db
      .query("funnelLosseMails")
      .filter((q) => q.eq(q.field("doelgroep"), DOELGROEP_REACTIVATIE))
      .first();
    if (!rij) throw new Error("Stel eerst de reactivatiemail op en sla hem op.");
    if (rij.status === "bezig") throw new Error("De verzending loopt al.");

    const batchGrootte = Math.max(1, Math.min(100, args.batchGrootte ?? DEFAULT_BATCH));
    const intervalSec = Math.max(5, args.intervalSec ?? DEFAULT_INTERVAL_SEC);

    await ctx.db.patch(rij._id, {
      status: "bezig",
      gestopt: false,
      batchGrootte,
      intervalSec,
      gestartOp: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.mailFunnel._reactivatieRonde, {});
    return { ok: true };
  },
});

/** Noodrem: de volgende ronde stopt. Wat al verstuurd is, is verstuurd. */
export const stopReactivatieVerzending = mutation({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const rij = await ctx.db
      .query("funnelLosseMails")
      .filter((q) => q.eq(q.field("doelgroep"), DOELGROEP_REACTIVATIE))
      .first();
    if (rij) await ctx.db.patch(rij._id, { gestopt: true, updatedAt: Date.now() });
    return { ok: true };
  },
});
