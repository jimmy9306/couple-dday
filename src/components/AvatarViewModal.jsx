import AvatarSVG from './AvatarSVG'

// 상대 캐릭터 보기 전용 팝업 — 꾸미기 버튼 없음.
export default function AvatarViewModal({ gender, name, config, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-pastel-text/40 px-6"
      onClick={onClose}
    >
      <div className="w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
        <div className="border-2 border-pastel-border bg-pastel-box">
          <div className="flex items-center justify-between border-b-2 border-pastel-border p-3">
            <h3 className="font-title text-[14px] text-pastel-text">{name}의 코디</h3>
            <button type="button" onClick={onClose} className="font-title text-[14px] text-pastel-text">
              ✕
            </button>
          </div>
          <div className="flex flex-col items-center gap-2 p-5">
            <AvatarSVG gender={gender} config={config} className="h-[150px] w-[100px]" />
          </div>
        </div>
      </div>
    </div>
  )
}
