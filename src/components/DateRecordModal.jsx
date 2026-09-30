import { useEffect, useState } from 'react'
import { compressPhoto } from '../lib/compress'
import { deleteDateRecord, upsertDateRecord } from '../lib/store'

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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-[28px] border-x-[3px] border-t-[3px] border-love-500 bg-white p-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] shadow-[0_-4px_22px_rgba(199,125,214,0.35)] sm:rounded-[28px] sm:border-b-[3px]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-glow text-base font-bold text-love-700">{dateStr}</h3>
            {anniversaryLabel && (
              <span className="mt-1 inline-block rounded-full bg-love-100 px-2.5 py-0.5 text-xs font-semibold text-love-600">
                💗 {anniversaryLabel}
              </span>
            )}
          </div>
          <button type="button" onClick={onClose} className="text-xl text-gray-400">
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-3">
          <input
            type="text"
            placeholder="제목"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-love-200 px-4 py-3 text-sm outline-none focus:border-love-400"
          />
          <textarea
            placeholder="메모"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-xl border border-love-200 px-4 py-3 text-sm outline-none focus:border-love-400"
          />

          <div>
            <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-love-300 py-3 text-sm text-love-500">
              {compressing ? '사진 처리 중...' : '사진 선택'}
              <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
            </label>
            {photoPreview && (
              <img
                src={photoPreview}
                alt="첨부 사진 미리보기"
                className="mt-2 max-h-56 w-full rounded-xl object-cover"
              />
            )}
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-2 pt-1">
            {record?.id && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={busy}
                className="flex-1 rounded-xl border border-red-200 py-3 text-sm font-semibold text-red-500 disabled:opacity-50"
              >
                삭제
              </button>
            )}
            <button
              type="submit"
              disabled={busy || compressing}
              className="flex-1 rounded-xl bg-love-500 py-3 text-sm font-semibold text-white shadow-[0_0_10px_rgba(199,125,214,0.5)] disabled:opacity-50"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
