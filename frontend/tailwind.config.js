/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          50: '#f5f5f7',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#3a3a45',
          700: '#2a2a35',
          800: '#1a2d44',
          850: '#18202e',
          900: '#132032',
          950: '#0d1521',
        },
        // Brand colors from Content Hub / Karalisweb design system
        brand: {
          teal: '#0d9488',      // Titoli app (Content Hub, Time Report)
          'teal-dark': '#0f766e',
          orange: '#f97316',    // Accent, badge Ksc
          'orange-dark': '#ea580c',
        },
        // Gradient button colors
        gradient: {
          start: '#fb923c',     // orange-400
          end: '#f97316',       // orange-500
        },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(to right, #fb923c, #f97316)',
        'gradient-brand-hover': 'linear-gradient(to right, #f97316, #ea580c)',
      },
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
