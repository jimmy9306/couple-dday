import { useState } from 'react'
import PixelPanel from './PixelPanel'

// 삭제 등 되돌릴 수 없는 작업 전에 띄우는 공통 확인 팝업.
// 바깥 영역을 탭하거나 취소를 누르면 아무 일 없이 닫힘. 삭제 버튼은 연타해도
// 한 번만 실행되게 busy 상태로 막음.
export default function ConfirmDialog({
  message = '정말 삭제하시겠습니까?',
  detail,
  onConfirm,
  onCancel,
}) {
  const [busy, setBusy] = useState(false)

  const handleConfirm = async () => {
    if (busy) return
    setBusy(true)
    try {
      await onConfirm()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-pastel-text/40 px-6"
      onClick={onCancel}
    >
      <div className="w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
        <PixelPanel innerClassName="p-5 text-center">
          <p className="font-title text-[14px] text-pastel-text">{message}</p>
          {detail && (
            <p className="font-body mt-2 truncate text-[11px] text-pastel-accent">{detail}</p>
          )}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="pixel-btn font-title flex-1 border-2 border-pastel-border bg-pastel-bg py-2 text-[14px] text-pastel-text"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={busy}
              className="pixel-btn font-title flex-1 border-2 border-pastel-border bg-pastel-border py-2 text-[14px] text-pastel-bg disabled:opacity-50"
            >
              삭제
            </button>
          </div>
        </PixelPanel>
      </div>
    </div>
  )
}
