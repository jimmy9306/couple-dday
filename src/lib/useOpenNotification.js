import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from './NotificationsContext'
import { notificationTargetExists } from './store'

export const TAB_PATH = {
  dday: '/dday',
  calendar: '/calendar',
  todo: '/todo',
  bookclub: '/bookclub',
}

export const DELETED_MESSAGE = '삭제된 항목이에요'

// 알림 하나를 열기: 읽음 처리 → 대상이 아직 있으면 해당 탭으로 이동(+ 이동 정보를 location.state.focus로 전달),
// 삭제됐으면 이동 없이 짧은 안내만. 열렸으면 true.
// 알림 센터에서 누를 때와 푸시 알림을 눌러 앱이 열릴 때(#/n/<id>) 모두 이걸 씀.
export default function useOpenNotification() {
  const navigate = useNavigate()
  const { markRead, showToast } = useNotifications()

  return useCallback(
    async (n, { replace = false } = {}) => {
      markRead(n.id)

      let exists = true
      try {
        exists = await notificationTargetExists(n)
      } catch (err) {
        console.error('알림 대상 확인 실패:', err)
      }
      if (!exists) {
        showToast(DELETED_MESSAGE)
        return false
      }

      navigate(TAB_PATH[n.tab] || '/', {
        replace,
        state: {
          focus: {
            // 같은 알림을 다시 눌러도 매번 새로 동작하도록 매번 다른 키
            key: `${n.id}:${Date.now()}`,
            kind: n.kind,
            targetId: n.targetId,
            targetDate: n.targetDate,
            commentId: n.commentId,
          },
        },
      })
      return true
    },
    [navigate, markRead, showToast]
  )
}
