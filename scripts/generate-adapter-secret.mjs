#!/usr/bin/env node
/**
 * Genereert een nieuwe CONVEX_AUTH_ADAPTER_SECRET.
 * Gebruik: node scripts/generate-adapter-secret.mjs
 *
 * 1) Plak de eerste regel in .env.local (vervang de oude CONVEX_AUTH_ADAPTER_SECRET).
 * 2) Voer de tweede regel uit in de terminal (of plak de waarde in Convex Dashboard).
 */
import { randomBytes } from "crypto";

const secret = randomBytes(32).toString("base64").replace(/[/+=]/g, (c) =>
  ({ "/": "_", "+": "-", "=": "" }[c])
);

console.log("");
console.log("1) Plak onderstaande regel in .env.local (vervang de oude CONVEX_AUTH_ADAPTER_SECRET):");
console.log("");
console.log(`CONVEX_AUTH_ADAPTER_SECRET=${secret}`);
console.log("");
console.log("2) Zet in Convex via de terminal (kopieer en plak de HELE regel hieronder):");
console.log("   Niet handmatig in het Convex-dashboard plakken – dan kan de waarde anders worden.");
console.log("");
console.log(`npx convex env set CONVEX_AUTH_ADAPTER_SECRET "${secret}"`);
console.log("");
