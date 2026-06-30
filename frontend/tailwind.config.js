/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0EA5E9',
        secondary: '#10B981',
        accent: '#F59E0B',
        danger: '#EF4444',
        bg: '#F8FAFC',
        navy: '#0F172A',
        ink: '#0F172A',
        border: '#E2E8F0',
        severity: {
          low: '#10B981',
          medium: '#F59E0B',
          high: '#FB923C',
          critical: '#EF4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '10px',
        lg: '16px',
        xl: '20px',
      },
      boxShadow: {
        micro: '0 1px 3px rgba(15,23,42,0.08)',
        card: '0 4px 16px rgba(15,23,42,0.06)',
        glow: '0 0 24px rgba(14,165,233,0.35)',
        glowGreen: '0 0 24px rgba(16,185,129,0.35)',
        glowGold: '0 0 24px rgba(245,158,11,0.35)',
      },
      spacing: {
        '4.5': '18px',
      },
      keyframes: {
        meshShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-14px) rotate(6deg)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(14,165,233,0.45)' },
          '50%': { boxShadow: '0 0 0 10px rgba(14,165,233,0)' },
        },
        countUp: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-700px 0' },
          '100%': { backgroundPosition: '700px 0' },
        },
      },
      animation: {
        meshShift: 'meshShift 12s ease-in-out infinite',
        floatSlow: 'floatSlow 6s ease-in-out infinite',
        pulseGlow: 'pulseGlow 2.2s ease-in-out infinite',
        countUp: 'countUp 0.4s ease-out',
        marquee: 'marquee 28s linear infinite',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
};

