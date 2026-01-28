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
          50: '#fbfaf8',
          100: '#f6f0e8',
          200: '#ecdfcf',
          300: '#dcc4aa',
          400: '#c9a786',
          500: '#f4b975',
          600: '#d99f62',
          700: '#b98352',
          800: '#976a45',
          900: '#7b553a',
          950: '#4c3425',
        },
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
    },
  },
  plugins: [],
}

