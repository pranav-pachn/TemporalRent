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
        surface: {
          DEFAULT: '#101014',
          subtle: '#0d0d11',
          raised: '#16161c',
          hover: '#1c1c24',
          active: '#22222e',
        },
        surfaceHover: '#18181f',
        border: {
          DEFAULT: '#202028',
          subtle: '#181820',
          muted: '#262632',
          active: '#383848',
        },
        primary: {
          DEFAULT: '#f59e0b',
          foreground: '#0c0c0f',
        },
        primaryHover: '#d97706',
        text: {
          DEFAULT: '#f0f0f4',
          muted: '#8e8ea0',
          dim: '#5d5d6e',
        },
        urgency: {
          critical: '#ef4444',
          attention: '#f59e0b',
          normal: '#3f3f46',
        },
        status: {
          available: '#10b981',
          safe: '#10b981',
          conflict: '#ef4444',
          danger: '#ef4444',
          operational: '#f59e0b',
          warning: '#f59e0b',
          info: '#3b82f6',
          neutral: '#71717a',
        },
      },
      fontFamily: {
        sans: ['var(--font-manrope)', 'sans-serif'],
        mono: ['var(--font-plex-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;
