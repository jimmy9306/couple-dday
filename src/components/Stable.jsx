// 마구간(11/10~12/31): stable.png + 입구 안쪽 따뜻한 빛(3초 주기로 아주 천천히 밝아졌다 어두워짐)
// + 입구 오른쪽 눈 바닥에 번지는 옅은 노란 빛(캐릭터 발 근처까지 살짝 닿음).
// 글자/캐릭터 뒤 레이어(SnowEffect 안), pointer-events:none. 입구는 오른쪽(캐릭터 쪽)을 향함.
// 빛 칸 좌표는 scripts/process-stable.py 가 만든 stableLight.js (이미지의 빛 픽셀 위에 은은하게 겹치기만 함).
import { STABLE_COLS, STABLE_GLOW, STABLE_ROWS } from '../lib/stableLight'

const BASE = import.meta.env.BASE_URL
// 3배(132x108)에서 요청대로 약 70%로 줄임: 같은 44x36 이미지를 정수 2배(88x72, 약 67%)로 표시 → 픽셀이 흐려지지 않음
const PX = 2
const FLOOR_BURY = 3 // 눈 윗면은 마구간 바닥(=발 높이)보다 3px 위
export const STABLE_WIDTH = STABLE_COLS * PX
export const STABLE_HEIGHT = STABLE_ROWS * PX
const LIGHT = '#FFE98A'

// 입구 오른쪽 눈 바닥의 빛 번짐: 눈 윗면 높이에서 아래로 갈수록 좁아지는 4줄(3px 단위), 마구간 왼쪽 위 기준 칸 좌표
const SPILL_ROWS = [
  { x: 35, w: 26 },
  { x: 37, w: 21 },
  { x: 40, w: 14 },
  { x: 44, w: 6 },
]

export default function Stable({ left, bottom }) {
  return (
    <div
      className="absolute"
      style={{ left, bottom, width: STABLE_WIDTH, height: STABLE_HEIGHT }}
    >
      <img
        src={`${BASE}characters/winter/stable.png`}
        alt=""
        draggable={false}
        width={STABLE_WIDTH}
        height={STABLE_HEIGHT}
        className="block select-none"
        style={{ imageRendering: 'pixelated' }}
      />
      <svg
        width={STABLE_WIDTH}
        height={STABLE_HEIGHT}
        viewBox={`0 0 ${STABLE_COLS} ${STABLE_ROWS}`}
        shapeRendering="crispEdges"
        className="stable-light absolute left-0 top-0"
      >
        {STABLE_GLOW.map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={LIGHT} />
        ))}
      </svg>
      {/* 눈 바닥(마구간 아래쪽 3px 위가 눈 윗면)에 번지는 빛 */}
      <svg
        width={STABLE_WIDTH}
        height={SPILL_ROWS.length * PX}
        viewBox={`0 0 ${STABLE_COLS} ${SPILL_ROWS.length}`}
        shapeRendering="crispEdges"
        className="stable-floor-glow absolute left-0"
        style={{ top: STABLE_HEIGHT - FLOOR_BURY }}
      >
        {SPILL_ROWS.map((row, i) => (
          <rect key={i} x={row.x} y={i} width={row.w} height="1" fill={LIGHT} />
        ))}
      </svg>
    </div>
  )
}
