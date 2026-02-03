// PWA uit – terser crash op Vercel. Manifest werkt wel (Add to Home Screen).
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: true,
  register: true,
  skipWaiting: true,
  cacheOnFrontendNav: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  distDir: ".next",
  async redirects() {
    return [
      { source: "/favicon.ico", destination: "/icon.svg", permanent: false },
    ];
  },
};

module.exports = withPWA(nextConfig);
