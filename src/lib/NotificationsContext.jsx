import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { listUnreadNotifications, markNotificationsRead, subscribeToNotifications } from './store'
import { syncPushSubscription } from './push'

// 화면 경로 → 알림 탭 (notifications.tab 과 동일한 값)
const TAB_BY_PATH = {
  '/dday': 'dday',
  '/calendar': 'calendar',
  '/todo': 'todo',
  '/bookclub': 'bookclub',
}

const NotificationsContext = createContext({ counts: {}, total: 0 })

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

  useEffect(() => {
    if (!userId) {
      setUnread([])
      return undefined
    }
    let cancelled = false
    const load = async () => {
      try {
        const list = await listUnreadNotifications()
        if (!cancelled) setUnread(list)
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

  const value = useMemo(() => {
    const counts = {}
    unread.forEach((n) => {
      counts[n.tab] = (counts[n.tab] || 0) + 1
    })
    return { counts, total }
  }, [unread, total])

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}
