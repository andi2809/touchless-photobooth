import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        neon: {
          cyan: '#00f0ff',
          pink: '#ff007f',
          magenta: '#ff0055',
          gold: '#ffe600',
          green: '#00ff66',
          purple: '#b026ff',
          blue: '#0070f3',
        },
      },
      fontFamily: {
        mono: ['var(--font-geist-mono)', 'monospace'],
        sans: ['var(--font-geist-sans)', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shutter-flash': 'flash 0.4s ease-out forwards',
        'float-slow': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 12s linear infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 15px currentColor)' },
          '50%': { opacity: '0.6', filter: 'drop-shadow(0 0 5px currentColor)' },
        },
        flash: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      boxShadow: {
        'neon-cyan': '0 0 20px rgba(0, 240, 255, 0.6), 0 0 40px rgba(0, 240, 255, 0.2)',
        'neon-pink': '0 0 20px rgba(255, 0, 127, 0.6), 0 0 40px rgba(255, 0, 127, 0.2)',
        'neon-gold': '0 0 20px rgba(255, 230, 0, 0.6), 0 0 40px rgba(255, 230, 0, 0.2)',
        'neon-green': '0 0 20px rgba(0, 255, 102, 0.6), 0 0 40px rgba(0, 255, 102, 0.2)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
    },
  },
  plugins: [],
};

export default config;
