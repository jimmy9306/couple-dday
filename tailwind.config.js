/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        love: {
          50: '#fff5f7',
          100: '#ffe4ea',
          200: '#ffc2d1',
          300: '#ff97b2',
          400: '#ff6f97',
          500: '#ff5c8a',
          600: '#ec3f70',
          700: '#c72c58',
          800: '#9c2245',
          900: '#7a1c39',
        },
      },
      fontFamily: {
        sans: [
          '"Pretendard"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Apple SD Gothic Neo"',
          '"Segoe UI"',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
