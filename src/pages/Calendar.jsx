import { useEffect, useMemo, useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { useAuth } from '../lib/AuthContext'
import { getRelationship, listDateRecords, subscribeToChanges } from '../lib/store'
import { getAnniversaryLabelForDate } from '../lib/date-utils'
import DateRecordModal from '../components/DateRecordModal'
import PixelPanel from '../components/PixelPanel'
import { HeartIcon } from '../components/icons'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export default function Calendar() {
  const { authorName } = useAuth()
  const [cursor, setCursor] = useState(new Date())
  const [records, setRecords] = useState([])
  const [startDate, setStartDate] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const [rel, recs] = await Promise.all([getRelationship(), listDateRecords()])
    setStartDate(rel?.startDate || null)
    setRecords(recs)
    setLoading(false)
  }

  useEffect(() => {
    load()
    const unsubscribe = subscribeToChanges(() => load())
    return unsubscribe
  }, [])

  const recordsByDate = useMemo(() => {
    const map = new Map()
    for (const r of records) {
      if (!map.has(r.date)) map.set(r.date, r)
    }
    return map
  }, [records])

  const days = useMemo(() => {
    const monthStart = startOfMonth(cursor)
    const monthEnd = endOfMonth(cursor)
    const gridStart = startOfWeek(monthStart)
    const gridEnd = endOfWeek(monthEnd)
    return eachDayOfInterval({ start: gridStart, end: gridEnd })
  }, [cursor])

  const selectedRecord = selectedDate ? recordsByDate.get(selectedDate) || null : null
  const selectedAnniversary =
    selectedDate && startDate ? getAnniversaryLabelForDate(startDate, selectedDate) : null

  const closeModal = () => setSelectedDate(null)

  const handleSaved = async () => {
    closeModal()
    await load()
  }

  return (
    <div className="pt-6">
      <PixelPanel className="mb-4" innerClassName="p-3">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCursor((c) => subMonths(c, 1))}
            className="pixel-btn font-title border-2 border-pastel-border bg-pastel-accent px-2 py-1 text-[11px] text-pastel-text"
          >
            ◀
          </button>
          <h2 className="font-title text-[14px] text-pastel-text">{format(cursor, 'yyyy년 M월')}</h2>
          <button
            type="button"
            onClick={() => setCursor((c) => addMonths(c, 1))}
            className="pixel-btn font-title border-2 border-pastel-border bg-pastel-accent px-2 py-1 text-[11px] text-pastel-text"
          >
            ▶
          </button>
        </div>

        <div className="font-body grid grid-cols-7 gap-y-1 text-center text-[11px] text-pastel-text">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-1">
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const inMonth = isSameMonth(day, cursor)
            const hasRecord = recordsByDate.has(dateStr)
            const anniversary =
              startDate && inMonth ? getAnniversaryLabelForDate(startDate, dateStr) : null

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => setSelectedDate(dateStr)}
                disabled={loading}
                className={`pixel-tile font-body relative mx-auto flex h-10 w-10 flex-col items-center justify-center border-2 text-[11px] ${
                  inMonth ? 'text-pastel-text' : 'text-pastel-accent'
                } ${
                  isToday(day)
                    ? 'border-pastel-border bg-pastel-accent font-bold'
                    : 'border-pastel-border bg-pastel-bg'
                }`}
              >
                {anniversary ? (
                  <HeartIcon className="h-4 w-4 text-pastel-border" />
                ) : (
                  <span>{day.getDate()}</span>
                )}
                {hasRecord && (
                  <span className="absolute bottom-0.5 h-1 w-1 bg-pastel-border" />
                )}
              </button>
            )
          })}
        </div>
      </PixelPanel>

      <div className="space-y-2">
        {days
          .filter((d) => isSameMonth(d, cursor) && startDate)
          .map((d) => {
            const dateStr = format(d, 'yyyy-MM-dd')
            const label = startDate ? getAnniversaryLabelForDate(startDate, dateStr) : null
            if (!label) return null
            return (
              <PixelPanel key={dateStr} innerClassName="flex items-center gap-2 px-3 py-2">
                <HeartIcon className="h-4 w-4 text-pastel-border" />
                <span className="font-body text-[11px] text-pastel-text">
                  {format(d, 'M월 d일')} · {label}
                </span>
              </PixelPanel>
            )
          })}
      </div>

      {selectedDate && (
        <DateRecordModal
          dateStr={selectedDate}
          record={selectedRecord}
          anniversaryLabel={selectedAnniversary}
          authorName={authorName}
          onClose={closeModal}
          onSaved={handleSaved}
          onDeleted={handleSaved}
        />
      )}
    </div>
  )
}
