/** @type {import('tailwindcss').Config} */
export default {
  content: {
    relative: true,
    files: ["./*.html", "./studio/**/*.html", "./contact/**/*.html", "./projects/**/*.html", "./websites/**/*.html", "./team/**/*.html", "./privacy/**/*.html", "./terms/**/*.html", "./cookies/**/*.html", "./src/**/*.{js,html}"],
  },
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        pitch: '#11110f',
        surface: '#1b1c19',
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
        sans: ['Manrope', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Barlow Condensed', 'Arial Narrow', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'monospace'],
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
