/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wood: 'var(--bg-wood)',
        parchment: 'var(--bg-parchment)',
        ink: 'var(--text-ink)',
        accent: {
          red: 'var(--accent-red)',
        },
        highlight: {
          gold: 'var(--highlight-gold)',
        },
        suit: {
          green: 'var(--suit-green)',
          purple: 'var(--suit-purple)',
          yellow: 'var(--suit-yellow)',
          black: 'var(--suit-black)',
        }
      },
      fontFamily: {
        serif: ['serif'], // Ensure serif defaults to browser serif or specify a font if needed
      }
    },
  },
  plugins: [
    require("tailwindcss-animate")
  ],
}
