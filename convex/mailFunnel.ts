/**
 * Eigen e-mailsysteem — evergreen-instroom diagnostiek (Convex-kant).
 *
 * Staat los van de Even Houvast-reeks (convex/evenHouvastOpvolg.ts) en van de
 * evergreen-motor (convex/evergreen.ts). De eenmalige reactivatie-campagne is
 * afgerond en helemaal verwijderd; wat hier overblijft zijn twee read-only
 * CLI-diagnostieken die tonen hoeveel EH-doorlopers de evergreen in (zouden)
 * stromen. Er verstuurt niets.
 */
import { internalQuery } from "./_generated/server";

const DAG_MS = 24 * 60 * 60 * 1000;

// Gelijk aan evenHouvastOpvolg.ts: leads van vóór deze datum kregen alleen de
// brief en nooit de opvolgreeks, en vallen dus buiten de instroom.
const EH_OPVOLG_START = Date.UTC(2026, 5, 25); // 25 juni 2026

// De reeks telt zes opvolgmails. "Helemaal doorlopen" = alle zes gehad.
const ALLE_MAILNUMMERS = [1, 2, 3, 4, 5, 6];

const EH_TYPES = ["persoon", "huisdier", "scheiding", "eenzaamheid", "kinderloos"];
const ALGEMEEN = "algemeen";
function normType(t?: string | null): string {
  return t && EH_TYPES.includes(t) ? t : ALGEMEEN;
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
