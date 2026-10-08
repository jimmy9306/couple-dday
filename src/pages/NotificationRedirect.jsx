import { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getNotification } from '../lib/store'
import useOpenNotification, { TAB_PATH } from '../lib/useOpenNotification'

// 푸시 알림을 눌러 앱이 열릴 때 도착하는 주소(#/n/<알림 id>).
// 알림 센터에서 누른 것과 똑같이 해당 위치로 이동(읽음 처리 포함)한 뒤 이 주소는 히스토리에서 사라짐.
export default function NotificationRedirect() {
  const { id } = useParams()
  const navigate = useNavigate()
  const openNotification = useOpenNotification()
  const startedFor = useRef(null)

  useEffect(() => {
    if (startedFor.current === id) return
    startedFor.current = id
    ;(async () => {
      let n = null
      try {
        n = await getNotification(id)
      } catch (err) {
        console.error('알림 불러오기 실패:', err)
      }
      if (!n) {
        navigate('/', { replace: true })
        return
      }
      const opened = await openNotification(n, { replace: true })
      // 대상이 삭제됐으면 안내만 뜨고 이동은 안 하므로, 이 임시 주소에 머물지 않게 해당 탭으로 보냄
      if (!opened) navigate(TAB_PATH[n.tab] || '/', { replace: true })
    })()
  }, [id, navigate, openNotification])

  return <div className="font-body pt-24 text-center text-[11px] text-pastel-text">이동 중...</div>
}
