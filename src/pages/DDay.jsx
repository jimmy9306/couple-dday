import { useEffect, useState } from 'react'
import { getRelationship, setStartDate, subscribeToChanges } from '../lib/store'
import { getDayCount, getUpcomingAnniversaries } from '../lib/date-utils'
import PixelPanel from '../components/PixelPanel'
import { GiftIcon } from '../components/icons'

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
    <div className="flex flex-col items-center justify-center gap-4 pt-16 text-center">
      <h2 className="font-title text-[14px] text-pastel-text">만난 날을 입력해주세요</h2>
      <PixelPanel className="w-full max-w-xs" innerClassName="w-full p-5">
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="font-body w-full border-2 border-pastel-border bg-pastel-bg px-3 py-2 text-[11px] text-pastel-text outline-none"
          />
          {error && <p className="font-body text-[11px] text-pastel-border">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="pixel-btn font-title w-full border-2 border-pastel-border bg-pastel-accent py-2 text-[14px] text-pastel-text disabled:opacity-50"
          >
            저장하고 시작하기
          </button>
        </form>
      </PixelPanel>
    </div>
  )
}

export default function DDay() {
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDateState] = useState(null)
  const [dayCount, setDayCount] = useState(0)
  const [next, setNext] = useState(null)
  const [upcoming, setUpcoming] = useState([])
  const [error, setError] = useState('')

  const load = async () => {
    setError('')
    try {
      const rel = await getRelationship()
      if (rel?.startDate) {
        setStartDateState(rel.startDate)
        setDayCount(getDayCount(rel.startDate))
        const list = getUpcomingAnniversaries(rel.startDate, new Date(), 5)
        setNext(list[0] || null)
        setUpcoming(list)
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
    return <div className="font-body pt-24 text-center text-[11px] text-pastel-text">불러오는 중...</div>
  }

  if (error) {
    return <div className="font-body pt-24 text-center text-[11px] text-pastel-border">{error}</div>
  }

  if (!startDate) {
    return (
      <StartDateSetup
        onSaved={(date) => {
          setStartDateState(date)
          setDayCount(getDayCount(date))
          const list = getUpcomingAnniversaries(date, new Date(), 5)
          setNext(list[0] || null)
          setUpcoming(list)
        }}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4 pt-6">
      <PixelPanel innerClassName="p-6 text-center">
        <p className="font-body text-[11px] text-pastel-text">OUR DAYS TOGETHER</p>
        <p className="font-body mt-2 text-[11px] text-pastel-text">우리가 만난 지</p>
        <p className="font-title mt-1 text-[42px] leading-none text-pastel-text">
          {dayCount.toLocaleString()}
          <span className="font-body ml-1 text-[14px]">일째</span>
        </p>
        {next && (
          <p className="font-body mt-4 text-[11px] text-pastel-text">
            {next.label}까지 <span className="font-title text-[14px]">D-{next.dday}</span> (
            {next.dateLabel})
          </p>
        )}
      </PixelPanel>

      <div className="flex items-center gap-2">
        <GiftIcon className="h-4 w-4 text-pastel-border" />
        <h3 className="font-title text-[14px] text-pastel-text">다가오는 기념일</h3>
      </div>

      <PixelPanel innerClassName="">
        {upcoming.map((a) => (
          <div
            key={`${a.type}-${a.n}`}
            className="flex items-center justify-between border-b-2 border-pastel-border px-4 py-3 last:border-b-0"
          >
            <div>
              <p className="font-title text-[14px] text-pastel-text">{a.label}</p>
              <p className="font-body text-[11px] text-pastel-text">{a.dateLabel}</p>
            </div>
            <span className="font-title text-[14px] text-pastel-text">
              {a.dday === 0 ? 'D-Day' : `D-${a.dday}`}
            </span>
          </div>
        ))}
      </PixelPanel>
    </div>
  )
}
