#!/usr/bin/env node
/**
 * Generates PWA icons (192x192, 512x512) from Benji logo.
 * Run: node scripts/generate-pwa-icons.js
 * Requires: npm install sharp --save-dev
 */
const path = require("path");
const fs = require("fs");

const inputPath = path.join(__dirname, "..", "public", "images", "benji-logo-2.png");
const outDir = path.join(__dirname, "..", "public");
const BG_COLOR = "#38465e"; // primary-900

if (!fs.existsSync(inputPath)) {
  console.warn("images/benji-logo-2.png not found; skipping icon generation.");
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
    const padding = Math.round(size * 0.15);
    const logoSize = size - padding * 2;

    const logo = await sharp(inputPath)
      .resize(logoSize, logoSize)
      .png()
      .toBuffer();

    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: BG_COLOR,
      },
    })
      .composite([{ input: logo, top: padding, left: padding }])
      .png()
      .toFile(path.join(outDir, `icon-${size}.png`));

    console.log(`Created public/icon-${size}.png`);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
