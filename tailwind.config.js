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
          50: '#f8feff',
          100: '#e8f6f8',
          200: '#d4ecf0',
          300: '#b4cfd3',
          400: '#8fb8be',
          500: '#b4cfd3',
          600: '#7a9ca3',
          700: '#51808f',
          800: '#456d78',
          900: '#3a5c66',
          950: '#2a454d',
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

