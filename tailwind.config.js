// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-bg': '#F8FAFC',
        'secondary-bg': '#FFFFFF',
        'navy-blue': '#003366',
        'slate-gray': '#64748B',
        'soft-gold': '#F59E0B',
        'success-green': '#059669',
        'warning-orange': '#F97316',
        'error-red': '#DC2626',
        'light-border': '#E2E8F0',
        'hover-state': '#F1F5F9',
        'muted-text': '#94A3B8',
        'dark-text': '#1E293B',
      },
      animation: {
        'fadeIn': 'fadeIn 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
}