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
import { internal } from "./_generated/api";

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
    // Maak automatisch een 7-daagse trial subscription aan
    const now = Date.now();
    await ctx.db.insert("userSubscriptions", {
      userId: userId.toString(),
      email: emailLower,
      subscriptionType: "trial",
      status: "active",
      startedAt: now,
      expiresAt: now + 7 * 24 * 60 * 60 * 1000,
      updatedAt: now,
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

    await ctx.db.patch(cred._id, { hashedPassword: args.hashedPassword, passwordChangedAt: Date.now() });

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
    await ctx.db.patch(cred._id, { hashedPassword: args.hashedPassword, passwordChangedAt: Date.now() });
    return { success: true };
  },
});

/** Wijzig naam voor een ingelogde gebruiker (server-side, via secret + userId) */
export const changeName = mutation({
  args: {
    secret: v.string(),
    userId: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    checkSecret(args.secret);
    const trimmed = args.name.trim();
    if (!trimmed) throw new Error("Naam mag niet leeg zijn");
    const cred = await ctx.db
      .query("credentials")
      .filter((q) => q.eq(q.field("userId"), args.userId as any))
      .first();
    if (!cred) throw new Error("Gebruiker niet gevonden");
    await ctx.db.patch(cred.userId, { name: trimmed });
    return { success: true };
  },
});

/** Wijzig e-mailadres voor een ingelogde gebruiker (server-side, via secret + userId) */
export const changeEmail = mutation({
  args: {
    secret: v.string(),
    userId: v.string(),
    newEmail: v.string(),
  },
  handler: async (ctx, args) => {
    checkSecret(args.secret);
    const newEmailLower = args.newEmail.toLowerCase().trim();

    // Check of nieuw e-mailadres al in gebruik is
    const existing = await ctx.db
      .query("credentials")
      .withIndex("email", (q) => q.eq("email", newEmailLower))
      .unique();
    if (existing) throw new Error("Dit e-mailadres is al in gebruik");

    // Update credentials
    const cred = await ctx.db
      .query("credentials")
      .filter((q) => q.eq(q.field("userId"), args.userId as any))
      .first();
    if (!cred) throw new Error("Gebruiker niet gevonden");
    await ctx.db.patch(cred._id, { email: newEmailLower });

    // Update users
    const user = await ctx.db.get(cred.userId);
    if (user) await ctx.db.patch(cred.userId, { email: newEmailLower });

    // Update userSubscriptions
    const subs = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const sub of subs) {
      await ctx.db.patch(sub._id, { email: newEmailLower });
    }

    return { success: true };
  },
});

/** Zoek bestaande gebruiker op e-mail of maak nieuwe aan voor OAuth (Google). */
export const findOrCreateOAuthUser = mutation({
  args: {
    secret: v.string(),
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    checkSecret(args.secret);
    const emailLower = args.email.toLowerCase().trim();
    const displayName = args.name.trim() || emailLower.split("@")[0];

    // Bestaande gebruiker opzoeken
    const existingUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", emailLower))
      .unique();

    if (existingUser) {
      // Markeer als geverifieerd als dat nog niet het geval is
      if (!existingUser.emailVerified) {
        await ctx.db.patch(existingUser._id, { emailVerified: Date.now() });
      }
      return { userId: existingUser._id.toString(), isNew: false };
    }

    // Nieuwe gebruiker aanmaken
    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      email: emailLower,
      name: displayName,
      emailVerified: now,
    });

    // 7-daagse trial aanmaken
    await ctx.db.insert("userSubscriptions", {
      userId: userId.toString(),
      email: emailLower,
      subscriptionType: "trial",
      status: "active",
      startedAt: now,
      expiresAt: now + 7 * 24 * 60 * 60 * 1000,
      updatedAt: now,
    });

    // Welkomstmail sturen
    await ctx.scheduler.runAfter(0, internal.emails.sendWelcomeEmail, {
      email: emailLower,
      name: displayName,
    });

    return { userId: userId.toString(), isNew: true };
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
      emailVerified: user.emailVerified ?? null,
    };
  },
});

/** Haal passwordChangedAt op voor sessievalidatie. */
export const getPasswordChangedAt = query({
  args: { secret: v.string(), email: v.string() },
  handler: async (ctx, args) => {
    checkSecret(args.secret);
    const cred = await ctx.db
      .query("credentials")
      .withIndex("email", (q) => q.eq("email", args.email.toLowerCase().trim()))
      .unique();
    return cred?.passwordChangedAt ?? null;
  },
});

// ============================================================================
// E-MAIL VERIFICATIE
// ============================================================================

/** Sla een OTP-token op voor e-mailverificatie (vervangt eventueel bestaande). */
export const createEmailVerificationToken = mutation({
  args: {
    secret: v.string(),
    userId: v.id("users"),
    email: v.string(),
    hashedOtp: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    checkSecret(args.secret);
    const emailLower = args.email.toLowerCase().trim();

    // Verwijder bestaande tokens voor dit e-mailadres
    const existing = await ctx.db
      .query("emailVerificationTokens")
      .withIndex("by_email", (q) => q.eq("email", emailLower))
      .collect();
    for (const t of existing) await ctx.db.delete(t._id);

    await ctx.db.insert("emailVerificationTokens", {
      userId: args.userId,
      email: emailLower,
      hashedOtp: args.hashedOtp,
      expiresAt: args.expiresAt,
    });

    return { success: true };
  },
});

/** Controleer OTP en markeer gebruiker als geverifieerd. */
export const verifyEmailOtp = mutation({
  args: {
    secret: v.string(),
    email: v.string(),
    hashedOtp: v.string(),
  },
  handler: async (ctx, args) => {
    checkSecret(args.secret);
    const emailLower = args.email.toLowerCase().trim();

    const token = await ctx.db
      .query("emailVerificationTokens")
      .withIndex("by_email", (q) => q.eq("email", emailLower))
      .first();

    if (!token) throw new Error("Code niet gevonden of verlopen");
    if (token.expiresAt < Date.now()) {
      await ctx.db.delete(token._id);
      throw new Error("Code is verlopen");
    }
    if (token.hashedOtp !== args.hashedOtp) {
      throw new Error("Code is onjuist");
    }

    // Markeer gebruiker als geverifieerd
    await ctx.db.patch(token.userId, { emailVerified: Date.now() });

    // Verwijder token
    await ctx.db.delete(token._id);

    // Stuur welkomstmail (fire-and-forget, mag niet blokkeren)
    const user = await ctx.db.get(token.userId);
    if (user?.email) {
      await ctx.scheduler.runAfter(0, internal.emails.sendWelcomeEmail, {
        email: user.email,
        name: user.name ?? user.email.split("@")[0],
      });
    }

    return { success: true };
  },
});
