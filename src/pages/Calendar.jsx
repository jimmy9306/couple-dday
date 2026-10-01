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
import {
  deleteDateRecord,
  getRelationship,
  listAllComments,
  listDateRecords,
  subscribeToChanges,
} from '../lib/store'
import { getAnniversaryLabelForDate } from '../lib/date-utils'
import DateRecordModal from '../components/DateRecordModal'
import RecordViewModal from '../components/RecordViewModal'
import PixelPanel from '../components/PixelPanel'
import { HeartIcon } from '../components/icons'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const MAX_DOTS = 3

export default function Calendar() {
  const { authorName, userId } = useAuth()
  const [cursor, setCursor] = useState(new Date())
  const [records, setRecords] = useState([])
  const [commentCounts, setCommentCounts] = useState(new Map())
  const [startDate, setStartDate] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [viewRecord, setViewRecord] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const [rel, recs, allComments] = await Promise.all([
      getRelationship(),
      listDateRecords(),
      listAllComments(),
    ])
    setStartDate(rel?.startDate || null)
    setRecords(recs)
    const counts = new Map()
    for (const c of allComments) {
      counts.set(c.recordId, (counts.get(c.recordId) || 0) + 1)
    }
    setCommentCounts(counts)
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
      const list = map.get(r.date) || []
      list.push(r)
      map.set(r.date, list)
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
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

  const selectedRecords = selectedDate ? recordsByDate.get(selectedDate) || [] : []
  const selectedAnniversary =
    selectedDate && startDate ? getAnniversaryLabelForDate(startDate, selectedDate) : null

  const refresh = async () => {
    await load()
  }

  const openCreate = () => {
    setEditingRecord(null)
    setFormOpen(true)
  }

  const openEditFromView = (record) => {
    setViewRecord(null)
    setEditingRecord(record)
    setFormOpen(true)
  }

  const handleFormSaved = async () => {
    setFormOpen(false)
    setEditingRecord(null)
    await refresh()
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setEditingRecord(null)
  }

  const handleDeleteFromView = async () => {
    if (!viewRecord?.id) return
    if (!confirm('이 기록을 삭제할까요?')) return
    await deleteDateRecord(viewRecord.id)
    setViewRecord(null)
    await refresh()
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
            const recordCount = recordsByDate.get(dateStr)?.length || 0
            const anniversary =
              startDate && inMonth ? getAnniversaryLabelForDate(startDate, dateStr) : null
            const isSelected = selectedDate === dateStr

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => setSelectedDate(dateStr)}
                disabled={loading}
                className={`pixel-tile font-body relative mx-auto flex h-10 w-10 flex-col items-center justify-center border-2 text-[11px] ${
                  inMonth ? 'text-pastel-text' : 'text-pastel-accent'
                } ${
                  isSelected
                    ? 'border-pastel-border bg-pastel-box font-bold'
                    : isToday(day)
                      ? 'border-pastel-border bg-pastel-accent font-bold'
                      : 'border-pastel-border bg-pastel-bg'
                }`}
              >
                {anniversary ? (
                  <HeartIcon className="h-4 w-4 text-pastel-border" />
                ) : (
                  <span>{day.getDate()}</span>
                )}
                {recordCount > 0 && (
                  <span className="absolute bottom-0.5 flex gap-[2px]">
                    {Array.from({ length: Math.min(recordCount, MAX_DOTS) }).map((_, i) => (
                      <span key={i} className="h-1 w-1 bg-pastel-border" />
                    ))}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </PixelPanel>

      {selectedDate && (
        <PixelPanel className="mb-4" innerClassName="p-3">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h3 className="font-title text-[14px] text-pastel-text">{selectedDate}</h3>
              {selectedAnniversary && (
                <span className="mt-1 inline-flex items-center gap-1 border-2 border-pastel-border bg-pastel-accent px-2 py-0.5 text-[11px] text-pastel-text">
                  <HeartIcon className="h-3 w-3" />
                  {selectedAnniversary}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="pixel-btn font-title mb-3 w-full border-2 border-pastel-border bg-pastel-accent py-2 text-[14px] text-pastel-text"
          >
            + 기록하기
          </button>

          {selectedRecords.length === 0 ? (
            <p className="font-body text-center text-[11px] text-pastel-accent">
              이 날의 기록이 없어요
            </p>
          ) : (
            <div className="space-y-2">
              {selectedRecords.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setViewRecord(r)}
                  className="pixel-tile flex w-full items-center justify-between gap-2 border-2 border-pastel-border bg-pastel-bg px-3 py-2 text-left"
                >
                  <span className="font-body min-w-0 flex-1 truncate text-[11px] text-pastel-text">
                    {r.title || '(제목 없음)'}
                    {commentCounts.get(r.id) > 0 && (
                      <span className="text-pastel-border"> 💬{commentCounts.get(r.id)}</span>
                    )}
                  </span>
                  <span className="font-body flex-shrink-0 text-[11px] text-pastel-accent">
                    {r.createdBy}
                  </span>
                </button>
              ))}
            </div>
          )}
        </PixelPanel>
      )}

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

      {viewRecord && (
        <RecordViewModal
          record={viewRecord}
          isOwner={viewRecord.userId != null && viewRecord.userId === userId}
          currentUserId={userId}
          authorName={authorName}
          onClose={() => {
            setViewRecord(null)
            refresh()
          }}
          onEdit={() => openEditFromView(viewRecord)}
          onDelete={handleDeleteFromView}
        />
      )}

      {formOpen && (
        <DateRecordModal
          dateStr={selectedDate}
          record={editingRecord}
          anniversaryLabel={selectedAnniversary}
          authorName={authorName}
          userId={userId}
          onClose={handleFormClose}
          onSaved={handleFormSaved}
          onDeleted={handleFormSaved}
        />
      )}
    </div>
  )
}
