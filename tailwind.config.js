/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./frontend/index.html",
    "./frontend/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        orange: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#FF6B35',
          700: '#ea580c',
          800: '#c2410c',
          900: '#9a3412',
        },
        purple: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d946ef',
          400: '#c026d3',
          500: '#9D4EDD',
          600: '#7e22ce',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#3f0f5c',
        },
        spotify: {
          black: 'var(--spotify-black)',
          dark: 'var(--spotify-dark)',
          dark2: 'var(--spotify-dark2)',
          dark3: 'var(--spotify-dark3)',
          gray: 'var(--spotify-gray)',
          text: 'var(--spotify-text)',
          green: '#1db954',
          greenHover: '#1ed760',
        },
      },
    },
  },
  plugins: [],
}
