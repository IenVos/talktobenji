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
  persoonlijkOnderwerp,
  persoonlijkeBody,
} from "./ehMailFooter";

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
 * Diagnose (CLI): hoeveel EH-doorlopers zouden er in een LOSGEKOPPELDE evergreen-
 * instroom komen (dus niet via de reactivatie). = brief na startdatum, alle 6 EH-
 * opvolgmails gehad, niet gekocht/afgemeld/test/NA-klant. Split naar of ze al in de
 * funnel zitten en of ze Benji al zagen (puur informatief).
 */
export const _ehCompletersVoorEvergreen = internalQuery({
  args: {},
  handler: async (ctx) => {
    const [brieven, verzonden, afmeldingen, naProfielen, subs, tokens, excluded, leads] =
      await Promise.all([
        ctx.db.query("houvastBrieven").collect(),
        ctx.db.query("ehOpvolgVerzonden").collect(),
        ctx.db.query("ehAfmeldingen").collect(),
        ctx.db.query("nietAlleenProfiles").collect(),
        ctx.db.query("userSubscriptions").collect(),
        ctx.db.query("benjiStartTokens").collect(),
        ctx.db.query("analyticsExcludedEmails").collect(),
        ctx.db.query("funnelLeads").collect(),
      ]);
    const afgemeldSet = new Set(afmeldingen.map((a: any) => a.email.toLowerCase()));
    const naSet = new Set(naProfielen.map((p: any) => p.email.toLowerCase()));
    const tokenSet = new Set(tokens.map((t: any) => t.email.toLowerCase()));
    const testSet = new Set(excluded.map((e: any) => e.email.toLowerCase()));
    const inFunnel = new Set(leads.map((l: any) => l.email.toLowerCase()));
    const heeftSubSet = new Set<string>();
    const kochtSet = new Set<string>();
    for (const s of subs) {
      if (!s.email) continue;
      const e = s.email.toLowerCase();
      heeftSubSet.add(e);
      if ((s.pricePaid ?? 0) > 0) kochtSet.add(e);
    }
    const gestuurd = new Map<string, Set<number>>();
    for (const v of verzonden) {
      const e = v.email.toLowerCase();
      (gestuurd.get(e) ?? gestuurd.set(e, new Set()).get(e)!).add(v.mailNummer);
    }
    const leadPerEmail = new Map<string, number>();
    for (const b of brieven) {
      if (b.sentAt < EH_OPVOLG_START) continue;
      const e = b.email.toLowerCase();
      if (!leadPerEmail.has(e) || b.sentAt > (leadPerEmail.get(e) ?? 0)) leadPerEmail.set(e, b.sentAt);
    }
    let compleetSchoon = 0, alInFunnel = 0, nieuwInstroom = 0, metBenji = 0, zonderBenji = 0;
    for (const email of leadPerEmail.keys()) {
      const nums = gestuurd.get(email);
      const compleet = !!nums && ALLE_MAILNUMMERS.every((n) => nums.has(n));
      if (!compleet) continue;
      if (testSet.has(email) || kochtSet.has(email) || naSet.has(email) || afgemeldSet.has(email)) continue;
      compleetSchoon++;
      if (inFunnel.has(email)) { alInFunnel++; continue; }
      nieuwInstroom++;
      if (tokenSet.has(email) || heeftSubSet.has(email)) metBenji++; else zonderBenji++;
    }
    return {
      compleetSchoon,
      NIEUW_zou_instromen: nieuwInstroom,
      waarvan_Benji_al_gezien: metBenji,
      waarvan_Benji_nog_niet: zonderBenji,
      al_in_funnel: alInFunnel,
    };
  },
});

/**
 * Diagnose (CLI): van de EH-doorlopers die de evergreen in kunnen, hoeveel dagen zijn
 * ze al "stil" sinds hun laatste EH-opvolgmail? Bepaalt of een verse dag-1-start oké is
 * of dat 7 dagen wachten op de eerste EGF-mail te lang voelt.
 */
export const _ehCompletersDagen = internalQuery({
  args: {},
  handler: async (ctx) => {
    const nu = Date.now();
    const [brieven, verzonden, afmeldingen, naProfielen, subs, excluded, leads] =
      await Promise.all([
        ctx.db.query("houvastBrieven").collect(),
        ctx.db.query("ehOpvolgVerzonden").collect(),
        ctx.db.query("ehAfmeldingen").collect(),
        ctx.db.query("nietAlleenProfiles").collect(),
        ctx.db.query("userSubscriptions").collect(),
        ctx.db.query("analyticsExcludedEmails").collect(),
        ctx.db.query("funnelLeads").collect(),
      ]);
    const afgemeldSet = new Set(afmeldingen.map((a: any) => a.email.toLowerCase()));
    const naSet = new Set(naProfielen.map((p: any) => p.email.toLowerCase()));
    const testSet = new Set(excluded.map((e: any) => e.email.toLowerCase()));
    const inFunnel = new Set(leads.map((l: any) => l.email.toLowerCase()));
    const kochtSet = new Set<string>();
    for (const s of subs) if (s.email && (s.pricePaid ?? 0) > 0) kochtSet.add(s.email.toLowerCase());

    // Per adres: welke EH-mailnummers + laatste sentAt.
    const rec = new Map<string, { nums: Set<number>; laatste: number }>();
    for (const v of verzonden) {
      const e = v.email.toLowerCase();
      const r = rec.get(e) ?? { nums: new Set<number>(), laatste: 0 };
      r.nums.add(v.mailNummer);
      if (v.sentAt > r.laatste) r.laatste = v.sentAt;
      rec.set(e, r);
    }
    const naStart = new Set<string>();
    for (const b of brieven) if (b.sentAt >= EH_OPVOLG_START && b.email) naStart.add(b.email.toLowerCase());

    const buckets: Record<string, number> = { "0-6": 0, "7-13": 0, "14-20": 0, "21-27": 0, "28+": 0 };
    let totaal = 0;
    let minDagen = Infinity, maxDagen = 0;
    const alle: number[] = [];
    for (const email of naStart) {
      const r = rec.get(email);
      const compleet = !!r && ALLE_MAILNUMMERS.every((n) => r.nums.has(n));
      if (!compleet) continue;
      if (testSet.has(email) || kochtSet.has(email) || naSet.has(email) || afgemeldSet.has(email)) continue;
      if (inFunnel.has(email)) continue;
      const dagen = Math.floor((nu - r!.laatste) / DAG_MS);
      totaal++;
      alle.push(dagen);
      minDagen = Math.min(minDagen, dagen);
      maxDagen = Math.max(maxDagen, dagen);
      if (dagen <= 6) buckets["0-6"]++;
      else if (dagen <= 13) buckets["7-13"]++;
      else if (dagen <= 20) buckets["14-20"]++;
      else if (dagen <= 27) buckets["21-27"]++;
      else buckets["28+"]++;
    }
    alle.sort((a, b) => a - b);
    const mediaan = alle.length ? alle[Math.floor(alle.length / 2)] : 0;
    return {
      totaal,
      dagenSindsLaatsteEHmail: buckets,
      minDagen: totaal ? minDagen : 0,
      maxDagen,
      mediaan,
    };
  },
});

/**
 * Diagnose (eenmalig, via CLI): hoeveel leads stromen de reactivatie NOG in?
 * Onderscheid dat het overzicht niet toont: leads die nog in de reeks zitten en
 * al voorbij mail 2 waren toen de Benji-intro werd toegevoegd, misten Benji (geen
 * token) en ronden de reeks straks af zonder Benji → terechte latere instroom.
 * Leads die nog vóór mail 2 zitten krijgen Benji alsnog in de funnel en stromen NIET in.
 */
export const _reactivatieInstroomDiagnose = internalQuery({
  args: {},
  handler: async (ctx) => {
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
    const gestuurdPerEmail = new Map<string, { nummers: Set<number>; laatste: number }>();
    for (const v of verzonden) {
      const e = v.email.toLowerCase();
      const rec = gestuurdPerEmail.get(e) ?? { nummers: new Set<number>(), laatste: 0 };
      rec.nummers.add(v.mailNummer);
      if (v.sentAt > rec.laatste) rec.laatste = v.sentAt;
      gestuurdPerEmail.set(e, rec);
    }
    const leadPerEmail = new Map<string, { email: string; type: string; briefAt: number }>();
    for (const b of brieven) {
      if (b.sentAt < EH_OPVOLG_START) continue;
      const e = b.email.toLowerCase();
      const best = leadPerEmail.get(e);
      if (!best || b.sentAt > best.briefAt) {
        leadPerEmail.set(e, { email: e, type: normType(b.verliesType), briefAt: b.sentAt });
      }
    }

    const perTypeInit = () => ({ persoon: 0, huisdier: 0, scheiding: 0, eenzaamheid: 0, kinderloos: 0, algemeen: 0 } as Record<string, number>);
    let klaarNu = 0, teKortGeleden = 0;
    // Nog in de reeks + schoon (geen token/aankoop/afmelding/test):
    let nogInReeks_voorbijMail2 = 0; // misten Benji, ronden af zonder → LATERE INSTROOM
    let nogInReeks_voorMail2 = 0;    // krijgen Benji nog in de funnel → NIET
    const instroomPerType = perTypeInit();
    // Nog in de reeks maar al gediskwalificeerd:
    let inReeks_alBenji = 0, inReeks_gekocht = 0, inReeks_afgemeld = 0, inReeks_test = 0;

    for (const lead of leadPerEmail.values()) {
      const g = gestuurdPerEmail.get(lead.email);
      const compleet = !!g && ALLE_MAILNUMMERS.every((n) => g.nummers.has(n));
      const schoon =
        !testSet.has(lead.email) &&
        !kochtSet.has(lead.email) && !naSet.has(lead.email) &&
        !afgemeldSet.has(lead.email) &&
        !tokenSet.has(lead.email) && !heeftSubSet.has(lead.email);

      if (compleet) {
        if (!schoon) continue;
        const dagen = Math.floor((nu - (g!.laatste || lead.briefAt)) / DAG_MS);
        if (dagen < MIN_RUST_DAGEN) teKortGeleden++;
        else klaarNu++;
        continue;
      }
      // Nog in de reeks (niet alle 6 gehad)
      if (!schoon) {
        if (testSet.has(lead.email)) inReeks_test++;
        else if (kochtSet.has(lead.email) || naSet.has(lead.email)) inReeks_gekocht++;
        else if (afgemeldSet.has(lead.email)) inReeks_afgemeld++;
        else if (tokenSet.has(lead.email) || heeftSubSet.has(lead.email)) inReeks_alBenji++;
        continue;
      }
      // Schoon én nog in de reeks: al voorbij mail 2 (nummer 2 gehad) = miste Benji.
      if (g && g.nummers.has(2)) {
        nogInReeks_voorbijMail2++;
        instroomPerType[lead.type] = (instroomPerType[lead.type] ?? 0) + 1;
      } else {
        nogInReeks_voorMail2++;
      }
    }

    return {
      klaarNu, // hoort 72 te zijn
      teKortGeleden, // reeks af, <3 dagen: komt er binnen enkele dagen bij
      LATERE_INSTROOM_voorbijMail2_zonderBenji: nogInReeks_voorbijMail2,
      instroomPerType,
      nogVoorMail2_krijgenBenjiNog: nogInReeks_voorMail2,
      inReeks_alBenji, inReeks_gekocht, inReeks_afgemeld, inReeks_test,
      uniekeLeadsNaStart: leadPerEmail.size,
    };
  },
});

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
const DOELGROEP_REACTIVATIE2 = "reactivatie-2";

// Zachte tweede mail, alleen voor wie mail 1 niet opende of aanklikte. Ien past de
// tekst zelf aan in de admin.
const REACTIVATIE2_DEFAULT = {
  subject: "Nog één keer, dan laat ik je met rust",
  bodyText:
    "Hoi {voornaam},\n\n" +
    "Een paar dagen geleden stuurde ik je een berichtje over Benji. Misschien ging het langs je heen, druk is het altijd.\n\n" +
    "Ik wilde het je nog één keer laten weten, want ik denk echt dat het je goed kan doen: een plek om je verhaal kwijt te kunnen, wanneer jij wilt. Ook midden in de nacht.\n\n" +
    "[benji-blok]\n\n" +
    "Lieve groet,",
  buttonText: "",
  buttonUrl: "",
  imageUrl: "",
  imageCaption: "",
};

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

// Alleen een nette knop "Maak kennis met Benji" (zonder kaartje), net als in de
// EH-funnel bij de marker [benji-start-link] of [Maak kennis met Benji].
function benjiKnopInline(benjiUrl: string): string {
  return `<div style="text-align:left;margin:26px 0;"><a href="${benjiUrl}" style="display:inline-block;background:#fdf9f4;color:#9a8168;border:1.5px solid #9a8168;padding:12px 26px;border-radius:12px;font-weight:600;font-size:15px;text-decoration:none;">Maak kennis met Benji &rarr;</a></div>`;
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
  mailTag?: string; // "reactivatie" (mail 1) of "reactivatie-2" (mail 2), voor reactie-meting
}) {
  const FROM = "Ien van Talk To Benji <contactmetien@talktobenji.com>";
  const mailTag = args.mailTag || "reactivatie";
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
          { name: "mail", value: mailTag },
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
  const body = persoonlijkeBody(args.bodyText, args.naam);

  const imageUrl = (args.imageUrl || "").trim() || undefined;
  const imageCaption = (args.imageCaption || "").trim() || undefined;

  // Benji-markers: [benji-blok] toont het witte kaartje, elke andere marker met
  // "benji" (bijv. [benji-start-link] of [Maak kennis met Benji]) toont alleen de
  // knop, precies zoals in de EH-funnel. Alleen als er een Benji-marker in staat,
  // maken we een persoonlijk token aan.
  const BENJI_MARKER_RE = /\[[^\]]*benji[^\]]*\]/i;
  const isBenjiBlok = (p: string) => /^\[benji-blok\]$/i.test(p.trim());
  const isBenjiCta = (p: string) => BENJI_MARKER_RE.test(p) && !isBenjiBlok(p);
  const heeftBenjiMarker = BENJI_MARKER_RE.test(body);
  let blokHtml = "";
  let benjiKnopHtml = "";
  if (heeftBenjiMarker) {
    const token = await ctx.runMutation(internal.benjiStart.genereerTokenInternal, {
      email: args.email,
      naam: args.naam,
    });
    const benjiUrl = `${appBase()}/benji-start?token=${token}`;
    blokHtml = benjiBlokHtml(benjiUrl);
    benjiKnopHtml = benjiKnopInline(benjiUrl);
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

  // P.S.-regels horen altijd onderaan, ná de handtekening. Apart verzamelen en als
  // laatste zetten, zodat ze ook goed staan zonder herkende afsluitgroet.
  const psStukken: string[] = [];
  const stukken: string[] = [];
  alineas.forEach((p: string, i: number) => {
    if (isBenjiBlok(p)) {
      stukken.push(blokHtml);
    } else if (isBenjiCta(p)) {
      stukken.push(benjiKnopHtml);
    } else if (AFBEELDING_MARKER.test(p)) {
      if (imageUrl) stukken.push(inlineAfbeelding(imageUrl, imageCaption));
    } else if (KNOP_MARKER.test(p)) {
      if (toonKnop) stukken.push(knopHtml);
    } else if (/^p\.?\s*s\.?/i.test(p)) {
      psStukken.push(psStijl(p));
    } else if (i === groetIndex) {
      stukken.push(autoVoorGroet);
      stukken.push(mailAlinea(p));
      stukken.push(mailHandtekeningIen());
    } else {
      stukken.push(mailAlinea(p));
    }
  });

  // Geen afsluitgroet gevonden: zet afbeelding/knop en de handtekening onderaan.
  if (groetIndex === -1) {
    stukken.push(autoVoorGroet);
    stukken.push(mailHandtekeningIen());
  }
  stukken.push(...psStukken);

  const type = args.type || "algemeen";
  const afmeldUrl = await ehAfmeldUrl(args.email, "reactivatie", type);

  return mailWrapper(`
    ${stukken.join("\n")}
    ${ehFooter(nietAlleenUrlVoorType(type), afmeldUrl)}
  `);
}

// Stap 1 (default) of stap 2 → bijbehorende doelgroep-sleutel en standaardtekst.
function reactivatieDoelDef(stap?: number) {
  return stap === 2
    ? { doelgroep: DOELGROEP_REACTIVATIE2, def: REACTIVATIE2_DEFAULT }
    : { doelgroep: DOELGROEP_REACTIVATIE, def: REACTIVATIE_DEFAULT };
}

/** De opgeslagen reactivatiemail (of de default als er nog niets is opgeslagen). */
export const getReactivatieMail = query({
  args: { adminToken: v.string(), stap: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const { doelgroep, def } = reactivatieDoelDef(args.stap);
    const rij = await ctx.db
      .query("funnelLosseMails")
      .filter((q) => q.eq(q.field("doelgroep"), doelgroep))
      .first();
    return {
      subject: rij?.subject ?? def.subject,
      bodyText: rij?.bodyText ?? def.bodyText,
      buttonText: rij?.buttonText ?? def.buttonText,
      buttonUrl: rij?.buttonUrl ?? def.buttonUrl,
      imageUrl: rij?.imageUrl ?? def.imageUrl,
      imageCaption: rij?.imageCaption ?? def.imageCaption,
      opgeslagen: !!rij,
    };
  },
});

/** Sla de reactivatiemail op (één rij per stap; upsert). */
export const saveReactivatieMail = mutation({
  args: {
    adminToken: v.string(),
    stap: v.optional(v.number()),
    subject: v.string(),
    bodyText: v.string(),
    buttonText: v.optional(v.string()),
    buttonUrl: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    imageCaption: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const { doelgroep } = reactivatieDoelDef(args.stap);
    const bestaand = await ctx.db
      .query("funnelLosseMails")
      .filter((q) => q.eq(q.field("doelgroep"), doelgroep))
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
        doelgroep,
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
    stap: v.optional(v.number()),
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
      stap: args.stap,
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
    await verstuurReactivatieEmail({ to: args.email, subject: persoonlijkOnderwerp(mail.subject, args.naam), html, apiKey });
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
// Idem voor de tweede reactivatiemail (zachte herinnering aan niet-reageerders).
const REACTIVATIE2_MAILNR = 101;

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

/**
 * Log mail 1 als verzonden (mailnummer 100). De lead stroomt hier NOG NIET de
 * evergreen in: dat gebeurt pas na de mail 2-ronde (zie _reactivatie2Sweep), zodat
 * iedereen eerst de volledige reactivatiefase (maximaal 2 mails) doorloopt.
 */
export const _logReactivatieVerzonden = internalMutation({
  args: {
    email: v.string(),
    naam: v.optional(v.string()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase();
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
        await verstuurReactivatieEmail({ to: lead.email, subject: persoonlijkOnderwerp(cfg.subject, lead.naam), html, apiKey });
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

// ── Mail 2: zachte herinnering aan niet-reageerders ──────────────────────────
// Alleen naar wie mail 1 kreeg maar niet opende of aanklikte (en niet kocht/afmeldde).
// Na deze ronde stroomt de HELE reactivatiegroep (ook wie op mail 1 reageerde) de
// evergreen funnel in: de reactivatiefase (max 2 mails) is dan afgerond.

/** Naam + verliestype per e-mailadres (laatste brief, anders funnelLead). */
async function naamTypeMap(ctx: any): Promise<Map<string, { naam: string | null; type: string }>> {
  const [brieven, funnelLeads] = await Promise.all([
    ctx.db.query("houvastBrieven").collect(),
    ctx.db.query("funnelLeads").collect(),
  ]);
  const laatste = new Map<string, number>();
  const out = new Map<string, { naam: string | null; type: string }>();
  for (const b of brieven) {
    if (!b.email) continue;
    const e = b.email.toLowerCase();
    if ((laatste.get(e) ?? 0) <= b.sentAt) {
      laatste.set(e, b.sentAt);
      out.set(e, { naam: b.naam ?? null, type: normType(b.verliesType) });
    }
  }
  for (const l of funnelLeads) {
    if (!l.email) continue;
    const e = l.email.toLowerCase();
    if (!out.has(e)) out.set(e, { naam: l.naam ?? null, type: normType(l.verliesType) });
  }
  return out;
}

/** De niet-reageerders van mail 1 (doelgroep voor mail 2). */
async function mail2Doelgroep(
  ctx: any
): Promise<{ email: string; naam: string | null; type: string }[]> {
  const [verzonden, afmeldingen, naProfielen, subs, events] = await Promise.all([
    ctx.db.query("ehOpvolgVerzonden").collect(),
    ctx.db.query("ehAfmeldingen").collect(),
    ctx.db.query("nietAlleenProfiles").collect(),
    ctx.db.query("userSubscriptions").collect(),
    ctx.db.query("resendEmailEvents").collect(),
  ]);

  const gotMail1 = new Set<string>();
  const gotMail2 = new Set<string>();
  for (const v of verzonden) {
    const e = v.email.toLowerCase();
    if (v.mailNummer === REACTIVATIE_MAILNR) gotMail1.add(e);
    if (v.mailNummer === REACTIVATIE2_MAILNR) gotMail2.add(e);
  }
  const afgemeld = new Set(afmeldingen.map((a: any) => a.email.toLowerCase()));
  const na = new Set(naProfielen.map((p: any) => p.email.toLowerCase()));
  const kocht = new Set<string>();
  for (const s of subs) if (s.email && (s.pricePaid ?? 0) > 0) kocht.add(s.email.toLowerCase());

  // Wie opende of klikte mail 1 (tag mail === "reactivatie") = reageerde.
  const reageerde = new Set<string>();
  for (const ev of events) {
    if (!ev.to) continue;
    const t = (ev.type || "").toLowerCase();
    if (!(t.includes("opened") || t.includes("clicked"))) continue;
    if (ev.tags?.mail !== "reactivatie") continue;
    reageerde.add(ev.to.toLowerCase());
  }

  const namen = await naamTypeMap(ctx);
  const out: { email: string; naam: string | null; type: string }[] = [];
  for (const e of gotMail1) {
    if (gotMail2.has(e)) continue;
    if (afgemeld.has(e) || na.has(e) || kocht.has(e)) continue;
    if (reageerde.has(e)) continue;
    const info = namen.get(e) ?? { naam: null, type: ALGEMEEN };
    out.push({ email: e, naam: info.naam, type: info.type });
  }
  return out;
}

export const _reactivatie2Config = internalQuery({
  args: {},
  handler: async (ctx) => {
    const rij = await ctx.db
      .query("funnelLosseMails")
      .filter((q) => q.eq(q.field("doelgroep"), DOELGROEP_REACTIVATIE2))
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
    };
  },
});

export const _reactivatie2Resterend = internalQuery({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    const doel = await mail2Doelgroep(ctx);
    return { totaalResterend: doel.length, batch: doel.slice(0, args.limit) };
  },
});

/** Log mail 2 als verzonden (mailnummer 101). Instroom volgt in de sweep. */
export const _logReactivatie2Verzonden = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase();
    const bestaand = await ctx.db
      .query("ehOpvolgVerzonden")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();
    if (!bestaand.some((e: any) => e.mailNummer === REACTIVATIE2_MAILNR)) {
      await ctx.db.insert("ehOpvolgVerzonden", {
        email,
        mailNummer: REACTIVATIE2_MAILNR,
        sentAt: Date.now(),
      });
    }
  },
});

export const _reactivatie2StatusZet = internalMutation({
  args: {
    status: v.optional(v.string()),
    aantalErbij: v.optional(v.number()),
    verstuurdOp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const rij = await ctx.db
      .query("funnelLosseMails")
      .filter((q) => q.eq(q.field("doelgroep"), DOELGROEP_REACTIVATIE2))
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
 * Losgekoppeld sinds 30 juli 2026: de evergreen-instroom loopt NIET meer via de
 * reactivatie. Iedereen die de Even Houvast-funnel afrondt stroomt automatisch de
 * evergreen in via `evergreen._instroomEHAfgerond` (draait dagelijks mee met de
 * evergreen-cron). De reactivatie stuurt dus alleen nog de twee Benji-reintro-mails.
 * Deze functie is bewust een no-op gebleven zodat de bestaande call sites blijven werken.
 */
export const _reactivatie2Sweep = internalMutation({
  args: {},
  handler: async () => {
    // Bewust leeg: instroom gebeurt losgekoppeld in de evergreen-motor.
  },
});

export const _reactivatie2Ronde = internalAction({
  args: {},
  handler: async (ctx): Promise<void> => {
    const cfg = await ctx.runQuery(internal.mailFunnel._reactivatie2Config, {});
    if (!cfg || cfg.status !== "bezig") return;
    if (cfg.gestopt) {
      await ctx.runMutation(internal.mailFunnel._reactivatie2StatusZet, { status: "concept" });
      return;
    }
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return;

    const { batch, totaalResterend } = await ctx.runQuery(
      internal.mailFunnel._reactivatie2Resterend,
      { limit: cfg.batchGrootte }
    );

    if (batch.length === 0) {
      await ctx.runMutation(internal.mailFunnel._reactivatie2Sweep, {});
      await ctx.runMutation(internal.mailFunnel._reactivatie2StatusZet, {
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
        await verstuurReactivatieEmail({
          to: lead.email,
          subject: persoonlijkOnderwerp(cfg.subject, lead.naam),
          html,
          apiKey,
          mailTag: "reactivatie-2",
        });
        await ctx.runMutation(internal.mailFunnel._logReactivatie2Verzonden, { email: lead.email });
        verstuurd++;
      } catch (e) {
        console.error(`Reactivatiemail 2 mislukt voor ${lead.email}:`, e);
      }
    }

    if (verstuurd > 0) {
      await ctx.runMutation(internal.mailFunnel._reactivatie2StatusZet, { aantalErbij: verstuurd });
    }

    if (totaalResterend - verstuurd > 0) {
      await ctx.scheduler.runAfter(cfg.intervalSec * 1000, internal.mailFunnel._reactivatie2Ronde, {});
    } else {
      await ctx.runMutation(internal.mailFunnel._reactivatie2Sweep, {});
      await ctx.runMutation(internal.mailFunnel._reactivatie2StatusZet, {
        status: "verzonden",
        verstuurdOp: Date.now(),
      });
    }
  },
});

/** Status + voortgang van mail 2 voor de admin. */
export const reactivatie2VerzendStatus = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const doel = await mail2Doelgroep(ctx);
    const rij = await ctx.db
      .query("funnelLosseMails")
      .filter((q) => q.eq(q.field("doelgroep"), DOELGROEP_REACTIVATIE2))
      .first();
    return {
      status: rij?.status ?? "concept",
      gestopt: !!rij?.gestopt,
      batchGrootte: rij?.batchGrootte ?? DEFAULT_BATCH,
      intervalSec: rij?.intervalSec ?? DEFAULT_INTERVAL_SEC,
      aantalVerzonden: rij?.aantalVerzonden ?? 0,
      totaalDoelgroep: doel.length,
      resterend: doel.length,
    };
  },
});

/** Start de verzending van mail 2 naar de niet-reageerders. Vereist bevestiging. */
export const startReactivatie2Verzending = mutation({
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
      .filter((q) => q.eq(q.field("doelgroep"), DOELGROEP_REACTIVATIE2))
      .first();
    if (!rij) throw new Error("Stel eerst de tweede reactivatiemail op en sla hem op.");
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
    await ctx.scheduler.runAfter(0, internal.mailFunnel._reactivatie2Ronde, {});
    return { ok: true };
  },
});

/** Noodrem voor mail 2. */
export const stopReactivatie2Verzending = mutation({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const rij = await ctx.db
      .query("funnelLosseMails")
      .filter((q) => q.eq(q.field("doelgroep"), DOELGROEP_REACTIVATIE2))
      .first();
    if (rij) await ctx.db.patch(rij._id, { gestopt: true, updatedAt: Date.now() });
    return { ok: true };
  },
});
