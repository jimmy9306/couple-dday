// 서비스워커의 푸시 수신/알림 탭 처리. (sw.js에서 설치 — 테스트하기 쉽게 따로 분리)
export function installPushHandlers(sw) {
  sw.addEventListener('push', (event) => {
    let data = {}
    try {
      data = event.data ? event.data.json() : {}
    } catch {
      data = { body: event.data ? event.data.text() : '' }
    }

    event.waitUntil(
      (async () => {
        // iOS는 푸시를 받으면 반드시 알림을 보여줘야 함(안 보여주면 구독이 취소될 수 있음)
        await sw.registration.showNotification(data.title || '우리 디데이', {
          body: data.body || '',
          icon: 'icons/icon-192.png',
          tag: data.id, // 같은 알림 중복 표시 방지
          data: { tab: data.tab, id: data.id },
        })
        // 앱 아이콘 빨간 숫자 = 안 읽은 알림 개수 (서버가 계산해서 보내줌)
        if (typeof data.badge === 'number' && sw.navigator && sw.navigator.setAppBadge) {
          try {
            await sw.navigator.setAppBadge(data.badge)
          } catch {
            /* 배지 권한이 없거나 미지원이면 무시 */
          }
        }
      })()
    )
  })

  sw.addEventListener('notificationclick', (event) => {
    event.notification.close()
    const tab = event.notification.data && event.notification.data.tab
    const hash = tab ? `#/${tab}` : '#/'

    event.waitUntil(
      (async () => {
        const scope = sw.registration.scope
        const windows = await sw.clients.matchAll({ type: 'window', includeUncontrolled: true })
        const open = windows.find((w) => w.url.startsWith(scope))
        if (open) {
          await open.focus()
          open.postMessage({ type: 'NAVIGATE', hash })
          return
        }
        await sw.clients.openWindow(scope + hash)
      })()
    )
  })
}
