/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // "파스텔 핑크 픽셀 RPG" — 딱 5색만 사용
        pastel: {
          bg: '#FFF4F7',
          box: '#FFC8DD',
          accent: '#FF8FB8',
          border: '#D6457A',
          text: '#5A2A3A',
        },
      },
      fontFamily: {
        title: ['Galmuri14', 'monospace'],
        body: ['Galmuri11', 'monospace'],
        sans: ['Galmuri11', 'monospace'],
      },
      borderRadius: {
        none: '0px',
      },
    },
  },
  plugins: [],
}
