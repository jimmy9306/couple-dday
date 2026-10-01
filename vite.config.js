import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages 배포 시 레포 이름이 couple-dday 라고 가정 (DECISIONS.md 참고).
// 레포 이름이 다르면 이 값을 "/실제-레포이름/" 으로 바꿔야 함.
const BASE_PATH = '/couple-dday/'

export default defineConfig({
  base: BASE_PATH,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // 기본 주입 스크립트는 그냥 register()만 하고 끝나서, 이미 열려있는 PWA 세션은
      // 백그라운드에서 새 서비스워커가 설치/활성화돼도 새로고침 전까진 옛 JS를 계속
      // 돌림(특히 홈 화면에 띄워두고 오래 켜두는 폰 환경에서 체감됨). virtual:pwa-register로
      // 직접 등록해서 새 서비스워커가 컨트롤을 넘겨받는 순간 자동 새로고침되게 함(src/main.jsx).
      injectRegister: false,
      includeAssets: ['favicon.png', 'apple-touch-icon.png'],
      manifest: {
        name: '우리 디데이',
        short_name: '디데이',
        description: '커플 전용 디데이 / 기념일 / 캘린더 / 투두 앱',
        theme_color: '#D6457A',
        background_color: '#FFF4F7',
        display: 'standalone',
        start_url: BASE_PATH,
        scope: BASE_PATH,
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // 새 서비스워커가 기존(대기 중) 워커를 기다리지 않고 바로 활성화 + 열려있는
        // 모든 탭의 컨트롤을 즉시 넘겨받도록 명시(= registerSW의 자동 새로고침과 짝).
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // galmuri 패키지가 여러 굵기/폭(7,9,11,11-Bold,11-Condensed,14,Mono...)의 폰트를
        // 한 CSS에 다 선언해두지만 실제로 쓰는 건 Galmuri11/Galmuri14 뿐이라,
        // 나머지 굵기 + 구형 브라우저용 .ttf 폴백은 오프라인 캐시에서 제외해서 용량을 줄임
        // (woff2는 모던 브라우저가 전부 지원하므로 ttf 미캐싱은 안전한 트레이드오프).
        globIgnores: [
          '**/Galmuri7*',
          '**/Galmuri9*',
          '**/GalmuriMono*',
          '**/Galmuri11-Bold*',
          '**/Galmuri11-Condensed*',
          '**/*.ttf',
        ],
      },
    }),
  ],
})
