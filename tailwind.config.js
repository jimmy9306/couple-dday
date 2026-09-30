/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // "레트로 게임 메뉴판 + 파스텔 네온" 팔레트: 크림 핑크 배경 + 라일락/핑크 네온
        love: {
          50: '#FFF5FA',
          100: '#FCE4F3',
          200: '#F5C6EA',
          300: '#E9A6E0',
          400: '#D98BDB',
          500: '#C77DD6',
          600: '#B15FC4',
          700: '#8F45A1',
          800: '#6D3280',
          900: '#4B2160',
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
