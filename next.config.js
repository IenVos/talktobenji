// PWA tijdelijk uit: Terser "Unexpected early exit" tijdens build (Next + @ducanh2912/next-pwa).
// Zet PWA_ENABLED=1 om PWA-build te proberen (kan op Vercel wel lukken).
const pwaEnabled = process.env.PWA_ENABLED === "1";

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development" || !pwaEnabled,
  register: true,
  skipWaiting: true,
  cacheOnFrontendNav: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  distDir: ".next",
  async redirects() {
    return [{ source: "/favicon.ico", destination: "/icon-192.png", permanent: false }];
  },
};

module.exports = withPWA(nextConfig);
