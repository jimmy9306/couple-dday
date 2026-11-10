import { useEffect, useState } from 'react'
import { getSeasonTheme } from './seasonConfig'

const REDUCE_QUERY = '(prefers-reduced-motion: reduce)'

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.(REDUCE_QUERY).matches
}

// 지금 계절 테마(seasonConfig.js, 한국 시간 기준)에 효과(낙엽/눈)가 있고 "동작 줄이기"가 꺼져 있을 때만 enabled.
// enabled일 때 5~8초마다 바람(gust)을 발생시킴.
// gust.active: 바람 구간(1.3초: 낙엽 날림/눈 옆으로 쓸림), gust.pose: 캐릭터가 바람 포즈를 취하는 짧은 구간.
// theme: { id, effect, spriteDir } — 캐릭터 이미지 폴더는 reduced-motion과 무관하게 계절을 따름.
export default function useSeasonEffect() {
  const [theme, setTheme] = useState(() => getSeasonTheme())

  // 앱을 켜둔 채 날짜가 바뀌어도(예: 11/9 → 11/10) 다시 볼 때 테마가 갱신되게 함
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState !== 'visible') return
      const next = getSeasonTheme()
      setTheme((cur) => (cur.id === next.id && cur.spriteDir === next.spriteDir ? cur : next))
    }
    document.addEventListener('visibilitychange', refresh)
    return () => document.removeEventListener('visibilitychange', refresh)
  }, [])

  const [reduced, setReduced] = useState(prefersReducedMotion)
  const [gust, setGust] = useState({ key: 0, active: false, pose: false })

  useEffect(() => {
    const mq = window.matchMedia?.(REDUCE_QUERY)
    if (!mq) return undefined
    const onChange = () => setReduced(mq.matches)
    if (mq.addEventListener) mq.addEventListener('change', onChange)
    else mq.addListener(onChange)
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange)
      else mq.removeListener(onChange)
    }
  }, [])

  const enabled = Boolean(theme.effect) && !reduced

  useEffect(() => {
    if (!enabled) return undefined
    const timers = []
    const later = (fn, ms) => timers.push(window.setTimeout(fn, ms))
    const schedule = () => {
      later(() => {
        setGust((g) => ({ key: g.key + 1, active: true, pose: false }))
        later(() => setGust((g) => ({ ...g, pose: true })), 200)
        later(() => setGust((g) => ({ ...g, pose: false })), 650)
        later(() => {
          setGust((g) => ({ ...g, active: false }))
          schedule()
        }, 1300)
      }, 5000 + Math.random() * 3000)
    }
    schedule()
    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [enabled])

  return { theme, enabled, gust }
}
