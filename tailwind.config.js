/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f2f5f9',
          100: '#e8ecf4',
          200: '#d4dce9',
          300: '#b8c4d9',
          400: '#9aa9c9',
          500: '#859abd',
          600: '#6d84a8',
          700: '#576b8f',
          800: '#465876',
          900: '#38465e',
          950: '#262f42',
        },
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'fade-in': 'fadeIn 0.35s ease-out forwards',
        // Zachte, rustige binnenkomst voor nudge-kaartjes: infaden + iets omhoog.
        'card-in': 'cardIn 0.6s ease-out both',
        // Chatbubbel: rustig van onderaf infaden i.p.v. hard "poppen". Duidelijk
        // merkbaar traag en zacht (gevoelig onderwerp), maar niet storend lang.
        'bubble-in': 'bubbleIn 0.85s cubic-bezier(0.22, 0.61, 0.36, 1) both',
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        cardIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        bubbleIn: {
          "0%": { opacity: "0", transform: "translateY(14px) scale(0.985)" },
          "60%": { opacity: "1" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        ".text-pretty": { "text-wrap": "pretty" },
        ".text-balance": { "text-wrap": "balance" },
      });
    },
  ],
}

