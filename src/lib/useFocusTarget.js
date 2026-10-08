import { useCallback, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

// 알림을 눌러 이 화면으로 왔을 때 전달된 이동 정보(location.state.focus)를 꺼내 쓰는 훅.
// 같은 이동 정보는 한 번만 처리하고, 처리된 뒤에는 history state에서 지워서
// 새로고침/뒤로가기 때 같은 팝업이 다시 뜨지 않게 함.
//   const { focus, consume } = useFocusTarget(['post', 'comment'])
//   useEffect(() => { if (!focus || 데이터 아직 없음) return; ...열기...; consume() }, [focus, 데이터])
export default function useFocusTarget(kinds) {
  const { pathname, state } = useLocation()
  const navigate = useNavigate()
  const doneKey = useRef(null)

  const raw = state?.focus
  const focus = raw && kinds.includes(raw.kind) && doneKey.current !== raw.key ? raw : null

  const consume = useCallback(() => {
    if (!raw) return
    doneKey.current = raw.key
    navigate(pathname, { replace: true, state: null })
  }, [raw, navigate, pathname])

  return { focus, consume }
}
