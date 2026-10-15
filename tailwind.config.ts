import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0E0E12',
        paper: '#FFFFFF',
        wall: '#F2F1F6',
        violet: { DEFAULT: '#4B2AEF', dark: '#3A1FCB', wash: '#EDE9FE' },
        rose: '#F6D9E4',
        moss: '#1F7A5C',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      boxShadow: { card: '0 1px 2px rgba(14,14,18,.06), 0 8px 24px -12px rgba(14,14,18,.18)' },
    },
  },
  plugins: [],
} satisfies Config
