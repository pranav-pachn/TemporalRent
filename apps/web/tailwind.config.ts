import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0c0c0f',
        surface: '#111114',
        surfaceHover: '#18181c',
        border: '#22222a',
        primary: {
          DEFAULT: '#f59e0b',
          foreground: '#0c0c0f',
        },
        primaryHover: '#d97706',
        text: {
          DEFAULT: '#f0f0f2',
          muted: '#8a8a99'
        },
        urgency: {
          critical: '#ef4444',
          attention: '#f59e0b',
          normal: '#3f3f46'
        },
        status: {
          available: '#22c55e',
          conflict: '#ef4444',
          operational: '#f59e0b'
        }
      },
      fontFamily: {
        sans: ['var(--font-manrope)', 'sans-serif'],
        mono: ['var(--font-plex-mono)', 'monospace'],
      }
    },
  },
  plugins: [],
};
export default config;
