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
  const a = secret.trim();
  const b = envSecret.trim();
  if (a !== b) {
    console.error(
      "[Convex credentials] Secret mismatch: received length",
      a.length,
      ", env length",
      b.length
    );
    throw new Error("Credentials API called without correct secret value");
  }
}

const withSecretQuery = customQuery(query, {
  args: { secret: v.string(), email: v.string() },
  input: async (_ctx, args) => {
    checkSecret(args.secret);
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
    checkSecret(args.secret);
    const { secret: _, ...rest } = args;
    return { ctx: {}, args: rest };
  },
});

/** Maak een gebruiker aan met e-mail, naam en gehasht wachtwoord (voor registratie). */
export const createUserWithPassword = withSecretMutation({
  args: {},
  handler: async (ctx, { email, name, hashedPassword }) => {
    const existing = await ctx.db
      .query("credentials")
      .withIndex("email", (q) => q.eq("email", email.toLowerCase().trim()))
      .unique();
    if (existing) {
      throw new Error("Dit e-mailadres is al in gebruik");
    }
    const userId = await ctx.db.insert("users", {
      email: email.toLowerCase().trim(),
      name: name.trim(),
    });
    await ctx.db.insert("credentials", {
      userId,
      email: email.toLowerCase().trim(),
      hashedPassword,
    });
    return userId;
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
