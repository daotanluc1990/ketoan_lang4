import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        lang: {
          red: '#9F1F24',
          redDark: '#6F171B',
          redSoft: '#FEF2F2',
          yellow: '#F3C969',
          cream: '#F8F6F0',
          brown: '#3B2A20',
          ink: '#111827',
          surface: '#FFFFFF',
          canvas: '#F6F7F9',
          line: '#E5E7EB'
        }
      },
      boxShadow: {
        soft: '0 16px 36px rgba(17, 24, 39, 0.07)'
      }
    }
  },
  plugins: []
};

export default config;
