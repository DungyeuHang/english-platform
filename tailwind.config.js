/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef9f5',
          100: '#d5f0e6',
          200: '#a9e0cd',
          500: '#158f77',
          600: '#0d6a58',
          700: '#0b5749',
        },
        gold: {
          300: '#f8d077',
          500: '#f2b84b',
        },
        ink: {
          DEFAULT: '#173225',
          soft: '#426659',
          light: '#6b8f7d',
        },
        paper: '#fffdfa',
        surface: '#ffffff',
        line: 'rgba(23, 50, 37, 0.14)',
        danger: '#b9483c',
        success: '#1f7a5b',
        info: '#245d8f',
      },
      borderRadius: {
        card: '12px',
        large: '16px',
      },
      boxShadow: {
        card: '0 20px 50px rgba(15, 39, 28, 0.14)',
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'Tahoma', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};