/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#101928',
          800: '#17243A', // Primary deep navy
          700: '#223450',
          600: '#2f4568',
        },
        slate: {
          DEFAULT: '#64748B',
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        canvas: '#F7F8FA', // Main background
        surface: '#FFFFFF', // Card/sheet surface
        border: {
          subtle: '#E8EBF0',
          DEFAULT: '#E2E8F0',
          dark: '#CBD5E1',
        },
        accent: {
          blue: '#5276A7',
          'blue-light': '#EBF2FA',
          green: '#DFF3E7',
          'green-text': '#166534',
          amber: '#FFF0D6',
          'amber-text': '#9A3412',
          red: '#FCE5E5',
          'red-text': '#991B1B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Geist', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 3px 0 rgba(0, 0, 0, 0.05)',
        'card': '0 2px 4px 0 rgba(23, 36, 58, 0.04), 0 1px 2px 0 rgba(23, 36, 58, 0.02)',
        'dropdown': '0 4px 16px -2px rgba(23, 36, 58, 0.08), 0 2px 6px -1px rgba(23, 36, 58, 0.04)',
      }
    },
  },
  plugins: [],
}
