#!/usr/bin/env node
/**
 * Zet CONVEX_AUTH_ADAPTER_SECRET automatisch in .env.local EN in Convex.
 * Geen handmatig kopiëren meer – één commando doet beide.
 *
 * Gebruik: node scripts/setup-adapter-secret.mjs
 */
import { randomBytes } from "crypto";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const envPath = resolve(root, ".env.local");

const secret = randomBytes(32)
  .toString("base64")
  .replace(/[/+=]/g, (c) => ({ "/": "_", "+": "-", "=": "" }[c]));

// 1. Update .env.local
let content = "";
if (existsSync(envPath)) {
  content = readFileSync(envPath, "utf-8");
  const lines = content.split("\n");
  const key = "CONVEX_AUTH_ADAPTER_SECRET";
  const newLine = `${key}=${secret}`;
  let found = false;
  const newLines = lines.map((line) => {
    if (line.startsWith(key + "=") || line.trim().startsWith(key + "=")) {
      found = true;
      return newLine;
    }
    return line;
  });
  if (!found) {
    newLines.push("");
    newLines.push(`# Convex auth adapter (gezet door setup-adapter-secret.mjs)`);
    newLines.push(newLine);
  }
  content = newLines.join("\n");
} else {
  content = `# Convex auth adapter
CONVEX_AUTH_ADAPTER_SECRET=${secret}
`;
}

writeFileSync(envPath, content);
console.log("✅ CONVEX_AUTH_ADAPTER_SECRET bijgewerkt in .env.local");

// 2. Zet in Convex
try {
  execSync(`npx convex env set CONVEX_AUTH_ADAPTER_SECRET "${secret}"`, {
    cwd: root,
    stdio: "inherit",
  });
  console.log("✅ CONVEX_AUTH_ADAPTER_SECRET gezet in Convex");
} catch (e) {
  console.error("\n❌ Convex env set mislukt. Zorg dat:");
  console.error("   - npx convex dev draait in een andere terminal, OF");
  console.error("   - je bent ingelogd: npx convex login");
  console.error("\nDe waarde staat wel al in .env.local. Voer daarna handmatig uit:");
  console.error(`   npx convex env set CONVEX_AUTH_ADAPTER_SECRET "${secret}"`);
  process.exit(1);
}

console.log("\n✅ Klaar. Herstart de dev server (Ctrl+C, dan npm run dev).\n");
