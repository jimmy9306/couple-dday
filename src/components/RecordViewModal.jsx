import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import {
  addComment,
  deleteComment,
  listComments,
  subscribeToChanges,
  updateComment,
} from '../lib/store'
import ConfirmDialog from './ConfirmDialog'

function previewText(text, max = 24) {
  if (!text) return ''
  return text.length > max ? `${text.slice(0, max)}…` : text
}

function formatCommentTime(iso) {
  try {
    return format(parseISO(iso), 'MM.dd HH:mm')
  } catch {
    return ''
  }
}

function CommentRow({ comment, isMine, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(comment.content)
  const [busy, setBusy] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const submit = async () => {
    if (!text.trim()) return
    setBusy(true)
    try {
      await onEdit(comment.id, text.trim())
      setEditing(false)
    } finally {
      setBusy(false)
    }
  }

  if (editing) {
    return (
      <li className="border-2 border-pastel-border bg-pastel-bg px-2 py-1.5">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          className="font-body w-full min-w-0 resize-none border-2 border-pastel-border bg-pastel-box px-2 py-1 text-[11px] text-pastel-text outline-none"
        />
        <div className="mt-1 flex gap-3">
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="font-body text-[11px] text-pastel-border underline disabled:opacity-50"
          >
            저장
          </button>
          <button
            type="button"
            onClick={() => {
              setText(comment.content)
              setEditing(false)
            }}
            className="font-body text-[11px] text-pastel-accent underline"
          >
            취소
          </button>
        </div>
      </li>
    )
  }

  return (
    <li className="border-2 border-pastel-border bg-pastel-bg px-2 py-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-title text-[11px] text-pastel-text">{comment.createdBy}</span>
        <span className="font-body flex-shrink-0 text-[11px] text-pastel-accent">
          {formatCommentTime(comment.createdAt)}
        </span>
      </div>
      <p className="font-body whitespace-pre-wrap text-[11px] text-pastel-text">
        {comment.content}
      </p>
      {isMine && (
        <div className="mt-1 flex gap-3">
          <button
            type="button"
            onClick={() => setEditing(true)}
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
          detail={previewText(comment.content)}
          onConfirm={async () => {
            await onDelete(comment.id)
            setConfirmingDelete(false)
          }}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </li>
  )
}

// 날짜별 기록 목록에서 항목 하나를 탭했을 때 뜨는 팝업.
// 작성자 본인이면 헤더에 수정/삭제가 보이고, 상대는 보기+댓글만 가능.
// 사진 아래에 댓글 목록, 맨 아래에 댓글 입력창이 고정으로 붙는다.
export default function RecordViewModal({
  record,
  isOwner,
  currentUserId,
  authorName,
  onClose,
  onEdit,
  onDelete,
}) {
  const [comments, setComments] = useState([])
  const [loadingComments, setLoadingComments] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [posting, setPosting] = useState(false)
  const [commentError, setCommentError] = useState('')
  const [confirmingDeletePost, setConfirmingDeletePost] = useState(false)

  const loadComments = async () => {
    const list = await listComments(record.id)
    setComments(list)
    setLoadingComments(false)
  }

  useEffect(() => {
    loadComments()
    const unsubscribe = subscribeToChanges(loadComments)
    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record.id])

  const handlePost = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    setPosting(true)
    setCommentError('')
    try {
      await addComment({
        recordId: record.id,
        content: newComment.trim(),
        createdBy: authorName,
        userId: currentUserId,
      })
      setNewComment('')
      await loadComments()
    } catch (err) {
      setCommentError(
        err?.code === '42P01' || err?.code === 'PGRST205'
          ? '아직 댓글 기능 준비 중이에요 (관리자가 SQL을 실행하면 바로 쓸 수 있어요).'
          : err.message || '댓글 등록에 실패했어요.'
      )
    } finally {
      setPosting(false)
    }
  }

  const handleEditComment = async (id, content) => {
    await updateComment(id, content)
    await loadComments()
  }

  const handleDeleteComment = async (id) => {
    await deleteComment(id)
    await loadComments()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-pastel-text/40 sm:items-center">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col border-2 border-b-0 border-pastel-border bg-pastel-box sm:border-b-2">
        <div className="flex items-start justify-between gap-3 border-b-2 border-pastel-border p-4">
          <div className="min-w-0">
            <h3 className="font-title truncate text-[14px] text-pastel-text">
              {record.title || '(제목 없음)'}
            </h3>
            <p className="font-body text-[11px] text-pastel-accent">{record.createdBy}</p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-3">
            {isOwner && (
              <>
                <button
                  type="button"
                  onClick={onEdit}
                  className="font-body text-[11px] text-pastel-text underline"
                >
                  수정
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDeletePost(true)}
                  className="font-body text-[11px] text-pastel-border underline"
                >
                  삭제
                </button>
              </>
            )}
            <button type="button" onClick={onClose} className="font-title text-[14px] text-pastel-text">
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {record.memo && (
            <p className="font-body whitespace-pre-wrap text-[11px] text-pastel-text">
              {record.memo}
            </p>
          )}
          {record.photoUrl && (
            <img
              src={record.photoUrl}
              alt="기록 사진"
              className="max-h-[60vh] w-full border-2 border-pastel-border bg-pastel-bg object-contain"
            />
          )}
          {!record.memo && !record.photoUrl && (
            <p className="font-body text-[11px] text-pastel-accent">내용이 없어요.</p>
          )}

          <div className="border-t-2 border-pastel-border pt-3">
            <p className="font-title mb-2 text-[11px] text-pastel-text">댓글</p>
            {loadingComments ? (
              <p className="font-body text-[11px] text-pastel-accent">불러오는 중...</p>
            ) : comments.length === 0 ? (
              <p className="font-body text-[11px] text-pastel-accent">아직 댓글이 없어요.</p>
            ) : (
              <ul className="space-y-2">
                {comments.map((c) => (
                  <CommentRow
                    key={c.id}
                    comment={c}
                    isMine={c.userId != null && c.userId === currentUserId}
                    onEdit={handleEditComment}
                    onDelete={handleDeleteComment}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>

        <form
          onSubmit={handlePost}
          className="flex flex-col gap-2 border-t-2 border-pastel-border p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]"
        >
          {commentError && (
            <p className="font-body text-[11px] text-pastel-border">{commentError}</p>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="댓글을 입력하세요"
              className="font-body min-w-0 flex-1 border-2 border-pastel-border bg-pastel-bg px-2 py-2 text-[11px] text-pastel-text outline-none"
            />
            <button
              type="submit"
              disabled={posting}
              className="pixel-btn font-title flex-shrink-0 border-2 border-pastel-border bg-pastel-accent px-3 py-2 text-[11px] text-pastel-text disabled:opacity-50"
            >
              등록
            </button>
          </div>
        </form>
      </div>

      {confirmingDeletePost && (
        <ConfirmDialog
          detail="사진과 댓글도 함께 삭제돼요"
          onConfirm={async () => {
            await onDelete()
            setConfirmingDeletePost(false)
          }}
          onCancel={() => setConfirmingDeletePost(false)}
        />
      )}
    </div>
  )
}
