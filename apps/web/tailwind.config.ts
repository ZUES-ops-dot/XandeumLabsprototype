import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Xandeum brand colors from website
        xandeum: {
          // Deep space backgrounds
          950: '#050816',
          900: '#070d23',
          850: '#0b1437',
          800: '#101b47',
          750: '#151f58',
          700: '#1d2663',
          // Accent spectrum
          teal: '#00d4c6',
          cyan: '#41e2ff',
          aqua: '#6cf8ff',
          orange: '#ff9f43',
          gold: '#ffd166',
          amber: '#ffb347',
          magenta: '#d248ff',
          purple: '#8d3bff',
          violet: '#a45bff',
          indigo: '#5b4bff',
          // Card gradients
          card: '#1b1041',
          'card-hover': '#26135c'
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate'
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'xandeum-gradient': 'linear-gradient(135deg, #00d4c6 0%, #41e2ff 45%, #5b4bff 100%)',
        'xandeum-orange': 'linear-gradient(135deg, #ff9f43 0%, #ffd166 100%)',
        'xandeum-purple': 'linear-gradient(135deg, #8d3bff 0%, #d248ff 100%)',
        'hero-pattern': 'linear-gradient(145deg, #050816 0%, #070d23 35%, #0f1c4c 70%, #1b1041 100%)',
        'hero-aurora':
          'radial-gradient(circle at 20% 20%, rgba(141,59,255,0.4), transparent 45%), radial-gradient(circle at 80% 10%, rgba(0,212,198,0.35), transparent 40%), radial-gradient(circle at 50% 80%, rgba(255,159,67,0.2), transparent 40%)',
        'card-sheen': 'linear-gradient(120deg, rgba(255,255,255,0.12), rgba(255,255,255,0))'
      },
      boxShadow: {
        'glow-teal': '0 0 30px rgba(0, 212, 198, 0.35)',
        'glow-orange': '0 0 30px rgba(255, 159, 67, 0.35)',
        'glow-purple': '0 0 30px rgba(141, 59, 255, 0.35)'
      }
    }
  },
  plugins: []
} satisfies Config;
