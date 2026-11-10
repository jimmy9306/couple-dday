// 겨울 입김: 얼굴 밖, 입 높이의 바깥쪽 옆에서 하얀 반투명 픽셀 구름(3·4·5칸 덩어리 3개)이 나와 위·옆(바깥쪽)으로 퍼지며
// 1.5초 동안 사라짐. 분홍 외곽선/분홍색 없이 흰색 반투명 픽셀만. trigger(번호)가 바뀔 때마다 한 번 재생(0이면 안 그림).
// x, y = 스프라이트(72x96) 왼쪽 위 기준 시작점(px), side = -1(왼쪽 바깥) / 1(오른쪽 바깥). pointer-events:none.
const PX = 3

// 덩어리 모양('#' = 칸)과 끝 위치(dx는 바깥쪽 방향 기준 px, dy는 위로 px), 시작 지연(초)
const PUFFS = [
  { rows: ['##', '#.'], dx: 10, dy: -14, delay: 0 },
  { rows: ['##', '##'], dx: 20, dy: -26, delay: 0.12 },
  { rows: ['.#.', '###', '.#.'], dx: 8, dy: -38, delay: 0.24 },
]

function cellsOf(rows) {
  const cells = []
  rows.forEach((row, y) => {
    row.split('').forEach((ch, x) => {
      if (ch === '#') cells.push({ x, y })
    })
  })
  return { w: rows[0].length, h: rows.length, cells }
}
const SHAPES = PUFFS.map((p) => ({ ...p, shape: cellsOf(p.rows) }))

export default function Breath({ trigger, x, y, side = 1 }) {
  if (!trigger) return null
  return (
    <span
      key={trigger}
      aria-hidden="true"
      className="breath-wrap pointer-events-none absolute"
      style={{ left: x, top: y }}
    >
      {SHAPES.map(({ shape, dx, dy, delay }, i) => (
        <span
          key={i}
          className="breath-puff absolute"
          style={{
            left: -(shape.w * PX) / 2,
            top: -(shape.h * PX) / 2,
            '--dx': `${dx * side}px`,
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
            {shape.cells.map((c) => (
              <rect key={`${c.x}-${c.y}`} x={c.x} y={c.y} width="1" height="1" fill="#FFFFFF" fillOpacity="0.85" />
            ))}
          </svg>
        </span>
      ))}
    </span>
  )
}
