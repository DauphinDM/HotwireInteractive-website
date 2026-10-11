/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.html",
    "./team/**/*.html",
    "./src/**/*.{js,ts,jsx,tsx,html}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        pitch: '#080808',
        surface: '#121212',
        'surface-elevated': '#1A1A1A',
        hotwire: {
          DEFAULT: '#FF5D1B',
          hover: '#FF6E2D',
          dark: '#D5420C',
        },
        flame: '#FF6200',
        amber: '#FFAA00',
        industrial: {
          100: '#F5F5F5',
          200: '#E0E0E0',
          300: '#B0B0B0',
          400: '#808080',
          500: '#505050',
          600: '#333333',
          700: '#222222',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'brutal-sm': '3px 3px 0px #FF5D1B',
        'brutal-white': '4px 4px 0px #FFFFFF',
        'brutal-orange': '5px 5px 0px #FF5D1B',
        'brutal-amber': '5px 5px 0px #FFAA00',
        'brutal-lg': '8px 8px 0px #FF5D1B',
      },
      borderWidth: {
        '3': '3px',
      }
    },
  },
  plugins: [],
};
