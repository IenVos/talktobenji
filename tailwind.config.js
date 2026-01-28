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
          50: '#faf6f4',
          100: '#e8f0f0',
          200: '#d0e2e1',
          300: '#a8cac9',
          400: '#7fa9a8',
          500: '#749e9d',
          600: '#5d8584',
          700: '#4c6c6b',
          800: '#3f5857',
          900: '#354948',
          950: '#1e2c2b',
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

