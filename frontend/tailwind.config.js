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
        brand: {
          parchment: '#F8F5F0',
          navy: '#0F172A',
          oxblood: '#A63D33',
          teal: '#007A7C',
          charcoal: '#1E293B',
          slate: '#64748B',
        },
        suit: {
          green: '#22C55E',
          yellow: '#EAB308',
          purple: '#A855F7',
          black: '#1E293B',
        },
        // Deprecated names for backward compatibility during transition
        wood: '#0F172A', // Map to brand navy
        parchment: '#F8F5F0', // Map to brand parchment
        ink: '#1E293B', // Map to brand charcoal
        accent: {
          red: '#A63D33', // Map to oxblood
        },
        highlight: {
          gold: '#EAB308', // Map to suit yellow
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      borderRadius: {
        'skull': '12px',
      }
    },
  },
  plugins: [
    require("tailwindcss-animate")
  ],
}
