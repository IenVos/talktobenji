/**
 * Nieuw gratis-model: gebruik in plaats van tijd.
 *
 * In plaats van een 7-daagse trial (datum-gebaseerd) krijgt een gratis gebruiker
 * een tegoed aan berichten. De harde grens is het TOTAAL aantal verstuurde
 * gebruikersberichten (over alle gesprekken heen), want dat is niet te omzeilen
 * door oude gesprekken te hervatten. "5 gesprekken" is alleen de beleving/tekst;
 * de teller is de echte grens.
 *
 * Alles hangt achter de env-flag BENJI_BERICHTEN_MODEL_ACTIEF. Zolang die niet op
 * "true" staat, verandert er live NIETS: de oude 7-dagen-machine blijft leidend.
 * Zie ook convex/subscriptions.ts (getConversationCount) en convex/ai.ts.
 */
import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";

// Gratis tegoed: ~5 gesprekken van ~30-40 berichten = samen ~175 berichten.
// Instelbaar via env-var BENJI_GRATIS_BERICHTEN_LIMIET (handig om te testen: zet 'm
// laag, test de paywall, zet 'm daarna terug op 175 of haal de var weg).
const DEFAULT_LIMIET = 175;

function envPositiefGetal(naam: string): number | null {
  const raw = parseInt(process.env[naam] ?? "", 10);
  return Number.isFinite(raw) && raw > 0 ? raw : null;
}

/** Gratis berichten-tegoed. Env-var wint, anders 175. */
export function gratisBerichtenLimiet(): number {
  return envPositiefGetal("BENJI_GRATIS_BERICHTEN_LIMIET") ?? DEFAULT_LIMIET;
}

/** Zacht seintje: env-var wint, anders 75% van de limiet (schaalt mee bij testen). */
export function zachtSeinVanaf(): number {
  return envPositiefGetal("BENJI_ZACHT_SEIN_VANAF") ?? Math.round(gratisBerichtenLimiet() * 0.75);
}

/** True zodra de env-flag expliciet aan staat. Overal één bron. */
export function berichtenModelActief(): boolean {
  return process.env.BENJI_BERICHTEN_MODEL_ACTIEF === "true";
}

/**
 * Pauze waarna een volgend bericht als een nieuw "gesprek" telt. Artifact: >6 uur.
 * Alleen voor de beleving/zachte tekst ("dit is je vijfde gesprek"), NIET de grens
 * (dat blijft de berichtenteller). Env in minuten (BENJI_GESPREK_PAUZE_MIN) zodat je
 * kunt testen zonder 6 uur te wachten; default 360 (= 6 uur).
 */
export function gesprekPauzeMs(): number {
  // Seconden-override voor snel testen (bijv. 15). Anders minuten (default 360 = 6u).
  const sec = envPositiefGetal("BENJI_GESPREK_PAUZE_SEC");
  if (sec) return sec * 1000;
  return (envPositiefGetal("BENJI_GESPREK_PAUZE_MIN") ?? 360) * 60 * 1000;
}

/**
 * Huidig gesprek-nummer uit oplopende bericht-tijdstippen: begint op 1 en telt +1
 * telkens er tussen twee opeenvolgende berichten een pauze groter dan de drempel zit.
 * 0 berichten = gesprek 1 (staat op het punt te beginnen).
 */
export function berekenGesprekNummer(tijdenOplopend: number[]): number {
  if (tijdenOplopend.length === 0) return 1;
  const drempel = gesprekPauzeMs();
  let gesprekken = 1;
  for (let i = 1; i < tijdenOplopend.length; i++) {
    if (tijdenOplopend[i] - tijdenOplopend[i - 1] > drempel) gesprekken++;
  }
  return gesprekken;
}

/**
 * Titel van het [benji-blok] onderaan de mails (EH-opvolg + evergreen) en soortgelijke
 * "gratis proberen"-copy. Flipt mee met de vlag: uit = de bestaande 7-dagen-belofte,
 * aan = de berichten/gesprekken-belofte. Zo belooft de mail nooit iets anders dan de
 * chat geeft.
 */
export function benjiGratisLabel(): string {
  return berichtenModelActief() ? "5 gesprekken gratis met Benji" : "7 dagen gratis met Benji";
}

/**
 * Tel het totaal aantal gebruikersberichten van één ingelogde gebruiker over al
 * zijn gesprekken heen. Goedkoop: een gratis gebruiker heeft er per definitie
 * hooguit ~175 in een handvol sessies; betaalde gebruikers raken deze telling niet
 * (die zijn onbeperkt en slaan de check over).
 */
export async function telGebruikersberichten(
  ctx: { db: any },
  userId: string
): Promise<number> {
  const sessions = await ctx.db
    .query("chatSessions")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .collect();

  let totaal = 0;
  for (const s of sessions) {
    const berichten = await ctx.db
      .query("chatMessages")
      .withIndex("by_session", (q: any) => q.eq("sessionId", s._id))
      .collect();
    totaal += berichten.filter((m: any) => m.role === "user").length;
  }
  return totaal;
}

/**
 * Zelfde telling maar voor een anonieme bezoeker (zonder account), op basis van
 * anonymousId. Zo krijgt iedereen (met én zonder account) hetzelfde tegoed van 5
 * gesprekken voordat de betaalde versie in beeld komt.
 */
export async function telGebruikersberichtenAnoniem(
  ctx: { db: any },
  anonymousId: string
): Promise<number> {
  const sessions = await ctx.db
    .query("chatSessions")
    .withIndex("by_anonymous", (q: any) => q.eq("anonymousId", anonymousId))
    .collect();

  let totaal = 0;
  for (const s of sessions) {
    if (s.userId) continue; // al geclaimd door een account: telt daar mee
    const berichten = await ctx.db
      .query("chatMessages")
      .withIndex("by_session", (q: any) => q.eq("sessionId", s._id))
      .collect();
    totaal += berichten.filter((m: any) => m.role === "user").length;
  }
  return totaal;
}

/** Oplopende tijdstippen van alle gebruikersberichten (voor teller + gesprek-nummer). */
async function berichtTijdenUser(ctx: { db: any }, userId: string): Promise<number[]> {
  const sessions = await ctx.db
    .query("chatSessions")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .collect();
  const tijden: number[] = [];
  for (const s of sessions) {
    const berichten = await ctx.db
      .query("chatMessages")
      .withIndex("by_session", (q: any) => q.eq("sessionId", s._id))
      .collect();
    for (const m of berichten) if (m.role === "user") tijden.push(m.createdAt);
  }
  tijden.sort((a, b) => a - b);
  return tijden;
}

/** Idem voor een anonieme bezoeker (nog niet-geclaimde sessies). */
async function berichtTijdenAnoniem(ctx: { db: any }, anonymousId: string): Promise<number[]> {
  const sessions = await ctx.db
    .query("chatSessions")
    .withIndex("by_anonymous", (q: any) => q.eq("anonymousId", anonymousId))
    .collect();
  const tijden: number[] = [];
  for (const s of sessions) {
    if (s.userId) continue;
    const berichten = await ctx.db
      .query("chatMessages")
      .withIndex("by_session", (q: any) => q.eq("sessionId", s._id))
      .collect();
    for (const m of berichten) if (m.role === "user") tijden.push(m.createdAt);
  }
  tijden.sort((a, b) => a - b);
  return tijden;
}

/**
 * Config voor de frontend: staat het model aan, en wat zijn de grenzen. Zo hoeft
 * de client de env-flag niet te kennen.
 */
export const getConfig = query({
  args: {},
  handler: async () => ({
    actief: berichtenModelActief(),
    limiet: gratisBerichtenLimiet(),
    zachtSeinVanaf: zachtSeinVanaf(),
  }),
});

/**
 * Status voor de chat-UI: hoeveel berichten verbruikt, of de paywall in beeld
 * moet en of het zachte 75%-seintje aan mag. Geeft alleen zinvolle waarden als
 * het model aanstaat; anders actief:false zodat de UI het oude gedrag houdt.
 */
export const getBerichtenStatus = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const limiet = gratisBerichtenLimiet();
    const seinVanaf = zachtSeinVanaf();
    if (!berichtenModelActief()) {
      return { actief: false, gebruikt: 0, limiet, zachtSeinVanaf: seinVanaf, bereikt: false, zachtSein: false, gesprekNummer: 1 };
    }

    const tijden = await berichtTijdenUser(ctx, args.userId);
    const gebruikt = tijden.length;
    return {
      actief: true,
      gebruikt,
      limiet,
      zachtSeinVanaf: seinVanaf,
      bereikt: gebruikt >= limiet,
      zachtSein: gebruikt >= seinVanaf && gebruikt < limiet,
      gesprekNummer: berekenGesprekNummer(tijden),
    };
  },
});

/**
 * Zelfde status maar voor een anonieme bezoeker (zonder account). Zo krijgt de
 * chat-UI dezelfde paywall/zacht-sein-info voor niet-ingelogde bezoekers.
 */
export const getAnoniemBerichtenStatus = query({
  args: { anonymousId: v.string() },
  handler: async (ctx, args) => {
    const limiet = gratisBerichtenLimiet();
    const seinVanaf = zachtSeinVanaf();
    if (!berichtenModelActief()) {
      return { actief: false, gebruikt: 0, limiet, zachtSeinVanaf: seinVanaf, bereikt: false, zachtSein: false, gesprekNummer: 1 };
    }
    const tijden = await berichtTijdenAnoniem(ctx, args.anonymousId);
    const gebruikt = tijden.length;
    return {
      actief: true,
      gebruikt,
      limiet,
      zachtSeinVanaf: seinVanaf,
      bereikt: gebruikt >= limiet,
      zachtSein: gebruikt >= seinVanaf && gebruikt < limiet,
      gesprekNummer: berekenGesprekNummer(tijden),
    };
  },
});

/**
 * Markeer eenmalig dat een gebruiker de paywall heeft bereikt. Leading indicator
 * voor advertentie-rendement: hoeveel van de aangeklikte leads komen echt tot de
 * betaalvraag. Idempotent: overschrijft een bestaand moment niet.
 */
export const markPaywallBereikt = internalMutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const sub = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (!sub || sub.paywallBereiktAt) return;
    await ctx.db.patch(sub._id, { paywallBereiktAt: Date.now(), updatedAt: Date.now() });
  },
});

/**
 * Publieke variant: de chat-UI meldt dat de paywall in beeld kwam. Nodig omdat de
 * client het versturen al blokkeert (dus de server-side check hierboven zou anders
 * nooit vuren). Gebruikt de ingelogde identiteit, negeert externe userId's.
 */
export const meldPaywallBereikt = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;
    const sub = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();
    if (!sub || sub.paywallBereiktAt) return;
    await ctx.db.patch(sub._id, { paywallBereiktAt: Date.now(), updatedAt: Date.now() });
  },
});
