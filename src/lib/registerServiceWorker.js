import { registerSW } from 'virtual:pwa-register'

// 배포마다 자산 파일 해시가 바뀌는데, 이미 열려있는 PWA 세션(특히 홈 화면에 띄워두고
// 오래 켜두는 폰)은 새 서비스워커가 설치/활성화돼도 화면을 새로고침하기 전까진 계속
// 옛 JS를 참조함 — 그래서 "둘 중 한 명만 옛 버전을 보는" 것처럼 보이는 문제가 생길 수 있음.
// controllerchange(새 서비스워커가 이 탭의 네트워크 요청을 넘겨받는 순간)를 감지해서
// 자동으로 한 번 새로고침해 항상 최신 배포를 쓰도록 함.
export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return

  // 알림을 탭했을 때 서비스워커가 보내는 "이 탭으로 이동" 메시지 (예: { type: 'NAVIGATE', hash: '#/n/<알림 id>' } — 앱이 그 알림의 위치로 이동시킴)
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'NAVIGATE' && typeof event.data.hash === 'string') {
      window.location.hash = event.data.hash
    }
  })

  let reloaded = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloaded) return
    reloaded = true
    window.location.reload()
  })

  registerSW({
    immediate: true,
    onRegisteredSW(_url, registration) {
      if (!registration) return
      // autoUpdate 모드라 새 버전이 발견되면 자동 적용되지만, 브라우저가 자체적으로
      // 업데이트를 확인하는 시점(새 탐색/탭 전환 등)에만 의존하면 오래 켜둔 세션에서
      // 늦게 반영될 수 있어 주기적으로(1시간마다) 명시적으로 확인함.
      window.setInterval(() => {
        registration.update()
      }, 60 * 60 * 1000)
    },
  })
}
