// 계단식(스텝) 픽셀 테두리 + 블러 없는 하드 섀도우 패널.
// clip-path로 모서리를 계단 모양으로 깎고, 바깥(테두리색) + 안쪽(박스색) 2겹 구조로
// "두꺼운 테두리"를 표현한다. 그림자는 filter:drop-shadow로 clip 모양을 그대로 따라간다.
const STEP = 6

const CLIP = `polygon(
  0 ${STEP}px, ${STEP}px ${STEP}px, ${STEP}px 0,
  calc(100% - ${STEP}px) 0, calc(100% - ${STEP}px) ${STEP}px, 100% ${STEP}px,
  100% calc(100% - ${STEP}px), calc(100% - ${STEP}px) calc(100% - ${STEP}px), calc(100% - ${STEP}px) 100%,
  ${STEP}px 100%, ${STEP}px calc(100% - ${STEP}px), 0 calc(100% - ${STEP}px)
)`

export default function PixelPanel({ children, className = '', innerClassName = '' }) {
  return (
    <div
      className={`bg-pastel-border p-1 ${className}`}
      style={{ clipPath: CLIP, filter: 'drop-shadow(4px 4px 0 #D6457A)' }}
    >
      <div className={`bg-pastel-box ${innerClassName}`} style={{ clipPath: CLIP }}>
        {children}
      </div>
    </div>
  )
}
