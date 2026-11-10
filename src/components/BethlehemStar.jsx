// 베들레헴의 큰 별(11/10~12/31): 마구간 위쪽 하늘의 금색 11x11 픽셀 별(4방향 뾰족한 빛줄기).
// 평소엔 옅게 보이다가 트리 꼭대기 십자가가 빛나는 순간(같은 3.5초 주기·같은 시작 시점)에 함께 밝게 빛나고,
// 그때 별에서 마구간 지붕 쪽으로 가는 얇은 빛줄기 한 줄이 내려왔다 사라짐(SnowEffect). 글자 뒤 레이어, pointer-events:none.
const PX = 3
const SIZE = 11
const C = 5 // 중심 칸

// 4방향으로 뾰족한 별: 중심 3x3 + 가운데 십자 + 십자에 붙은 한 칸 두께 살(중심에서 멀수록 가늘어짐)
const cells = []
for (let y = 0; y < SIZE; y += 1) {
  for (let x = 0; x < SIZE; x += 1) {
    const dx = Math.abs(x - C)
    const dy = Math.abs(y - C)
    const axis = dx === 0 || dy === 0
    const core = dx <= 1 && dy <= 1
    const flesh = dx + dy <= 3 && Math.min(dx, dy) <= 1
    if (axis || core || flesh) cells.push({ x, y, center: dx === 0 && dy === 0 })
  }
}

function StarSvg({ fill, centerFill, className }) {
  return (
    <svg
      width={SIZE * PX}
      height={SIZE * PX}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      shapeRendering="crispEdges"
      className={`absolute left-0 top-0 ${className}`}
    >
      {cells.map((c) => (
        <rect key={`${c.x}-${c.y}`} x={c.x} y={c.y} width="1" height="1" fill={c.center ? centerFill : fill} />
      ))}
    </svg>
  )
}

// left/top: 별 왼쪽 위(px). 별에서 마구간 지붕으로 내려가는 빛줄기는 길이가 별/마구간 위치에 따라 정해지므로 SnowEffect 에서 그림.
export default function BethlehemStar({ left, top }) {
  return (
    <div className="absolute" style={{ left, top, width: SIZE * PX, height: SIZE * PX }}>
      <StarSvg fill="#F2B531" centerFill="#FFE27A" className="bethlehem-star-base" />
      <StarSvg fill="#FFF0A0" centerFill="#FFFFFF" className="tree-cross-glow" />
    </div>
  )
}
