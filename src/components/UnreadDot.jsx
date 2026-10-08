// 안 읽은 알림이 있을 때 보이는 작은 빨간 픽셀 점 (8x8, 어두운 1px 테두리).
// 기본은 부모(relative) 모서리에 붙는 절대 위치, inline이면 글자 옆에 그냥 붙음.
export default function UnreadDot({ show, inline = false, className = '' }) {
  if (!show) return null
  return (
    <span
      role="img"
      aria-label="안 읽은 알림"
      className={`pointer-events-none inline-block h-2 w-2 border border-pastel-text bg-[#E5383B] ${
        inline ? '' : 'absolute'
      } ${className}`}
    />
  )
}
