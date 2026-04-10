/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          400: '#818cf8',
          600: '#1e3a8a',
          700: '#1e3a6e',
          800: '#1e2d5a',
          900: '#0f1a3d',
          950: '#080e24',
        },
        brand: {
          DEFAULT: '#1a56db',
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#1a56db',
          700: '#1d4ed8',
          800: '#1e40af',
        },
        amber: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        emerald: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
        rose: {
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
        },
        slate: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        card:  '0 1px 3px 0 rgba(0,0,0,.07), 0 1px 2px -1px rgba(0,0,0,.04)',
        panel: '0 4px 24px -4px rgba(15,23,42,.12), 0 1px 3px rgba(0,0,0,.05)',
        float: '0 20px 60px -10px rgba(15,23,42,.20)',
      },
      animation: {
        'fade-in':     'fadeIn .35s ease both',
        'slide-up':    'slideUp .4s ease both',
        'slide-right': 'slideRight .35s ease both',
        'pulse-slow':  'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: 0 },                      to: { opacity: 1 } },
        slideUp:   { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideRight:{ from: { opacity: 0, transform: 'translateX(-16px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
      },
    },
  },
  plugins: [],
}
