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
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          850: '#18202e',
          900: '#111827',
          950: '#0a0f1a',
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
    },
  },
  plugins: [],
}
