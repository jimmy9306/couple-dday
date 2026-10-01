// 날짜별 기록 목록에서 항목 하나를 탭했을 때 뜨는 "보기 전용" 팝업.
// 작성자 본인이면 수정/삭제 버튼이 보이고, 상대는 보기만 가능.
export default function RecordViewModal({ record, isOwner, onClose, onEdit, onDelete }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-pastel-text/40 sm:items-center">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col border-2 border-b-0 border-pastel-border bg-pastel-box sm:border-b-2">
        <div className="flex items-center justify-between gap-3 border-b-2 border-pastel-border p-4">
          <div className="min-w-0">
            <h3 className="font-title truncate text-[14px] text-pastel-text">
              {record.title || '(제목 없음)'}
            </h3>
            <p className="font-body text-[11px] text-pastel-accent">{record.createdBy}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-title flex-shrink-0 text-[14px] text-pastel-text"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto p-4">
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
        </div>

        {isOwner && (
          <div className="flex gap-2 border-t-2 border-pastel-border p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
            <button
              type="button"
              onClick={onDelete}
              className="pixel-btn font-title flex-1 border-2 border-pastel-border bg-pastel-bg py-2 text-[14px] text-pastel-text"
            >
              삭제
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="pixel-btn font-title flex-1 border-2 border-pastel-border bg-pastel-accent py-2 text-[14px] text-pastel-text"
            >
              수정
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
