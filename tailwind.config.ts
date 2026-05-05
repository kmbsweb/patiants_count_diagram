import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      boxShadow: {
        soft: '0 20px 70px rgba(15, 23, 42, 0.08)',
      },
      colors: {
        brand: {
          950: '#0f172a',
          900: '#111827',
          500: '#2563eb',
          300: '#93c5fd',
        },
      },
    },
  },
  plugins: [],
};

export default config;
