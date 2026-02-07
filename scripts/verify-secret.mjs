#!/usr/bin/env node
/**
 * Verifieer of CONVEX_AUTH_ADAPTER_SECRET correct is ingesteld
 * Vergelijk de secret in .env.local met de secret in Convex
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const envPath = resolve(projectRoot, ".env.local");

console.log("🔍 Verifieer CONVEX_AUTH_ADAPTER_SECRET...\n");

// Lees .env.local
let envSecret = null;
try {
  const envContent = readFileSync(envPath, "utf8");
  const match = envContent.match(/^CONVEX_AUTH_ADAPTER_SECRET=(.+)$/m);
  if (match) {
    envSecret = match[1].trim();
    console.log("✅ Secret gevonden in .env.local");
    console.log(`   Lengte: ${envSecret.length} karakters`);
    console.log(`   Eerste 15: ${envSecret.substring(0, 15)}...`);
    console.log(`   Laatste 10: ...${envSecret.substring(envSecret.length - 10)}`);
  } else {
    console.log("❌ CONVEX_AUTH_ADAPTER_SECRET niet gevonden in .env.local");
    process.exit(1);
  }
} catch (error) {
  console.log("❌ Kan .env.local niet lezen:", error.message);
  process.exit(1);
}

// Haal secret op uit Convex
let convexSecret = null;
try {
  const output = execSync("npx convex env get CONVEX_AUTH_ADAPTER_SECRET", {
    encoding: "utf8",
    cwd: projectRoot,
  });
  convexSecret = output.trim();
  console.log("\n✅ Secret gevonden in Convex");
  console.log(`   Lengte: ${convexSecret.length} karakters`);
  console.log(`   Eerste 15: ${convexSecret.substring(0, 15)}...`);
  console.log(`   Laatste 10: ...${convexSecret.substring(convexSecret.length - 10)}`);
} catch (error) {
  console.log("\n❌ Kan secret niet ophalen uit Convex:", error.message);
  console.log("   Zorg dat je bent ingelogd: npx convex login");
  process.exit(1);
}

// Vergelijk
console.log("\n📊 Vergelijking:");
console.log(`   Lengtes gelijk: ${envSecret.length === convexSecret.length ? "✅" : "❌"}`);
console.log(`   Inhoud gelijk: ${envSecret === convexSecret ? "✅" : "❌"}`);

if (envSecret !== convexSecret) {
  console.log("\n❌ Secrets zijn NIET identiek!");
  
  // Vind eerste verschil
  const minLength = Math.min(envSecret.length, convexSecret.length);
  for (let i = 0; i < minLength; i++) {
    if (envSecret[i] !== convexSecret[i]) {
      console.log(`\n   Eerste verschil op positie ${i}:`);
      console.log(`   .env.local:     '${envSecret[i]}' (char code: ${envSecret.charCodeAt(i)})`);
      console.log(`   Convex:          '${convexSecret[i]}' (char code: ${convexSecret.charCodeAt(i)})`);
      console.log(`   Context .env:    "${envSecret.substring(Math.max(0, i - 5), i + 5)}"`);
      console.log(`   Context Convex:  "${convexSecret.substring(Math.max(0, i - 5), i + 5)}"`);
      break;
    }
  }
  
  if (envSecret.length !== convexSecret.length) {
    console.log(`\n   Lengte verschil: .env.local=${envSecret.length}, Convex=${convexSecret.length}`);
  }
  
  console.log("\n💡 Oplossing:");
  console.log("   1. Kopieer de secret uit .env.local");
  console.log(`   2. Zet deze in Convex: npx convex env set CONVEX_AUTH_ADAPTER_SECRET "${envSecret}"`);
  process.exit(1);
} else {
  console.log("\n✅ Secrets zijn identiek!");
  console.log("\n💡 Als je nog steeds errors krijgt, kan het zijn dat:");
  console.log("   - De server moet opnieuw gestart worden");
  console.log("   - Er is een encoding probleem bij het doorgeven");
  console.log("   - Check de logs in Convex Dashboard voor meer details");
}
