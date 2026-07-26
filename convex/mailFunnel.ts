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
import { query } from "./_generated/server";
import { v } from "convex/values";
import { checkAdmin } from "./adminAuth";

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
 * De eenmalige reactivatie-doelgroep: leads die de EH-reeks helemaal doorliepen,
 * niet kochten, zich niet afmeldden, nog nooit een Benji-link kregen en nog geen
 * toegang hebben. Plus de redenen waarom andere series-voltooiers afvielen.
 */
export const reactivatieDoelgroep = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
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
