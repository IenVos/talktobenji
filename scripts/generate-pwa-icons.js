#!/usr/bin/env node
/**
 * Generates PWA icons (192x192, 512x512) from public/vibetracker-logo.png.
 * Run: node scripts/generate-pwa-icons.js
 * Requires: npm install sharp --save-dev
 */
const path = require("path");
const fs = require("fs");

const inputPath = path.join(__dirname, "..", "public", "vibetracker-logo.png");
const outDir = path.join(__dirname, "..", "public");

if (!fs.existsSync(inputPath)) {
  console.warn("vibetracker-logo.png not found; skipping icon generation.");
  process.exit(0);
}

let sharp;
try {
  sharp = require("sharp");
} catch {
  console.warn("Install sharp: npm install sharp --save-dev");
  process.exit(0);
}

async function run() {
  const sizes = [192, 512];
  for (const size of sizes) {
    await sharp(inputPath)
      .resize(size, size)
      .png()
      .toFile(path.join(outDir, `icon-${size}.png`));
    console.log(`Created public/icon-${size}.png`);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
