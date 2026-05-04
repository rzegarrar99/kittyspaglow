/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF2A7A',
        secondary: '#FFB6C1',
        accent: '#D4AF37',
        surface: '#FFFFFF',
        background: '#FFF0F5',
        plum: '#2D1B2E',
      },
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
      },
      boxShadow: {
        'coquette': '0 10px 40px -10px rgba(255, 42, 122, 0.08)',
        'glass': '0 8px 32px 0 rgba(255, 42, 122, 0.05)',
        'glow': '0 0 20px rgba(255, 42, 122, 0.15)',
      },
      borderRadius: {
        '4xl': '2rem',
      }
    }
  },
  plugins: []
}