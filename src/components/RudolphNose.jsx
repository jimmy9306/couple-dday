// 루돌프 빨간 코(11/10~12/31): 캐릭터 얼굴 가운데(두 눈 사이, 살짝 아래)에 코드로 덧그리는 2x2 픽셀 코
// (밝은 빨강 + 왼쪽 위 1칸 흰 하이라이트). 캐릭터 이미지와 별개로 그려져서 눈 깜빡임 프레임에서도 제자리에 고정.
// 5초마다 코가 살짝 밝아지며(코 칸만) 둘레 1칸 테두리에만 아주 옅은 빨간 빛이 번졌다가 0.8초에 사라짐(얼굴을 덮지 않음). delay 로 두 캐릭터가 번갈아 빛남.
// x, y = 스프라이트(72x96) 왼쪽 위 기준 코 "가운데" 좌표(px). pointer-events:none.
const PX = 3
const NOSE = [
  { x: 0, y: 0, fill: '#FFFFFF' }, // 하이라이트
  { x: 1, y: 0, fill: '#FF2B2B' },
  { x: 0, y: 1, fill: '#FF2B2B' },
  { x: 1, y: 1, fill: '#FF2B2B' },
]
const BRIGHT = ['#FFFFFF', '#FF4A2E', '#FF4A2E', '#FF4A2E'] // 밝아질 때: 분홍이 아니라 더 선명한 붉은색
// 코 둘레 1칸(4x4 중 가운데 2x2 제외)
const HALO = []
for (let y = 0; y < 4; y += 1) {
  for (let x = 0; x < 4; x += 1) {
    if (x === 0 || x === 3 || y === 0 || y === 3) HALO.push({ x, y })
  }
}

export default function RudolphNose({ x, y, delay = 0 }) {
  const style = { '--nose-delay': `${delay}s` }
  return (
    <span
      aria-hidden="true"
      className="rudolph-nose pointer-events-none absolute"
      style={{ left: x - PX, top: y - PX, width: 2 * PX, height: 2 * PX, ...style }}
    >
      {/* 빛 번짐(빛날 때만) */}
      <svg
        width={4 * PX}
        height={4 * PX}
        viewBox="0 0 4 4"
        shapeRendering="crispEdges"
        className="rudolph-nose-glow absolute"
        style={{ left: -PX, top: -PX }}
      >
        {HALO.map((c) => (
          <rect key={`${c.x}-${c.y}`} x={c.x} y={c.y} width="1" height="1" fill="#FF3B2F" fillOpacity="0.16" />
        ))}
      </svg>
      <svg width={2 * PX} height={2 * PX} viewBox="0 0 2 2" shapeRendering="crispEdges" className="absolute left-0 top-0">
        {NOSE.map((c) => (
          <rect key={`${c.x}-${c.y}`} x={c.x} y={c.y} width="1" height="1" fill={c.fill} />
        ))}
      </svg>
      {/* 빛날 때 코가 살짝 더 밝은 빨강으로 */}
      <svg
        width={2 * PX}
        height={2 * PX}
        viewBox="0 0 2 2"
        shapeRendering="crispEdges"
        className="rudolph-nose-bright absolute left-0 top-0"
      >
        {NOSE.map((c, i) => (
          <rect key={`${c.x}-${c.y}`} x={c.x} y={c.y} width="1" height="1" fill={BRIGHT[i]} />
        ))}
      </svg>
    </span>
  )
}
