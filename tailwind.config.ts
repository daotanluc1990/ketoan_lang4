import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        lang: {
          red: '#8B1E1E',
          redDark: '#641515',
          yellow: '#F6C453',
          cream: '#F8F3E7',
          brown: '#2B1C16',
          ink: '#1F1B16'
        }
      },
      boxShadow: {
        soft: '0 18px 40px rgba(45, 28, 22, 0.08)'
      }
    }
  },
  plugins: []
};

export default config;
