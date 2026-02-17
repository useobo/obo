import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces - warm grey foundation
        surface: {
          50: '#faf9f6',
          100: '#f5f3f0',
          200: '#eae7e2',
          300: '#dedad4',
          400: '#c4c0b8',
          500: '#a8a49c',
          600: '#8c877e',
          700: '#6e6961',
          800: '#524d46',
          900: '#3d3934',
          950: '#2e2a26',
        },
        // Text hierarchy
        text: {
          primary: '#2e2a26',   // headings
          secondary: '#6e6961', // labels, descriptions
          tertiary: '#8c877e',  // hints
          muted: '#a8a49c',     // disabled
        },
        // Accent - warm olive/forest
        accent: {
          50: '#f5f3f0',
          100: '#e8e6e1',
          200: '#d1cdb8',
          300: '#b5afa0',
          400: '#9a9385',
          500: '#7a7468',
          600: '#5c574e',
          700: '#4a463f',
          800: '#3d3934',
          950: '#2e2a26',
        },
        // Status colors (muted with bg/text/border)
        status: {
          success: {
            bg: 'rgba(16, 185, 129, 0.12)',
            text: '#047857',
            border: 'rgba(16, 185, 129, 0.24)',
          },
          warning: {
            bg: 'rgba(245, 158, 11, 0.12)',
            text: '#b45309',
            border: 'rgba(245, 158, 11, 0.24)',
          },
          error: {
            bg: 'rgba(239, 68, 68, 0.1)',
            text: '#b91c1c',
            border: 'rgba(239, 68, 68, 0.2)',
          },
          info: {
            bg: 'rgba(59, 130, 246, 0.11)',
            text: '#1d4ed8',
            border: 'rgba(59, 130, 246, 0.22)',
          },
        },
        // Borders
        border: {
          default: 'rgba(46, 42, 38, 0.14)',
          hover: 'rgba(46, 42, 38, 0.24)',
          focus: 'rgba(122, 116, 104, 0.45)',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      fontSize: {
        display: ['3.5rem', { lineHeight: '1', fontWeight: '700', letterSpacing: '-0.02em' }],
      },
    },
  },
  plugins: [],
};
export default config;
