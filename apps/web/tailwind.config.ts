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
        background: '#0d0d10',
        surface: '#141418',
        surfaceHover: '#1c1c22',
        border: '#27272a',
        primary: '#f59e0b',
        primaryHover: '#d97706',
        text: {
          DEFAULT: '#f4f4f5',
          muted: '#a1a1aa'
        },
        urgency: {
          critical: '#ef4444',
          attention: '#f59e0b',
          normal: '#3f3f46'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
export default config;
