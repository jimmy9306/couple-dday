// 커스텀 서비스워커 (vite-plugin-pwa injectManifest 방식).
// - 캐싱/자동 업데이트는 예전 generateSW가 만들어주던 것과 동일하게 유지
// - 추가: Web Push 수신 시 알림 표시 + 앱 아이콘 배지 숫자, 알림 탭하면 해당 탭으로 이동 (pushHandlers.js)
import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { installPushHandlers } from './pushHandlers'

self.skipWaiting()
clientsClaim()

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')))

installPushHandlers(self)
