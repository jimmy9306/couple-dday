import { useEffect, useState } from 'react'

const AUTUMN_MONTHS = [8, 9, 10] // 9~11월 (Date.getMonth()는 0부터 시작)
const REDUCE_QUERY = '(prefers-reduced-motion: reduce)'

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.(REDUCE_QUERY).matches
}

// 가을(9~11월)이고 "동작 줄이기"가 꺼져 있을 때만 enabled. enabled일 때 5~8초마다 바람(gust)을 발생시킴.
// gust.active: 바람 줄/낙엽 날림 구간(1.3초), gust.pose: 캐릭터가 바람 포즈를 취하는 짧은 구간.
export default function useAutumnWind() {
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

  const enabled = AUTUMN_MONTHS.includes(new Date().getMonth()) && !reduced

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

  return { enabled, gust }
}
