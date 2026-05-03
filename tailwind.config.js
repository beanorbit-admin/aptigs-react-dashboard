/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#4F46E5',
          light: '#6366F1',
          dark: '#3730A3'
        }
      }
    }
  },
  plugins: []
}
