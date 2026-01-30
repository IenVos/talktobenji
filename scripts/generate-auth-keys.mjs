#!/usr/bin/env node
/**
 * Genereert CONVEX_AUTH_PRIVATE_KEY en JWKS voor NextAuth + Convex.
 * Gebruik: node scripts/generate-auth-keys.mjs
 *
 * Output:
 * 1) Private key (plak in .env.local als CONVEX_AUTH_PRIVATE_KEY, tussen dubbele aanhalingstekens)
 * 2) JWKS JSON (plak in Convex Dashboard → Environment Variables → JWKS)
 */

import { exportJWK, exportPKCS8, generateKeyPair } from "jose";

const { privateKey, publicKey } = await generateKeyPair("RS256", {
  extractable: true,
});
const privatePem = await exportPKCS8(privateKey);
const publicJwk = await exportJWK(publicKey);
const jwks = JSON.stringify({
  keys: [{ use: "sig", ...publicJwk }],
});

console.log("--- Kopieer onderstaande private key naar .env.local als CONVEX_AUTH_PRIVATE_KEY ---\n");
console.log(privatePem);
console.log("\n--- Kopieer onderstaande JSON naar Convex Dashboard als JWKS ---\n");
console.log(jwks);
