import { useCallback, useEffect, useRef, useState } from 'react'
import { differenceInCalendarDays, differenceInMinutes, format, parseISO } from 'date-fns'
import { useNotifications } from '../lib/NotificationsContext'
import useOpenNotification from '../lib/useOpenNotification'
import { listNotifications } from '../lib/store'
import UnreadDot from './UnreadDot'
import { BellIcon, BookIcon, CalendarIcon, ChatIcon, CheckIcon, GiftIcon } from './icons'

const PAGE_SIZE = 20
const LOAD_MORE_DISTANCE = 120 // 목록 맨 아래에서 이만큼(px) 남으면 다음 20개를 불러옴

const KIND_ICON = {
  post: CalendarIcon,
  comment: ChatIcon,
  todo_add: CheckIcon,
  todo_done: CheckIcon,
  book_read: BookIcon,
  book_review: ChatIcon,
  anniversary: GiftIcon,
}

// "방금" / "5분 전" / "3시간 전" / "어제" / "10.08"
export function formatNotificationTime(iso, now = new Date()) {
  let date
  try {
    date = parseISO(iso)
    if (Number.isNaN(date.getTime())) return ''
  } catch {
    return ''
  }
  const minutes = differenceInMinutes(now, date)
  if (minutes < 1) return '방금'
  if (minutes < 60) return `${minutes}분 전`
  const days = differenceInCalendarDays(now, date)
  if (days <= 0) return `${Math.floor(minutes / 60)}시간 전`
  if (days === 1) return '어제'
  return format(date, 'MM.dd')
}

function NotificationRow({ n, unread, onOpen }) {
  const Icon = KIND_ICON[n.kind] || BellIcon
  return (
    <button
      type="button"
      onClick={() => onOpen(n)}
      className={`relative flex w-full items-start gap-2 border-b-2 border-pastel-border py-3 pl-5 pr-3 text-left ${
        unread ? 'bg-pastel-accent' : 'bg-pastel-bg opacity-60'
      }`}
    >
      <UnreadDot show={unread} className="left-1.5 top-4" />
      <Icon className="mt-px h-4 w-4 flex-shrink-0 text-pastel-border" />
      <div className="min-w-0 flex-1">
        <p className="font-body break-keep text-[11px] leading-snug text-pastel-text">
          {n.message || n.body}
        </p>
        {n.preview && (
          <p className="font-body mt-0.5 truncate text-[11px] text-pastel-text/70">{n.preview}</p>
        )}
      </div>
      <span className="font-body flex-shrink-0 text-[11px] text-pastel-text/70">
        {formatNotificationTime(n.createdAt)}
      </span>
    </button>
  )
}

function NotificationPanel({ onClose }) {
  const { unreadIds, version, markAllRead } = useNotifications()
  const openNotification = useOpenNotification()
  const [items, setItems] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState('')
  const loadingMore = useRef(false)
  const countRef = useRef(0)
  countRef.current = items.length

  // 처음 열 때, 그리고 새 알림이 오거나 읽음 상태가 바뀌어 알림이 다시 로드될 때(version) 지금 보이는 만큼 다시 읽음
  useEffect(() => {
    let cancelled = false
    const limit = Math.max(PAGE_SIZE, countRef.current)
    listNotifications({ offset: 0, limit })
      .then((list) => {
        if (cancelled) return
        setItems(list)
        setHasMore(list.length === limit)
        setError('')
        setLoaded(true)
      })
      .catch((err) => {
        if (cancelled) return
        console.error('알림 목록 불러오기 실패:', err)
        setError('알림을 불러오지 못했어요')
        setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [version])

  const loadMore = useCallback(async () => {
    if (loadingMore.current || !hasMore) return
    loadingMore.current = true
    try {
      const list = await listNotifications({ offset: countRef.current, limit: PAGE_SIZE })
      setItems((prev) => {
        const seen = new Set(prev.map((x) => x.id))
        return [...prev, ...list.filter((x) => !seen.has(x.id))]
      })
      setHasMore(list.length === PAGE_SIZE)
    } catch (err) {
      console.error('알림 더 불러오기 실패:', err)
    } finally {
      loadingMore.current = false
    }
  }, [hasMore])

  const handleScroll = (e) => {
    const el = e.currentTarget
    if (el.scrollHeight - el.scrollTop - el.clientHeight < LOAD_MORE_DISTANCE) loadMore()
  }

  const handleOpen = async (n) => {
    const opened = await openNotification(n)
    if (opened) onClose()
  }

  const hasUnread = unreadIds.size > 0

  return (
    <div className="fixed inset-0 z-[60] bg-pastel-text/40" onClick={onClose}>
      <div className="relative mx-auto h-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <section
          role="dialog"
          aria-modal="true"
          aria-label="알림"
          className="notif-slide-in flex h-full w-full flex-col border-l-2 border-pastel-border bg-pastel-bg"
        >
          <header className="flex items-center justify-between gap-2 border-b-2 border-pastel-border bg-pastel-box px-3 pb-2 pt-[calc(env(safe-area-inset-top)+8px)]">
            <div className="flex items-center gap-2">
              <BellIcon className="h-4 w-4 text-pastel-border" />
              <h2 className="font-title text-[14px] text-pastel-text">알림</h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={markAllRead}
                disabled={!hasUnread}
                className="pixel-tile font-body border-2 border-pastel-border bg-pastel-accent px-2 py-1 text-[11px] text-pastel-text disabled:opacity-40"
              >
                모두 읽음
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="닫기"
                className="font-title text-[14px] text-pastel-text"
              >
                ✕
              </button>
            </div>
          </header>

          <div
            className="flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)]"
            onScroll={handleScroll}
          >
            {!loaded ? (
              <p className="font-body pt-10 text-center text-[11px] text-pastel-text">불러오는 중...</p>
            ) : error && items.length === 0 ? (
              <p className="font-body pt-10 text-center text-[11px] text-pastel-border">{error}</p>
            ) : items.length === 0 ? (
              <p className="font-body pt-10 text-center text-[11px] text-pastel-text">
                아직 알림이 없어요
              </p>
            ) : (
              <>
                {items.map((n) => (
                  <NotificationRow key={n.id} n={n} unread={unreadIds.has(n.id)} onOpen={handleOpen} />
                ))}
                {hasMore && (
                  <p className="font-body py-3 text-center text-[11px] text-pastel-text/70">
                    불러오는 중...
                  </p>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

// 모든 화면 우측 상단에 고정된 종 아이콘(안 읽은 개수 배지) + 눌렀을 때 열리는 알림 패널
export default function NotificationCenter() {
  const { total } = useNotifications()
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="pointer-events-none fixed left-1/2 top-[calc(env(safe-area-inset-top)+8px)] z-40 w-full max-w-md -translate-x-1/2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={total > 0 ? `알림 ${total}개` : '알림'}
          className="pixel-tile pointer-events-auto absolute right-3 top-0 flex h-8 w-8 items-center justify-center border-2 border-pastel-border bg-pastel-bg"
        >
          <BellIcon className="h-4 w-4 text-pastel-border" />
          {total > 0 && (
            <span className="font-body absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center border border-pastel-text bg-[#E5383B] px-[3px] text-[11px] leading-none text-white">
              {total > 99 ? '99+' : total}
            </span>
          )}
        </button>
      </div>
      {open && <NotificationPanel onClose={() => setOpen(false)} />}
    </>
  )
}
