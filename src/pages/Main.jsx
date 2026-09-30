import { useEffect, useState } from 'react'
import { getRelationship, setStartDate, subscribeToChanges } from '../lib/store'
import { getDayCount, getUpcomingAnniversaries } from '../lib/date-utils'

function StartDateSetup({ onSaved }) {
  const [date, setDate] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!date) return
    setBusy(true)
    setError('')
    try {
      await setStartDate(date)
      onSaved(date)
    } catch (err) {
      setError(err.message || '저장에 실패했어요.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 pt-24 text-center">
      <div className="text-4xl">📅</div>
      <h2 className="text-lg font-bold text-love-700">만난 날을 입력해주세요</h2>
      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-3">
        <input
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-xl border border-love-200 bg-white px-4 py-3 text-sm outline-none focus:border-love-400"
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-love-500 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          저장하고 시작하기
        </button>
      </form>
    </div>
  )
}

export default function Main() {
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDateState] = useState(null)
  const [dayCount, setDayCount] = useState(0)
  const [upcoming, setUpcoming] = useState([])
  const [error, setError] = useState('')

  const load = async () => {
    setError('')
    try {
      const rel = await getRelationship()
      if (rel?.startDate) {
        setStartDateState(rel.startDate)
        setDayCount(getDayCount(rel.startDate))
        setUpcoming(getUpcomingAnniversaries(rel.startDate, new Date(), 5))
      } else {
        setStartDateState(null)
      }
    } catch (err) {
      setError(err.message || '불러오기에 실패했어요.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const unsubscribe = subscribeToChanges(() => load())
    return unsubscribe
  }, [])

  if (loading) {
    return <div className="pt-24 text-center text-love-400">불러오는 중...</div>
  }

  if (error) {
    return <div className="pt-24 text-center text-red-500">{error}</div>
  }

  if (!startDate) {
    return (
      <StartDateSetup
        onSaved={(date) => {
          setStartDateState(date)
          setDayCount(getDayCount(date))
          setUpcoming(getUpcomingAnniversaries(date, new Date(), 5))
        }}
      />
    )
  }

  const next = upcoming[0]

  return (
    <div className="flex flex-col gap-6 pt-6">
      <section className="rounded-3xl bg-white p-8 text-center shadow-sm shadow-love-100">
        <p className="text-sm text-love-400">우리가 만난 지</p>
        <p className="mt-2 text-5xl font-extrabold text-love-600">
          {dayCount.toLocaleString()}
          <span className="ml-1 text-2xl font-bold text-love-500">일째</span>
        </p>
        {next && (
          <p className="mt-4 text-sm text-love-500">
            {next.label}까지{' '}
            <span className="font-semibold text-love-700">
              {next.dday === 0 ? 'D-Day' : `D-${next.dday}`}
            </span>{' '}
            ({next.dateLabel})
          </p>
        )}
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-sm shadow-love-100">
        <h3 className="mb-3 text-sm font-semibold text-love-700">다가오는 기념일</h3>
        <ul className="space-y-2.5">
          {upcoming.map((a) => (
            <li
              key={`${a.type}-${a.n}`}
              className="flex items-center justify-between rounded-xl bg-love-50 px-3.5 py-2.5"
            >
              <div>
                <p className="text-sm font-medium text-love-700">{a.label}</p>
                <p className="text-xs text-love-400">{a.dateLabel}</p>
              </div>
              <span className="text-sm font-semibold text-love-500">
                {a.dday === 0 ? 'D-Day' : `D-${a.dday}`}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
