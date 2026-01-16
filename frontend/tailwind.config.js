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
          400: '#9ca3af',  // più chiaro per leggibilità
          500: '#6b7280',  // più chiaro
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          850: '#18202e',
          900: '#111827',
          950: '#0a0f1a',
        },
      },
    },
  },
  plugins: [],
}
