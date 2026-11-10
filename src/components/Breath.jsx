// 겨울 입김: 캐릭터 입 위치에서 하얀 픽셀 구름(3~5칸짜리 덩어리 3개)이 나와 위로 퍼지며 1.5초 동안 사라짐.
// trigger(번호)가 바뀔 때마다 한 번 재생됨 (0이면 아무것도 안 그림). pointer-events:none.
// x, y = 스프라이트(72x96) 왼쪽 위 기준의 입 위치(px). 얼굴 영역(눈 아래 마지막 살색 줄, 머플러 바로 위)에 맞춤.
import { buildOutlinedShape } from '../lib/pixelShapes'

const PX = 3

// 입김 덩어리: 3칸 / 4칸 / 5칸. dx, dy = 끝 위치(px), delay = 시작 지연(초)
const PUFFS = [
  { rows: ['##', '#.'], dx: -9, dy: -27, delay: 0 },
  { rows: ['##', '##'], dx: 0, dy: -33, delay: 0.12 },
  { rows: ['.#.', '###', '.#.'], dx: 10, dy: -24, delay: 0.24 },
].map((p) => ({ ...p, shape: buildOutlinedShape(p.rows) }))

export default function Breath({ trigger, x, y }) {
  if (!trigger) return null
  return (
    <span
      key={trigger}
      aria-hidden="true"
      className="breath-wrap pointer-events-none absolute"
      style={{ left: x, top: y }}
    >
      {PUFFS.map(({ shape, dx, dy, delay }, i) => (
        <span
          key={i}
          className="breath-puff absolute"
          style={{
            left: -(shape.w * PX) / 2,
            top: -(shape.h * PX) / 2,
            '--dx': `${dx}px`,
            '--dy': `${dy}px`,
            animationDelay: `${delay}s`,
          }}
        >
          <svg
            width={shape.w * PX}
            height={shape.h * PX}
            viewBox={`0 0 ${shape.w} ${shape.h}`}
            shapeRendering="crispEdges"
            className="block"
          >
            {shape.rects.map((r) => (
              <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width="1" height="1" fill={r.fill} />
            ))}
          </svg>
        </span>
      ))}
    </span>
  )
}
