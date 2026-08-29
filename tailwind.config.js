/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          red: {
            DEFAULT: '#C52828',
            hover: '#A61E1E',
            light: '#E53935',
            dark: '#DC2626',
          },
          black: '#111111',
          white: '#FFFFFF',
          darkBg: '#0F0F12',
          darkCard: '#18181C',
          darkBorder: '#27272A',
          lightBg: '#FAFAFA',
          lightCard: '#FFFFFF',
          lightBorder: '#E5E7EB',
        },
      },
      fontFamily: {
        amharic: ['Noto Sans Ethiopic', 'Abyssinica SIL', 'Ethiopic', 'sans-serif'],
        arabic: ['Amiri', 'Traditional Arabic', 'Scheherazade New', 'serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}