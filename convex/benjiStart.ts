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
import { mutation, internalMutation, internalQuery, query } from "./_generated/server";

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
 * Heeft dit adres de Benji-link ooit gebruikt (ingelogd)? Puur "deur open ja/nee",
 * op basis van een token met usedAt. We kijken nooit naar wat er binnen gebeurde.
 * Gebruikt om het Benji-blok in de mail voorwaardelijk te maken: nog nooit geklikt =
 * "maak kennis"; wel geklikt = de "kom terug"-tekst.
 */
export const heeftBenjiGebruikt = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    if (!email) return false;
    const tokens = await ctx.db
      .query("benjiStartTokens")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();
    return tokens.some((t) => !!t.usedAt);
  },
});

/**
 * Log dat een Benji-link naar dit adres is verstuurd, met welke mail. Eén regel per
 * verzending (dus ook als het token wordt hergebruikt), zodat we per klik de tik
 * (1e/2e/3e mail) kunnen terugrekenen. Puur meten; heeft geen effect op de mail.
 */
export const logVerzending = internalMutation({
  args: { email: v.string(), mail: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    if (!email) return;
    await ctx.db.insert("benjiLinkVerzonden", {
      email,
      mail: args.mail,
      verstuurdOp: Date.now(),
    });
  },
});

/**
 * Genereer (of hergebruik) een token vanaf de Next.js-server met het
 * ADMIN_SESSION_SECRET (hetzelfde secret als de afmeldroute). Zo kan het
 * afmeld-bevestigingsscherm de zojuist afgemelde lead alsnog gratis toegang tot
 * Benji aanbieden. Maakt géén account of trial aan; dat gebeurt pas bij de klik.
 */
export const genereerTokenNaAfmelding = mutation({
  args: { email: v.string(), naam: v.optional(v.string()), secret: v.string() },
  handler: async (ctx, args) => {
    if (!process.env.ADMIN_SESSION_SECRET || args.secret !== process.env.ADMIN_SESSION_SECRET) {
      throw new Error("Ongeldige aanroep");
    }
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

/**
 * Bepaal waar de mail-link naartoe moet, VÓÓR we /benji laden. Zo gaat een
 * terugkerende gebruiker rechtstreeks naar /account (geen chatscherm ertussen) en
 * een verse EH-lead direct de verliestype-chat in. Werkt op het token (dat is zelf
 * het geheim), dus geen ingelogde sessie nodig. Dezelfde beslissing als startEhChat.
 * Bestemming "account": al eens echt gepraat, geen EH-lead, of onbekend token.
 * Bestemming "chat": verse EH-lead die nog nooit een bericht typte.
 */
export const routeNaStart = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const rij = await ctx.db
      .query("benjiStartTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    if (!rij) return { bestemming: "account" as const };
    const email = rij.email.toLowerCase().trim();

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .unique();
    if (user) {
      const userId = user._id.toString();
      const sessies = await ctx.db
        .query("chatSessions")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
      for (const s of sessies) {
        const um = await ctx.db
          .query("chatMessages")
          .withIndex("by_session", (q) => q.eq("sessionId", s._id))
          .filter((q) => q.eq(q.field("role"), "user"))
          .first();
        if (um) return { bestemming: "account" as const };
      }
    }

    const brieven = await ctx.db
      .query("houvastBrieven")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();
    if (brieven.length === 0) return { bestemming: "account" as const };

    return { bestemming: "chat" as const };
  },
});
