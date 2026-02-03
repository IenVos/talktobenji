/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
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
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
}

