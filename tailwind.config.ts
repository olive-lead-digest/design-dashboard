import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#020617',     // slate-950, deep background
        secondary: '#14B8A6',   // vibrant teal
        accent: '#F59E0B',      // amber
        success: '#10B981',
        warning: '#EF4444',
        surface: '#0f172a',     // slate-900, base for cards
        surfaceHover: '#1e293b', // slate-800
        ink: '#F8FAFC',         // slate-50 text
        inkMuted: '#94A3B8',    // slate-400 text
        border: '#1e293b',      // slate-800 borders
      },
      fontFamily: {
        heading: ['var(--font-poppins)', 'sans-serif'],
        body: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-fira)', 'monospace'],
      },
      boxShadow: {
        card: '0 4px 20px -2px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        lift: '0 12px 30px -5px rgba(20, 184, 166, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        glow: '0 0 15px -3px rgba(20, 184, 166, 0.4)',
        glowAccent: '0 0 15px -3px rgba(245, 158, 11, 0.4)',
      },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
        pulseSoft: 'pulseSoft 3s ease-in-out infinite',
        float: 'float 5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
export default config;
