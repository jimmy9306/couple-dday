import { useEffect, useState } from 'react'
import { compressPhoto } from '../lib/compress'
import { addBook, updateBook } from '../lib/store'

const TABLE_MISSING_CODES = ['PGRST205', '42P01']

export default function BookFormModal({ book, authorName, userId, onClose, onSaved }) {
  const [title, setTitle] = useState(book?.title || '')
  const [author, setAuthor] = useState(book?.author || '')
  const [status, setStatus] = useState(book?.status || 'reading')
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(book?.coverUrl || null)
  const [compressing, setCompressing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    return () => {
      if (coverPreview && coverPreview.startsWith('blob:')) {
        URL.revokeObjectURL(coverPreview)
      }
    }
  }, [coverPreview])

  const handleCoverChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCompressing(true)
    setError('')
    try {
      const compressed = await compressPhoto(file)
      setCoverFile(compressed)
      setCoverPreview(URL.createObjectURL(compressed))
    } catch {
      setError('사진 처리에 실패했어요.')
    } finally {
      setCompressing(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || busy) return
    setBusy(true)
    setError('')
    try {
      if (book?.id) {
        await updateBook(book.id, {
          title: title.trim(),
          author: author.trim(),
          status,
          coverFile,
        })
      } else {
        await addBook({
          title: title.trim(),
          author: author.trim(),
          status,
          coverFile,
          createdBy: authorName,
          userId,
        })
      }
      onSaved()
    } catch (err) {
      setError(
        TABLE_MISSING_CODES.includes(err?.code)
          ? '아직 북클럽 기능 준비 중이에요 (관리자가 SQL을 실행하면 바로 쓸 수 있어요).'
          : err.message || '저장에 실패했어요.'
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-pastel-text/40 sm:items-center">
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[90vh] w-full max-w-md flex-col border-2 border-b-0 border-pastel-border bg-pastel-box sm:border-b-2"
      >
        <div className="flex items-center justify-between border-b-2 border-pastel-border p-4">
          <h3 className="font-title text-[14px] text-pastel-text">
            {book?.id ? '책 수정' : '책 추가'}
          </h3>
          <button type="button" onClick={onClose} className="font-title text-[14px] text-pastel-text">
            ✕
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto p-4">
          <input
            type="text"
            placeholder="책 제목 (필수)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="font-body w-full min-w-0 border-2 border-pastel-border bg-pastel-bg px-3 py-2 text-[11px] text-pastel-text outline-none"
            style={{ WebkitAppearance: 'none', boxSizing: 'border-box' }}
          />
          <input
            type="text"
            placeholder="저자"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="font-body w-full min-w-0 border-2 border-pastel-border bg-pastel-bg px-3 py-2 text-[11px] text-pastel-text outline-none"
            style={{ WebkitAppearance: 'none', boxSizing: 'border-box' }}
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStatus('reading')}
              className={`pixel-btn font-title flex-1 border-2 border-pastel-border py-2 text-[11px] text-pastel-text ${
                status === 'reading' ? 'bg-pastel-accent' : 'bg-pastel-bg'
              }`}
            >
              읽는 중
            </button>
            <button
              type="button"
              onClick={() => setStatus('read')}
              className={`pixel-btn font-title flex-1 border-2 border-pastel-border py-2 text-[11px] text-pastel-text ${
                status === 'read' ? 'bg-pastel-accent' : 'bg-pastel-bg'
              }`}
            >
              읽음
            </button>
          </div>

          <div>
            <label className="font-body flex cursor-pointer items-center justify-center border-2 border-dashed border-pastel-border py-2 text-[11px] text-pastel-text">
              {compressing ? '사진 처리 중...' : '표지 사진 선택 (선택)'}
              <input type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
            </label>
            {coverPreview && (
              <img
                src={coverPreview}
                alt="표지 미리보기"
                className="mx-auto mt-2 h-40 w-28 border-2 border-pastel-border bg-pastel-bg object-cover"
              />
            )}
          </div>

          {error && <p className="font-body text-[11px] text-pastel-border">{error}</p>}
        </div>

        <div className="flex gap-2 border-t-2 border-pastel-border p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          <button
            type="submit"
            disabled={busy || compressing || !title.trim()}
            className="pixel-btn font-title flex-1 border-2 border-pastel-border bg-pastel-accent py-2 text-[14px] text-pastel-text disabled:opacity-50"
          >
            저장
          </button>
        </div>
      </form>
    </div>
  )
}
