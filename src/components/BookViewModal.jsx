import { useState } from 'react'
import BookCover from './BookCover'
import BookReviewSection from './BookReviewSection'
import ConfirmDialog from './ConfirmDialog'

export default function BookViewModal({
  book,
  currentUserId,
  authorName,
  onClose,
  onEdit,
  onDelete,
  onReviewsChanged,
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-pastel-text/40 px-6"
      onClick={onClose}
    >
      <div className="w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
        <div className="flex max-h-[85vh] flex-col border-2 border-pastel-border bg-pastel-box">
          <div className="flex items-center justify-between border-b-2 border-pastel-border p-3">
            <h3 className="font-title text-[14px] text-pastel-text">책 정보</h3>
            <button type="button" onClick={onClose} className="font-title text-[14px] text-pastel-text">
              ✕
            </button>
          </div>

          <div className="flex flex-1 flex-col items-center gap-2 overflow-y-auto p-4">
            <BookCover
              title={book.title}
              coverUrl={book.coverUrl}
              className="h-48 w-32"
              textClassName="text-[32px]"
            />
            <h4 className="font-title mt-1 text-center text-[14px] text-pastel-text">{book.title}</h4>
            {book.author && <p className="font-body text-[11px] text-pastel-accent">{book.author}</p>}
            <span
              className={`font-title border-2 border-pastel-border px-2 py-0.5 text-[11px] text-pastel-text ${
                book.status === 'read' ? 'bg-pastel-accent' : 'bg-pastel-bg'
              }`}
            >
              {book.status === 'read' ? '읽음!' : '읽는 중'}
            </span>
            {book.createdBy && (
              <p className="font-body text-[11px] text-pastel-accent">등록: {book.createdBy}</p>
            )}

            <BookReviewSection
              bookId={book.id}
              currentUserId={currentUserId}
              authorName={authorName}
              onChanged={onReviewsChanged}
            />
          </div>

          <div className="flex gap-2 border-t-2 border-pastel-border p-3">
            <button
              type="button"
              onClick={onEdit}
              className="pixel-btn font-title flex-1 border-2 border-pastel-border bg-pastel-bg py-2 text-[14px] text-pastel-text"
            >
              수정
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="pixel-btn font-title flex-1 border-2 border-pastel-border bg-pastel-border py-2 text-[14px] text-pastel-bg"
            >
              삭제
            </button>
          </div>
        </div>
      </div>

      {confirmingDelete && (
        <ConfirmDialog
          detail={book.title}
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
