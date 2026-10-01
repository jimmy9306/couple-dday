import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import {
  addBookReview,
  deleteBookReview,
  listBookReviews,
  subscribeToChanges,
  updateBookReview,
} from '../lib/store'
import ConfirmDialog from './ConfirmDialog'

const MAX_LENGTH = 50
const TABLE_MISSING_CODES = ['PGRST205', '42P01']

function previewText(text, max = 20) {
  if (!text) return ''
  return text.length > max ? `${text.slice(0, max)}…` : text
}

function formatDate(iso) {
  try {
    return format(parseISO(iso), 'yyyy.MM.dd')
  } catch {
    return ''
  }
}

function ReviewBubble({ review, isMine, onEdit, onDelete }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  return (
    <div className="border-2 border-pastel-border bg-pastel-bg px-2 py-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-title text-[11px] text-pastel-text">{review.createdBy}</span>
        <span className="font-body flex-shrink-0 text-[11px] text-pastel-accent">
          {formatDate(review.createdAt)}
        </span>
      </div>
      <p className="font-body mt-1 whitespace-pre-wrap text-[11px] text-pastel-text">
        {review.content}
      </p>
      {isMine && (
        <div className="mt-1 flex gap-3">
          <button
            type="button"
            onClick={onEdit}
            className="font-body text-[11px] text-pastel-text underline"
          >
            수정
          </button>
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="font-body text-[11px] text-pastel-border underline"
          >
            삭제
          </button>
        </div>
      )}
      {confirmingDelete && (
        <ConfirmDialog
          detail={previewText(review.content)}
          onConfirm={async () => {
            await onDelete()
            setConfirmingDelete(false)
          }}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  )
}

// 책 하나당 한줄평 2개(작성자당 1개)를 보여주고 추가/수정/삭제를 처리.
// 내 한줄평만 수정/삭제 가능, 상대 것은 조회만.
export default function BookReviewSection({
  bookId,
  bookStatus,
  currentUserId,
  authorName,
  onChanged,
}) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    const list = await listBookReviews(bookId)
    setReviews(list)
    setLoading(false)
  }

  useEffect(() => {
    load()
    const unsubscribe = subscribeToChanges(load)
    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId])

  const myReview = reviews.find((r) => r.userId === currentUserId)
  const otherReview = reviews.find((r) => r.userId !== currentUserId)
  const canAddReview = bookStatus === 'read'

  const startAdd = () => {
    setDraft('')
    setEditing(true)
    setError('')
  }

  const startEdit = () => {
    setDraft(myReview?.content || '')
    setEditing(true)
    setError('')
  }

  const cancelEdit = () => {
    setEditing(false)
    setDraft('')
    setError('')
  }

  const save = async () => {
    const content = draft.trim()
    if (!content || busy) return
    setBusy(true)
    setError('')
    try {
      if (myReview) {
        await updateBookReview(myReview.id, content)
      } else {
        await addBookReview({ bookId, content, createdBy: authorName, userId: currentUserId })
      }
      setEditing(false)
      setDraft('')
      await load()
      onChanged?.()
    } catch (err) {
      setError(
        TABLE_MISSING_CODES.includes(err?.code)
          ? '아직 한줄평 기능 준비 중이에요 (관리자가 SQL을 실행하면 바로 쓸 수 있어요).'
          : err.message || '저장에 실패했어요.'
      )
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!myReview) return
    await deleteBookReview(myReview.id)
    await load()
    onChanged?.()
  }

  return (
    <div className="w-full border-t-2 border-pastel-border pt-3">
      <p className="font-title mb-2 text-[11px] text-pastel-text">한줄평</p>

      {loading ? (
        <p className="font-body text-[11px] text-pastel-accent">불러오는 중...</p>
      ) : (
        <div className="space-y-2">
          {myReview && !editing && (
            <ReviewBubble review={myReview} isMine onEdit={startEdit} onDelete={remove} />
          )}

          {!myReview &&
            !editing &&
            (canAddReview ? (
              <button
                type="button"
                onClick={startAdd}
                className="pixel-btn font-title w-full border-2 border-pastel-border bg-pastel-bg py-1.5 text-[11px] text-pastel-text"
              >
                + 한줄평 남기기
              </button>
            ) : (
              <div>
                <button
                  type="button"
                  disabled
                  className="font-title w-full cursor-not-allowed border-2 border-pastel-border bg-[#E5DDE0] py-1.5 text-[11px] text-[#A8949B]"
                >
                  + 한줄평 남기기
                </button>
                <p className="font-body mt-1 text-center text-[11px] text-pastel-accent">
                  다 읽어야 한줄평을 남길 수가 있어요.
                </p>
              </div>
            ))}

          {editing && (
            <div className="border-2 border-pastel-border bg-pastel-bg px-2 py-1.5">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value.slice(0, MAX_LENGTH))}
                rows={2}
                maxLength={MAX_LENGTH}
                placeholder="한줄평을 남겨보세요"
                className="font-body w-full min-w-0 resize-none border-2 border-pastel-border bg-pastel-box px-2 py-1 text-[11px] text-pastel-text outline-none"
              />
              <div className="mt-1 flex items-center justify-between">
                <span className="font-body text-[11px] text-pastel-accent">
                  {MAX_LENGTH - draft.length}자 남음
                </span>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="font-body text-[11px] text-pastel-accent underline"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={save}
                    disabled={busy || !draft.trim()}
                    className="font-body text-[11px] text-pastel-border underline disabled:opacity-50"
                  >
                    저장
                  </button>
                </div>
              </div>
              {error && <p className="font-body mt-1 text-[11px] text-pastel-border">{error}</p>}
            </div>
          )}

          {otherReview ? (
            <ReviewBubble review={otherReview} isMine={false} />
          ) : (
            canAddReview && (
              <p className="font-body text-[11px] text-pastel-accent">아직 한줄평이 없어요</p>
            )
          )}
        </div>
      )}
    </div>
  )
}
