/**
 * E-mail/wachtwoord inloggen: aanmaken gebruiker + credentials, ophalen voor verificatie.
 * Alleen aanroepbaar met CONVEX_AUTH_ADAPTER_SECRET (vanaf Next.js server).
 */
import {
  customMutation,
  customQuery,
} from "convex-helpers/server/customFunctions";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

function checkSecret(secret: string) {
  const envSecret = process.env.CONVEX_AUTH_ADAPTER_SECRET;
  
  if (envSecret === undefined || envSecret.trim() === "") {
    throw new Error(
      "Missing CONVEX_AUTH_ADAPTER_SECRET Convex environment variable"
    );
  }
  
  // Normaliseer beide secrets: verwijder alle whitespace (spaties, tabs, newlines, etc.)
  const normalizeSecret = (s: string): string => {
    return s
      .replace(/\r\n/g, "") // Windows newlines
      .replace(/\r/g, "") // Mac newlines
      .replace(/\n/g, "") // Unix newlines
      .replace(/\t/g, "") // Tabs
      .replace(/\s+/g, "") // Alle overige whitespace
      .trim();
  };
  
  const normalizedReceived = normalizeSecret(secret);
  const normalizedEnv = normalizeSecret(envSecret);

  if (normalizedReceived !== normalizedEnv) {
    throw new Error("Credentials API called without correct secret value");
  }
}

const withSecretQuery = customQuery(query, {
  args: { secret: v.string(), email: v.string() },
  input: async (_ctx, args) => {
    // Gebruik dezelfde checkSecret functie die alle whitespace normaliseert
    checkSecret(args.secret);
    // Return alleen email, secret wordt verwijderd
    return { ctx: {}, args: { email: args.email } };
  },
});

const withSecretMutation = customMutation(mutation, {
  args: {
    secret: v.string(),
    email: v.string(),
    name: v.string(),
    hashedPassword: v.string(),
  },
  input: async (_ctx, args) => {
    // Gebruik dezelfde checkSecret functie die alle whitespace normaliseert
    checkSecret(args.secret);
    // Return alle args behalve secret
    const { secret: _, ...rest } = args;
    return { ctx: {}, args: rest };
  },
});

/** Maak een gebruiker aan met e-mail, naam en gehasht wachtwoord (voor registratie). */
export const createUserWithPassword = withSecretMutation({
  args: {},
  handler: async (ctx, { email, name, hashedPassword }) => {
    const emailLower = email.toLowerCase().trim();
    
    // Check of email al bestaat in credentials tabel
    const existingCred = await ctx.db
      .query("credentials")
      .withIndex("email", (q) => q.eq("email", emailLower))
      .unique();
    
    // Check of email al bestaat in users tabel
    const existingUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", emailLower))
      .unique();
    
    // Als er een orphaned credential is (zonder user), verwijder die eerst
    if (existingCred && !existingUser) {
      await ctx.db.delete(existingCred._id);
    }
    
    // Als er een orphaned user is (zonder credential), verwijder die eerst
    if (existingUser && !existingCred) {
      await ctx.db.delete(existingUser._id);
    }
    
    // Als beide bestaan, dan is het emailadres echt in gebruik
    if (existingCred && existingUser) {
      throw new Error("Dit e-mailadres is al in gebruik");
    }
    
    // Maak nieuwe user en credential aan
    const userId = await ctx.db.insert("users", {
      email: emailLower,
      name: name.trim(),
    });
    await ctx.db.insert("credentials", {
      userId,
      email: emailLower,
      hashedPassword,
    });
    return userId;
  },
});

// ============================================================================
// WACHTWOORD RESET
// ============================================================================

/** Maak een reset-token aan voor een gebruiker (server-side, via secret) */
export const createPasswordResetToken = mutation({
  args: {
    secret: v.string(),
    email: v.string(),
    token: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    checkSecret(args.secret);
    const emailLower = args.email.toLowerCase().trim();

    // Zoek credentials
    const cred = await ctx.db
      .query("credentials")
      .withIndex("email", (q) => q.eq("email", emailLower))
      .unique();
    if (!cred) return null;

    // Verwijder oude tokens voor deze user
    const oldTokens = await ctx.db
      .query("passwordResetTokens")
      .filter((q) => q.eq(q.field("userId"), cred.userId))
      .collect();
    for (const t of oldTokens) {
      await ctx.db.delete(t._id);
    }

    // Sla nieuwe token op
    await ctx.db.insert("passwordResetTokens", {
      userId: cred.userId,
      token: args.token,
      expiresAt: args.expiresAt,
    });

    return { userId: cred.userId };
  },
});

/** Reset het wachtwoord met een geldig token (server-side, via secret) */
export const resetPassword = mutation({
  args: {
    secret: v.string(),
    token: v.string(),
    hashedPassword: v.string(),
  },
  handler: async (ctx, args) => {
    checkSecret(args.secret);

    const resetToken = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!resetToken || resetToken.expiresAt < Date.now()) {
      throw new Error("Token is ongeldig of verlopen");
    }

    // Update wachtwoord in credentials
    const cred = await ctx.db
      .query("credentials")
      .filter((q) => q.eq(q.field("userId"), resetToken.userId))
      .first();

    if (!cred) {
      throw new Error("Gebruiker niet gevonden");
    }

    await ctx.db.patch(cred._id, { hashedPassword: args.hashedPassword });

    // Verwijder token
    await ctx.db.delete(resetToken._id);

    return { success: true };
  },
});

/** Wijzig wachtwoord voor een ingelogde gebruiker (server-side, via secret + userId) */
export const changePassword = mutation({
  args: {
    secret: v.string(),
    userId: v.string(),
    hashedPassword: v.string(),
  },
  handler: async (ctx, args) => {
    checkSecret(args.secret);
    const cred = await ctx.db
      .query("credentials")
      .filter((q) => q.eq(q.field("userId"), args.userId as any))
      .first();
    if (!cred) throw new Error("Gebruiker niet gevonden");
    await ctx.db.patch(cred._id, { hashedPassword: args.hashedPassword });
    return { success: true };
  },
});

/** Haal credentials op voor wachtwoordcontrole (alleen server-side). */
export const getCredentialsByEmail = withSecretQuery({
  args: {},
  handler: async (ctx, { email }) => {
    const cred = await ctx.db
      .query("credentials")
      .withIndex("email", (q) => q.eq("email", email.toLowerCase().trim()))
      .unique();
    if (!cred) return null;
    const user = await ctx.db.get(cred.userId);
    if (!user) return null;
    return {
      userId: cred.userId,
      hashedPassword: cred.hashedPassword,
      email: user.email,
      name: user.name,
    };
  },
});
