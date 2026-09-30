import { useEffect, useState } from 'react'
import { getRelationship, subscribeToChanges } from '../lib/store'
import { getUpcomingAnniversaries } from '../lib/date-utils'

export default function Anniversaries() {
  const [upcoming, setUpcoming] = useState([])
  const [hasStartDate, setHasStartDate] = useState(true)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const rel = await getRelationship()
    if (rel?.startDate) {
      setUpcoming(getUpcomingAnniversaries(rel.startDate, new Date(), 5))
      setHasStartDate(true)
    } else {
      setHasStartDate(false)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    const unsubscribe = subscribeToChanges(() => load())
    return unsubscribe
  }, [])

  if (loading) {
    return <div className="pt-24 text-center text-love-400">불러오는 중...</div>
  }

  if (!hasStartDate) {
    return (
      <div className="pt-24 text-center text-sm text-love-400">
        설정에서 만난 날을 먼저 입력해주세요.
      </div>
    )
  }

  return (
    <div className="pt-6">
      <h2 className="text-glow mb-4 text-lg font-bold text-love-700">다가오는 기념일</h2>
      <div className="frame-glow divide-y divide-love-100 overflow-hidden">
        {upcoming.map((a) => (
          <div
            key={`${a.type}-${a.n}`}
            className="flex items-center justify-between px-4 py-3.5"
          >
            <div>
              <p className="text-base font-semibold text-love-700">{a.label}</p>
              <p className="text-xs text-love-400">{a.dateLabel}</p>
            </div>
            <span className="text-glow text-sm font-bold text-love-600">
              {a.dday === 0 ? 'D-Day' : `D-${a.dday}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
