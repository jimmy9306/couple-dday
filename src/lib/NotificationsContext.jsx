import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import {
  listUnreadNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  markNotificationsRead,
  subscribeToNotifications,
} from './store'
import { syncPushSubscription } from './push'

// 화면 경로 → 알림 탭 (notifications.tab 과 동일한 값)
const TAB_BY_PATH = {
  '/dday': 'dday',
  '/calendar': 'calendar',
  '/todo': 'todo',
  '/bookclub': 'bookclub',
}

const noop = () => {}
const NotificationsContext = createContext({
  counts: {},
  total: 0,
  unreadIds: new Set(),
  version: 0,
  markRead: noop,
  markAllRead: noop,
  showToast: noop,
})

export function useNotifications() {
  return useContext(NotificationsContext)
}

function updateAppBadge(total) {
  try {
    const result = total > 0 ? navigator.setAppBadge?.(total) : navigator.clearAppBadge?.()
    Promise.resolve(result).catch(() => {}) // 권한이 없거나 미지원이면 조용히 무시
  } catch {
    /* 미지원 */
  }
}

// 안 읽은 알림을 들고 있다가
//  - 탭 바/홈 메뉴의 빨간 점(counts)
//  - 앱 아이콘 숫자 배지(total)
// 에 쓰고, 해당 탭 화면에 들어가면 그 탭 알림을 읽음 처리함.
export function NotificationsProvider({ children }) {
  const { userId, mode } = useAuth()
  const { pathname } = useLocation()
  const [unread, setUnread] = useState([])
  // 알림 목록을 새로 불러올 때마다 올라가는 번호 (알림 센터가 목록을 다시 읽을 때 기준)
  const [version, setVersion] = useState(0)
  const [toast, setToast] = useState('')
  const toastTimer = useRef(null)

  useEffect(() => {
    if (!userId) {
      setUnread([])
      return undefined
    }
    let cancelled = false
    const load = async () => {
      try {
        const list = await listUnreadNotifications()
        if (!cancelled) {
          setUnread(list)
          setVersion((v) => v + 1)
        }
      } catch (err) {
        console.error('알림 불러오기 실패:', err)
      }
    }
    load()
    const unsubscribe = subscribeToNotifications(load)
    const onVisible = () => {
      if (document.visibilityState === 'visible') load()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      unsubscribe()
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [userId])

  // 이미 알림을 켠 기기는 앱을 열 때 구독을 내 계정에 다시 등록
  useEffect(() => {
    if (mode === 'supabase' && userId) syncPushSubscription().catch(() => {})
  }, [mode, userId])

  // 해당 탭 화면을 보고 있는 동안은 그 탭의 알림을 읽음 처리 (이미 열려 있는 중에 온 알림 포함)
  const viewedTab = TAB_BY_PATH[pathname]
  useEffect(() => {
    if (!userId || !viewedTab) return
    if (!unread.some((n) => n.tab === viewedTab)) return
    setUnread((prev) => prev.filter((n) => n.tab !== viewedTab))
    markNotificationsRead(viewedTab).catch((err) => console.error('읽음 처리 실패:', err))
  }, [userId, viewedTab, unread])

  const total = unread.length
  useEffect(() => {
    if (userId) updateAppBadge(total)
  }, [userId, total])

  // 알림 하나 / 전체 읽음 처리 — 화면은 즉시 갱신(배지 숫자 포함)하고 DB는 뒤따라 반영
  const markRead = useCallback((id) => {
    setUnread((prev) => (prev.some((n) => n.id === id) ? prev.filter((n) => n.id !== id) : prev))
    markNotificationRead(id).catch((err) => console.error('읽음 처리 실패:', err))
  }, [])

  const markAllRead = useCallback(() => {
    setUnread([])
    markAllNotificationsRead().catch((err) => console.error('모두 읽음 처리 실패:', err))
  }, [])

  const showToast = useCallback((message) => {
    setToast(message)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(''), 2000)
  }, [])

  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  const value = useMemo(() => {
    const counts = {}
    unread.forEach((n) => {
      counts[n.tab] = (counts[n.tab] || 0) + 1
    })
    return {
      counts,
      total,
      unreadIds: new Set(unread.map((n) => n.id)),
      version,
      markRead,
      markAllRead,
      showToast,
    }
  }, [unread, total, version, markRead, markAllRead, showToast])

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      {toast && (
        <div
          role="status"
          className="pointer-events-none fixed bottom-[calc(env(safe-area-inset-bottom)+5rem)] left-1/2 z-[80] -translate-x-1/2 border-2 border-pastel-border bg-pastel-box px-4 py-2 shadow-[3px_3px_0_0_#D6457A]"
        >
          <p className="font-body text-[11px] text-pastel-text">{toast}</p>
        </div>
      )}
    </NotificationsContext.Provider>
  )
}
