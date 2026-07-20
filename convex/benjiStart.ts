/**
 * Één-klik Benji-proef voor Even Houvast-leads.
 *
 * De Benji-intro-mail bevat een persoonlijke link: /benji-start?token=XYZ. Bij het
 * inwisselen wordt (indien nodig) een WACHTWOORDLOOS account aangemaakt en een
 * 7-daagse trial gestart, waarna de NextAuth "benji-token"-provider inlogt.
 *
 * - Token: per lead, 7 dagen geldig, herbruikbaar binnen dat venster (zodat ze via
 *   de mail kunnen terugkomen, en een e-mailscanner die de link vooraf opent hem
 *   niet "opeet"). De sleutel is hun mailbox, net als bij "wachtwoord vergeten".
 *   Ze worden in-app naar een eigen wachtwoord genudged voor veilige terugkeer.
 * - De trial start op de KLIK (eerste inwisseling), niet bij verzenden.
 * - Alleen aanroepbaar met CONVEX_AUTH_ADAPTER_SECRET vanaf de Next.js-server,
 *   hetzelfde patroon als convex/credentials.ts.
 */
import { v } from "convex/values";
import { mutation, internalMutation } from "./_generated/server";

const TOKEN_GELDIGHEID_MS = 7 * 24 * 60 * 60 * 1000; // 7 dagen
const TRIAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dagen

/** Zelfde secret-check als credentials.ts (whitespace-genormaliseerd). */
function checkSecret(secret: string) {
  const envSecret = process.env.CONVEX_AUTH_ADAPTER_SECRET;
  if (envSecret === undefined || envSecret.trim() === "") {
    throw new Error("Missing CONVEX_AUTH_ADAPTER_SECRET Convex environment variable");
  }
  const norm = (s: string) => s.replace(/\s+/g, "").trim();
  if (norm(secret) !== norm(envSecret)) {
    throw new Error("benjiStart called without correct secret value");
  }
}

function nieuwToken(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

/**
 * Genereer (of hergebruik) een nog-geldig token voor dit e-mailadres. Aangeroepen
 * vanuit de mailverzending. Hergebruikt een bestaand geldig token zodat één lead
 * niet eindeloos tokens verzamelt.
 */
export const genereerTokenInternal = internalMutation({
  args: { email: v.string(), naam: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    const now = Date.now();

    const bestaand = await ctx.db
      .query("benjiStartTokens")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();
    const geldig = bestaand.find((t) => t.expiresAt > now);
    if (geldig) return geldig.token;

    const token = nieuwToken();
    await ctx.db.insert("benjiStartTokens", {
      token,
      email,
      naam: args.naam?.trim() || undefined,
      createdAt: now,
      expiresAt: now + TOKEN_GELDIGHEID_MS,
    });
    return token;
  },
});

/**
 * Wissel een token in: log in en (indien nodig) maak een wachtwoordloos account +
 * start de 7-daagse trial. Geeft de gebruiker terug voor de NextAuth-sessie, of
 * null als het token ongeldig/verlopen is.
 *
 * Idempotent: bij een tweede klik wordt geen dubbel account of dubbele trial
 * gemaakt, en bestaande (betaalde) toegang wordt nooit overschreven.
 */
export const consumeToken = mutation({
  args: { secret: v.string(), token: v.string() },
  handler: async (ctx, args) => {
    checkSecret(args.secret);
    const now = Date.now();

    const rij = await ctx.db
      .query("benjiStartTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    if (!rij || rij.expiresAt < now) return null;

    const email = rij.email.toLowerCase().trim();

    // Vind of maak de gebruiker (wachtwoordloos: geen credentials-record).
    let user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .unique();
    if (!user) {
      const userId = await ctx.db.insert("users", {
        email,
        name: rij.naam?.trim() || email.split("@")[0],
        emailVerified: now,
      });
      user = await ctx.db.get(userId);
    }
    if (!user) return null;

    // Start de 7-daagse trial alleen als er nog géén toegang is. Zo raakt een
    // bestaande klant (of lopende trial) niet overschreven.
    const bestaandeSub = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (!bestaandeSub) {
      await ctx.db.insert("userSubscriptions", {
        userId: user._id.toString(),
        email,
        subscriptionType: "trial",
        status: "active",
        startedAt: now,
        expiresAt: now + TRIAL_MS,
        bron: "eh",
        updatedAt: now,
      });
    }

    if (!rij.usedAt) await ctx.db.patch(rij._id, { usedAt: now });

    return { userId: user._id.toString(), email, name: user.name ?? null };
  },
});
