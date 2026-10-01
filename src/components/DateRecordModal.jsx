import { useEffect, useState } from 'react'
import { compressPhoto } from '../lib/compress'
import { deleteDateRecord, upsertDateRecord } from '../lib/store'
import { HeartIcon } from './icons'

export default function DateRecordModal({ dateStr, record, anniversaryLabel, authorName, onClose, onSaved, onDeleted }) {
  const [title, setTitle] = useState(record?.title || '')
  const [memo, setMemo] = useState(record?.memo || '')
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(record?.photoUrl || null)
  const [compressing, setCompressing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    return () => {
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview)
      }
    }
  }, [photoPreview])

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCompressing(true)
    setError('')
    try {
      const compressed = await compressPhoto(file)
      setPhotoFile(compressed)
      setPhotoPreview(URL.createObjectURL(compressed))
    } catch (err) {
      setError('사진 처리에 실패했어요.')
    } finally {
      setCompressing(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await upsertDateRecord({
        id: record?.id,
        date: dateStr,
        title: title.trim(),
        memo: memo.trim(),
        photoFile,
        createdBy: authorName,
      })
      onSaved()
    } catch (err) {
      setError(err.message || '저장에 실패했어요.')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!record?.id) return
    if (!confirm('이 기록을 삭제할까요?')) return
    setBusy(true)
    try {
      await deleteDateRecord(record.id)
      onDeleted()
    } catch (err) {
      setError(err.message || '삭제에 실패했어요.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-pastel-text/40 sm:items-center">
      <form
        onSubmit={handleSave}
        className="flex max-h-[90vh] w-full max-w-md flex-col border-2 border-b-0 border-pastel-border bg-pastel-box sm:border-b-2"
      >
        <div className="flex items-center justify-between border-b-2 border-pastel-border p-4">
          <div>
            <h3 className="font-title text-[14px] text-pastel-text">{dateStr}</h3>
            {anniversaryLabel && (
              <span className="mt-1 inline-flex items-center gap-1 border-2 border-pastel-border bg-pastel-accent px-2 py-0.5 text-[11px] text-pastel-text">
                <HeartIcon className="h-3 w-3" />
                {anniversaryLabel}
              </span>
            )}
          </div>
          <button type="button" onClick={onClose} className="font-title text-[14px] text-pastel-text">
            ✕
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto p-4">
          <input
            type="text"
            placeholder="제목"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="font-body w-full min-w-0 border-2 border-pastel-border bg-pastel-bg px-3 py-2 text-[11px] text-pastel-text outline-none"
            style={{ WebkitAppearance: 'none', boxSizing: 'border-box' }}
          />
          <textarea
            placeholder="메모"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={3}
            className="font-body w-full min-w-0 resize-none border-2 border-pastel-border bg-pastel-bg px-3 py-2 text-[11px] text-pastel-text outline-none"
            style={{ boxSizing: 'border-box' }}
          />

          <div>
            <label className="font-body flex cursor-pointer items-center justify-center border-2 border-dashed border-pastel-border py-2 text-[11px] text-pastel-text">
              {compressing ? '사진 처리 중...' : '사진 선택'}
              <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
            </label>
            {photoPreview && (
              <img
                src={photoPreview}
                alt="첨부 사진 미리보기"
                className="mt-2 max-h-[50vh] w-full border-2 border-pastel-border bg-pastel-bg object-contain"
              />
            )}
          </div>

          {error && <p className="font-body text-[11px] text-pastel-border">{error}</p>}
        </div>

        <div className="flex gap-2 border-t-2 border-pastel-border p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          {record?.id && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy}
              className="pixel-btn font-title flex-1 border-2 border-pastel-border bg-pastel-bg py-2 text-[14px] text-pastel-text disabled:opacity-50"
            >
              삭제
            </button>
          )}
          <button
            type="submit"
            disabled={busy || compressing}
            className="pixel-btn font-title flex-1 border-2 border-pastel-border bg-pastel-accent py-2 text-[14px] text-pastel-text disabled:opacity-50"
          >
            저장
          </button>
        </div>
      </form>
    </div>
  )
}
