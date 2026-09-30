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
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCursor((c) => subMonths(c, 1))}
          className="rounded-full px-3 py-1.5 text-love-500"
        >
          ◀
        </button>
        <h2 className="text-base font-bold text-love-700">{format(cursor, 'yyyy년 M월')}</h2>
        <button
          type="button"
          onClick={() => setCursor((c) => addMonths(c, 1))}
          className="rounded-full px-3 py-1.5 text-love-500"
        >
          ▶
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center text-xs text-gray-400">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1.5">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const inMonth = isSameMonth(day, cursor)
          const hasRecord = recordsByDate.has(dateStr)
          const anniversary = startDate && inMonth ? getAnniversaryLabelForDate(startDate, dateStr) : null

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => setSelectedDate(dateStr)}
              disabled={loading}
              className={`relative mx-auto flex h-11 w-11 flex-col items-center justify-center rounded-full text-sm ${
                inMonth ? 'text-gray-700' : 'text-gray-300'
              } ${isToday(day) ? 'border-2 border-love-400 font-bold text-love-600' : ''} ${
                anniversary ? 'bg-love-100' : ''
              }`}
            >
              {day.getDate()}
              {hasRecord && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-love-500" />
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-4 space-y-1.5">
        {days
          .filter((d) => isSameMonth(d, cursor) && startDate)
          .map((d) => {
            const dateStr = format(d, 'yyyy-MM-dd')
            const label = startDate ? getAnniversaryLabelForDate(startDate, dateStr) : null
            if (!label) return null
            return (
              <div
                key={dateStr}
                className="flex items-center justify-between rounded-xl bg-white px-3.5 py-2 text-sm shadow-sm shadow-love-100"
              >
                <span className="text-love-600">
                  💗 {format(d, 'M월 d일')} · {label}
                </span>
              </div>
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
