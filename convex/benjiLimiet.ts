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
      return { actief: false, gebruikt: 0, limiet, zachtSeinVanaf: seinVanaf, bereikt: false, zachtSein: false };
    }

    // Onbeperkte (betaalde) gebruikers hebben geen grens: hasUnlimited via
    // getConversationCount. We halen die hier niet opnieuw op om dubbel werk te
    // voorkomen; de client vraagt getBerichtenStatus alleen voor niet-onbeperkte
    // gebruikers. Voor de zekerheid geven we toch de rauwe telling terug.
    const gebruikt = await telGebruikersberichten(ctx, args.userId);
    return {
      actief: true,
      gebruikt,
      limiet,
      zachtSeinVanaf: seinVanaf,
      bereikt: gebruikt >= limiet,
      zachtSein: gebruikt >= seinVanaf && gebruikt < limiet,
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
      return { actief: false, gebruikt: 0, limiet, zachtSeinVanaf: seinVanaf, bereikt: false, zachtSein: false };
    }
    const gebruikt = await telGebruikersberichtenAnoniem(ctx, args.anonymousId);
    return {
      actief: true,
      gebruikt,
      limiet,
      zachtSeinVanaf: seinVanaf,
      bereikt: gebruikt >= limiet,
      zachtSein: gebruikt >= seinVanaf && gebruikt < limiet,
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
