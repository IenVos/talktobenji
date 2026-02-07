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
  
  // Debug logging - uitgebreid
  console.log("[Convex credentials] Debug checkSecret:");
  console.log("  - Received secret length (original):", secret?.length || 0);
  console.log("  - Received secret length (normalized):", normalizedReceived.length);
  console.log("  - Env secret length (original):", envSecret.length);
  console.log("  - Env secret length (normalized):", normalizedEnv.length);
  
  // Log de gehele secret als base64 om encoding problemen te zien
  try {
    const receivedBase64 = Buffer.from(secret, 'utf8').toString('base64');
    const envBase64 = Buffer.from(envSecret, 'utf8').toString('base64');
    console.log("  - Received (base64):", receivedBase64);
    console.log("  - Env (base64):", envBase64);
  } catch (e) {
    console.log("  - Could not encode to base64:", e);
  }
  
  // Log character codes voor alle karakters
  console.log("  - Received char codes (first 10):", Array.from(secret.substring(0, 10)).map(c => c.charCodeAt(0)).join(','));
  console.log("  - Env char codes (first 10):", Array.from(envSecret.substring(0, 10)).map(c => c.charCodeAt(0)).join(','));
  
  // Vergelijk de genormaliseerde versies
  if (normalizedReceived !== normalizedEnv) {
    // Log karakter-voor-karakter vergelijking
    console.error("[Convex credentials] Secret mismatch after normalization:");
    console.error("  - Received (first 20):", normalizedReceived.substring(0, 20));
    console.error("  - Env (first 20):", normalizedEnv.substring(0, 20));
    console.error("  - Received (last 10):", normalizedReceived.substring(normalizedReceived.length - 10));
    console.error("  - Env (last 10):", normalizedEnv.substring(normalizedEnv.length - 10));
    
    // Log character codes voor eerste verschillend karakter
    const minLength = Math.min(normalizedReceived.length, normalizedEnv.length);
    let foundDifference = false;
    for (let i = 0; i < minLength; i++) {
      if (normalizedReceived[i] !== normalizedEnv[i]) {
        console.error(`  - First difference at position ${i}:`);
        console.error(`    Received: '${normalizedReceived[i]}' (char code: ${normalizedReceived.charCodeAt(i)})`);
        console.error(`    Env: '${normalizedEnv[i]}' (char code: ${normalizedEnv.charCodeAt(i)})`);
        // Log context rond het verschil
        const start = Math.max(0, i - 5);
        const end = Math.min(minLength, i + 5);
        console.error(`    Context received: "${normalizedReceived.substring(start, end)}"`);
        console.error(`    Context env: "${normalizedEnv.substring(start, end)}"`);
        foundDifference = true;
        break;
      }
    }
    
    if (!foundDifference && normalizedReceived.length !== normalizedEnv.length) {
      console.error(`  - Length difference: received=${normalizedReceived.length}, env=${normalizedEnv.length}`);
    }
    
    throw new Error("Credentials API called without correct secret value");
  }
  console.log("[Convex credentials] Secret check passed ✓");
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
