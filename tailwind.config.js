/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0d14',
        surface: {
          DEFAULT: '#111726',
          card: 'rgba(17, 23, 38, 0.85)',
          hover: '#192237',
          border: 'rgba(255, 255, 255, 0.08)',
        },
        gold: {
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          gradient: 'linear-gradient(135deg, #FDE68A 0%, #F59E0B 50%, #B45309 100%)',
        },
        emerald: {
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-wheel': 'spin-wheel 6s cubic-bezier(0.15, 0.9, 0.2, 1) forwards',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        'spin-wheel': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(2160deg)' },
        },
        'glow': {
          '0%': { boxShadow: '0 0 15px rgba(245, 158, 11, 0.2)' },
          '100%': { boxShadow: '0 0 30px rgba(245, 158, 11, 0.6)' },
        },
      },
    },
  },
  plugins: [],
};
