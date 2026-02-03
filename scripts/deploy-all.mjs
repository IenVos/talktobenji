#!/usr/bin/env node
/**
 * Deploy alles in één keer: GitHub → Vercel (auto) + Convex
 * 
 * Gebruik: npm run deploy
 * Of met commit message: npm run deploy -- "mijn wijzigingen"
 */

import { execSync } from "child_process";
import { existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function run(cmd, opts = {}) {
  console.log(`\n▶ ${cmd}\n`);
  execSync(cmd, { stdio: "inherit", cwd: root, ...opts });
}

// Commit message: eerste arg na -- of standaard
const args = process.argv.slice(2);
const msg = args[0] || "Deploy";

console.log("\n🚀 Deploy: GitHub + Vercel + Convex\n");

// 1. Git: add, commit, push (als er wijzigingen zijn)
try {
  const status = execSync("git status --porcelain", { cwd: root, encoding: "utf-8" });
  if (status.trim()) {
    run("git add .");
    run(`git commit -m "${msg.replace(/"/g, '\\"')}"`);
    run("git push origin main");
    console.log("\n✓ Gepusht naar GitHub → Vercel bouwt automatisch\n");
  } else {
    console.log("Geen wijzigingen om te committen.\n");
  }
} catch (e) {
  console.log("Git stap overgeslagen of mislukt. Convex deployen...\n");
}

// 3. Convex deploy
if (existsSync(resolve(root, ".env.local"))) {
  run("npm run deploy:convex");
  console.log("\n✓ Convex gedeployed\n");
} else {
  console.log("⚠ .env.local niet gevonden – Convex deploy overgeslagen.\n");
}

console.log("✅ Klaar! Check Vercel Dashboard voor de build.\n");
