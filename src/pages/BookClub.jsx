import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import {
  deleteBook,
  listAllBookReviews,
  listBooks,
  subscribeToChanges,
  updateBook,
} from '../lib/store'
import BookCover from '../components/BookCover'
import BookFormModal from '../components/BookFormModal'
import BookViewModal from '../components/BookViewModal'
import ConfirmDialog from '../components/ConfirmDialog'
import useFocusTarget from '../lib/useFocusTarget'
import { BookIcon } from '../components/icons'

const SHELF_ROWS = 2
const SLOTS_PER_ROW = 8
const MAX_SHOWN = SHELF_ROWS * SLOTS_PER_ROW
const SPINE_COLORS = ['bg-pastel-accent', 'bg-pastel-box', 'bg-pastel-border']
const SPINE_HEIGHTS = [26, 34, 22, 30, 24, 32, 20, 28]
const PAGE_SIZE = 5

function Bookshelf({ count, expanded, onToggle }) {
  const shown = Math.min(count, MAX_SHOWN)
  const rowCounts = Array.from({ length: SHELF_ROWS }, (_, rowIdx) => {
    const start = rowIdx * SLOTS_PER_ROW
    return Math.max(0, Math.min(SLOTS_PER_ROW, shown - start))
  })

  return (
    <button
      type="button"
      onClick={onToggle}
      className="pixel-tile flex w-full flex-col gap-4 border-2 border-pastel-border bg-pastel-box p-4"
    >
      {rowCounts.map((inRow, rowIdx) => (
        <div key={rowIdx} className="flex flex-col">
          <div className="flex h-10 items-end gap-[3px] px-1">
            {Array.from({ length: inRow }).map((_, i) => {
              const slot = rowIdx * SLOTS_PER_ROW + i
              return (
                <span
                  key={i}
                  className={`w-[10px] border-2 border-pastel-border ${SPINE_COLORS[slot % SPINE_COLORS.length]}`}
                  style={{ height: SPINE_HEIGHTS[slot % SPINE_HEIGHTS.length] }}
                />
              )
            })}
          </div>
          <div className="h-2 bg-pastel-border" />
          <div className="h-1 bg-pastel-accent" />
        </div>
      ))}
      <span className="font-body text-[11px] text-pastel-accent">
        {expanded ? '탭해서 접기 ▲' : '탭해서 목록 보기 ▼'}
      </span>
    </button>
  )
}

function IngDots() {
  const pattern = [1, 2, 3, 2]
  const [step, setStep] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStep((s) => (s + 1) % pattern.length)
    }, 450)
    return () => window.clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <span>{'.'.repeat(pattern[step])}</span>
}

function StatusBadge({ status, onRequestMarkRead }) {
  if (status === 'read') {
    return (
      <span className="pixel-stamp-pop font-title inline-flex w-14 flex-shrink-0 items-center justify-center border-2 border-pastel-border bg-pastel-bg px-1.5 py-0.5 text-[11px] text-pastel-text">
        읽음!
      </span>
    )
  }
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation()
        onRequestMarkRead?.()
      }}
      className="font-title inline-flex w-14 flex-shrink-0 items-center justify-center border-2 border-pastel-border bg-pastel-accent px-1.5 py-0.5 text-[11px] text-white"
    >
      ing
      <IngDots />
    </span>
  )
}

export default function BookClub() {
  const { authorName, userId } = useAuth()
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [viewBook, setViewBook] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingBook, setEditingBook] = useState(null)
  const [page, setPage] = useState(1)
  const [confirmingReadBook, setConfirmingReadBook] = useState(null)
  const [reviewCounts, setReviewCounts] = useState(new Map())
  const { focus, consume } = useFocusTarget(['book_read', 'book_review'])

  const load = async () => {
    const [bookList, allReviews] = await Promise.all([listBooks(), listAllBookReviews()])
    setBooks(bookList)
    setViewBook((cur) => (cur ? bookList.find((b) => b.id === cur.id) || null : cur))
    const counts = new Map()
    for (const r of allReviews) {
      counts.set(r.bookId, (counts.get(r.bookId) || 0) + 1)
    }
    setReviewCounts(counts)
    setLoading(false)
  }

  useEffect(() => {
    load()
    const unsubscribe = subscribeToChanges(() => load())
    return unsubscribe
  }, [])

  // 알림을 눌러 들어온 경우: 해당 책 정보 팝업을 연다
  useEffect(() => {
    if (!focus || loading) return
    const book = focus.targetId ? books.find((x) => x.id === focus.targetId) : null
    if (book) setViewBook(book)
    consume()
  }, [focus, loading, books, consume])

  const sortedBooks = useMemo(() => {
    return [...books].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  }, [books])

  const totalPages = Math.max(1, Math.ceil(sortedBooks.length / PAGE_SIZE))

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages))
  }, [totalPages])

  const pagedBooks = sortedBooks.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const readCount = books.filter((b) => b.status === 'read').length
  const readingCount = books.filter((b) => b.status === 'reading').length

  const openCreate = () => {
    setEditingBook(null)
    setFormOpen(true)
  }

  const openEditFromView = (book) => {
    setViewBook(null)
    setEditingBook(book)
    setFormOpen(true)
  }

  const handleFormSaved = async () => {
    const wasCreate = !editingBook
    setFormOpen(false)
    setEditingBook(null)
    await load()
    if (wasCreate) setPage(1)
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setEditingBook(null)
  }

  const handleDelete = async (book) => {
    await deleteBook(book.id)
    setViewBook(null)
    await load()
  }

  const handleMarkRead = async () => {
    if (!confirmingReadBook) return
    await updateBook(confirmingReadBook.id, {
      title: confirmingReadBook.title,
      author: confirmingReadBook.author,
      status: 'read',
    })
    setConfirmingReadBook(null)
    await load()
  }

  return (
    <div className="pt-6">
      <div className="mb-4 flex items-center justify-center gap-2">
        <BookIcon className="h-4 w-4 text-pastel-border" />
        <h2 className="font-title text-[14px] text-pastel-text">북클럽</h2>
      </div>

      <div className="mb-3 flex justify-center gap-4">
        <span className="font-body text-[11px] text-pastel-text">읽은 책 {readCount}권</span>
        <span className="font-body text-[11px] text-pastel-text">읽는 중 {readingCount}권</span>
      </div>

      <Bookshelf count={books.length} expanded={expanded} onToggle={() => setExpanded((v) => !v)} />

      {expanded && (
        <div className="mt-4">
          {loading ? (
            <p className="font-body text-center text-[11px] text-pastel-text">불러오는 중...</p>
          ) : sortedBooks.length === 0 ? (
            <p className="font-body text-center text-[11px] text-pastel-text">아직 등록된 책이 없어요.</p>
          ) : (
            <>
              <div className="border-2 border-pastel-border bg-pastel-box">
                {pagedBooks.map((book) => (
                  <button
                    key={book.id}
                    type="button"
                    onClick={() => setViewBook(book)}
                    className="flex w-full items-center gap-3 border-b-2 border-pastel-border px-3 py-2 text-left last:border-b-0"
                  >
                    <BookCover
                      title={book.title}
                      coverUrl={book.coverUrl}
                      className="h-12 w-9"
                      textClassName="text-[14px]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-body truncate text-[11px] text-pastel-text">
                        {book.title}
                        {reviewCounts.get(book.id) > 0 && (
                          <span className="text-pastel-border"> 💬{reviewCounts.get(book.id)}</span>
                        )}
                      </p>
                      {book.author && (
                        <p className="font-body truncate text-[11px] text-pastel-accent">{book.author}</p>
                      )}
                    </div>
                    <StatusBadge
                      status={book.status}
                      onRequestMarkRead={() => setConfirmingReadBook(book)}
                    />
                  </button>
                ))}
              </div>

              {sortedBooks.length > PAGE_SIZE && (
                <div className="mt-3 flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="pixel-btn font-title border-2 border-pastel-border bg-pastel-accent px-3 py-1 text-[14px] text-pastel-text disabled:opacity-40"
                  >
                    ◀
                  </button>
                  <span className="font-body text-[11px] text-pastel-text">
                    {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="pixel-btn font-title border-2 border-pastel-border bg-pastel-accent px-3 py-1 text-[14px] text-pastel-text disabled:opacity-40"
                  >
                    ▶
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div className="pointer-events-none fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2">
        <button
          type="button"
          onClick={openCreate}
          className="pixel-btn font-title pointer-events-auto absolute bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] right-4 flex h-12 w-12 items-center justify-center border-2 border-pastel-border bg-pastel-accent text-[20px] text-pastel-text"
        >
          +
        </button>
      </div>

      {viewBook && (
        <BookViewModal
          book={viewBook}
          currentUserId={userId}
          authorName={authorName}
          onClose={() => {
            setViewBook(null)
            load()
          }}
          onEdit={() => openEditFromView(viewBook)}
          onDelete={() => handleDelete(viewBook)}
          onReviewsChanged={load}
          onBookUpdated={load}
        />
      )}

      {formOpen && (
        <BookFormModal
          book={editingBook}
          authorName={authorName}
          userId={userId}
          onClose={handleFormClose}
          onSaved={handleFormSaved}
        />
      )}

      {confirmingReadBook && (
        <ConfirmDialog
          message="다 읽으셨습니까?"
          detail={confirmingReadBook.title}
          cancelLabel="아직..."
          confirmLabel="읽었어!"
          onConfirm={handleMarkRead}
          onCancel={() => setConfirmingReadBook(null)}
        />
      )}
    </div>
  )
}
