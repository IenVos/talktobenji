#!/usr/bin/env node
/**
 * Genereert een ronde favicon met donkere achtergrond en het Benji-logo.
 * Run: node scripts/generate-favicon.js
 * Vereist: sharp (devDependency)
 */
const path = require("path");
const fs = require("fs");

const logoPath = path.join(__dirname, "..", "public", "images", "benji-logo-2.png");
const outDir = path.join(__dirname, "..", "public");

const DARK_BG = "#262f42"; // primary-950, donkere achtergrond
const SIZE = 512;
const LOGO_SIZE = 300;
const OFFSET = (SIZE - LOGO_SIZE) / 2;

if (!fs.existsSync(logoPath)) {
  console.warn("public/images/benji-logo-2.png niet gevonden; favicon niet gegenereerd.");
  process.exit(0);
}

let sharp;
try {
  sharp = require("sharp");
} catch {
  console.warn("Installeer sharp: npm install sharp --save-dev");
  process.exit(0);
}

const circleSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
  <circle cx="${SIZE/2}" cy="${SIZE/2}" r="${SIZE/2}" fill="${DARK_BG}"/>
</svg>`;

async function run() {
  const logoResized = await sharp(logoPath)
    .resize(LOGO_SIZE, LOGO_SIZE)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data } = logoResized;
  const whiteLogo = Buffer.alloc(data.length);
  const LUMINANCE_THRESHOLD = 60;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    const luminance = (r + g + b) / 3;
    const isLogo = luminance > LUMINANCE_THRESHOLD && a > 30;
    whiteLogo[i] = 255;
    whiteLogo[i + 1] = 255;
    whiteLogo[i + 2] = 255;
    whiteLogo[i + 3] = isLogo ? 255 : 0;
  }

  const logo = await sharp(whiteLogo, {
    raw: { width: LOGO_SIZE, height: LOGO_SIZE, channels: 4 },
  })
    .png()
    .toBuffer();

  const base = await sharp(Buffer.from(circleSvg))
    .png()
    .toBuffer();

  const favicon512 = await sharp(base)
    .composite([{ input: logo, left: Math.round(OFFSET), top: Math.round(OFFSET) }])
    .png()
    .toBuffer();

  await sharp(favicon512)
    .resize(512, 512)
    .png()
    .toFile(path.join(outDir, "favicon.png"));
  console.log("Gemaakt: public/favicon.png (512x512, rond, donkere achtergrond)");

  await sharp(favicon512)
    .resize(192, 192)
    .png()
    .toFile(path.join(outDir, "icon-192.png"));
  console.log("Gemaakt: public/icon-192.png");

  await sharp(favicon512)
    .resize(32, 32)
    .png()
    .toFile(path.join(outDir, "favicon-32.png"));
  console.log("Gemaakt: public/favicon-32.png");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
