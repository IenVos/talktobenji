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
console.log("--- Plak in .env.local (vervang de oude regel CONVEX_AUTH_ADAPTER_SECRET) ---");
console.log("");
console.log(`CONVEX_AUTH_ADAPTER_SECRET=${secret}`);
console.log("");
console.log("--- Daarna in Convex zetten: voer deze command uit in de projectmap ---");
console.log("");
console.log(`npx convex env set CONVEX_AUTH_ADAPTER_SECRET "${secret}"`);
console.log("");
