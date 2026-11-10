// 크리스마스 트리(11/10~12/31): tree.png + 코드로 그린 LED 전구 줄 + 꼭대기 금색 십자가.
// 전부 글자/캐릭터 뒤 레이어(SnowEffect 안), pointer-events:none. 전구·십자가는 트리 위에 그려짐.
// 좌표는 tree.png 의 칸(픽셀) 기준 (1칸 = 3px). 전선/전구 위치는 scripts/gen-tree-lights.py 가 만든 treeLights.js.
import { BULBS, WIRES } from '../lib/treeLights'

const BASE = import.meta.env.BASE_URL
const PX = 3
const TREE_COLS = 31
const TREE_ROWS = 42
const TIP_COL = 15 // 트리 꼭대기 뾰족한 끝 칸

const WIRE_COLOR = '#5A3A1F' // 짙은 갈색 1픽셀 전선
// 전구 색: [켜졌을 때, 꺼졌을 때(어두운 색)] — 켜진 색은 십자가 빛보다 한 단계 덜 밝게
const BULB_COLORS = {
  yellow: ['#FFD94D', '#8A6B1E'],
  red: ['#FF5252', '#7A2828'],
  green: ['#55DB78', '#27703F'],
  blue: ['#56B4FF', '#285080'],
}

// 십자가 5x7: G = 금색 면. 둘레는 검은 외곽선 1칸 (트리 외곽선과 같은 스타일)
const CROSS_GOLD = [
  [2, 1],
  [1, 2],
  [2, 2],
  [3, 2],
  [2, 3],
  [2, 4],
  [2, 5],
]
const CROSS_W = 5
const CROSS_H = 7
const isGold = (x, y) => CROSS_GOLD.some(([gx, gy]) => gx === x && gy === y)
const crossCells = (goldFill, goldHighlight) => {
  const cells = []
  for (let y = 0; y < CROSS_H; y += 1) {
    for (let x = 0; x < CROSS_W; x += 1) {
      if (isGold(x, y)) {
        cells.push({ x, y, fill: x === 2 && y === 2 ? goldHighlight : goldFill })
      } else if (isGold(x - 1, y) || isGold(x + 1, y) || isGold(x, y - 1) || isGold(x, y + 1)) {
        cells.push({ x, y, fill: '#111' })
      }
    }
  }
  return cells
}
const CROSS_BASE = crossCells('#F2B531', '#FFE27A') // 평소 금색
const CROSS_GLOW = crossCells('#FFF3A6', '#FFFFFF') // 빛날 때: 밝은 금색 + 하얀 중심

function CrossSvg({ cells, className }) {
  return (
    <svg
      width={CROSS_W * PX}
      height={CROSS_H * PX}
      viewBox={`0 0 ${CROSS_W} ${CROSS_H}`}
      shapeRendering="crispEdges"
      className={`absolute left-0 top-0 ${className}`}
    >
      {cells.map((c) => (
        <rect key={`${c.x}-${c.y}`} x={c.x} y={c.y} width="1" height="1" fill={c.fill} />
      ))}
    </svg>
  )
}

const HALO_OPACITY = 0.38
function Bulb({ x, y, w, color, group }) {
  const [on, off] = BULB_COLORS[color]
  const cells = Array.from({ length: w }, (_, i) => x + i)
  // 켜졌을 때 둘레 1칸의 옅은 빛 번짐
  const halo = []
  cells.forEach((cx) => {
    ;[
      [cx, y - 1],
      [cx, y + 1],
    ].forEach(([hx, hy]) => halo.push([hx, hy]))
  })
  halo.push([x - 1, y], [x + w, y])
  return (
    <>
      {cells.map((cx) => (
        <rect key={`off-${cx}`} x={cx} y={y} width="1" height="1" fill={off} />
      ))}
      <g className={`tree-bulb-on tree-bulb-g${group}`}>
        {halo.map(([hx, hy]) => (
          <rect key={`h-${hx}-${hy}`} x={hx} y={hy} width="1" height="1" fill={on} fillOpacity={HALO_OPACITY} />
        ))}
        {cells.map((cx) => (
          <rect key={`on-${cx}`} x={cx} y={y} width="1" height="1" fill={on} />
        ))}
      </g>
    </>
  )
}

// 빛줄기(상/하/좌/우): 십자가에서 1칸 띄우고 1칸 폭 x 3칸 길이
const RAY_COLOR = '#FFFBD2'
const RAYS = [
  { dir: 'up', left: 2 * PX, top: -4 * PX, w: 1, h: 3 },
  { dir: 'down', left: 2 * PX, top: (CROSS_H + 1) * PX, w: 1, h: 3 },
  { dir: 'left', left: -4 * PX, top: 3 * PX, w: 3, h: 1 },
  { dir: 'right', left: (CROSS_W + 1) * PX, top: 3 * PX, w: 3, h: 1 },
]

export default function ChristmasTree({ bottom }) {
  const crossLeft = (TIP_COL - 2) * PX
  const crossTop = -(CROSS_H - 1) * PX // 십자가 맨 아래 줄이 트리 꼭대기 끝 칸과 겹치게
  return (
    <div
      className="absolute"
      style={{ right: 2, bottom, width: TREE_COLS * PX, height: TREE_ROWS * PX }}
    >
      <img
        src={`${BASE}characters/winter/tree.png`}
        alt=""
        draggable={false}
        width={TREE_COLS * PX}
        height={TREE_ROWS * PX}
        className="block select-none"
        style={{ imageRendering: 'pixelated' }}
      />

      <svg
        width={TREE_COLS * PX}
        height={TREE_ROWS * PX}
        viewBox={`0 0 ${TREE_COLS} ${TREE_ROWS}`}
        shapeRendering="crispEdges"
        className="absolute left-0 top-0"
      >
        {WIRES.map(([x, y]) => (
          <rect key={`w-${x}-${y}`} x={x} y={y} width="1" height="1" fill={WIRE_COLOR} />
        ))}
        {BULBS.map((b) => (
          <Bulb key={`b-${b.x}-${b.y}`} {...b} />
        ))}
      </svg>

      <div
        className="absolute"
        style={{ left: crossLeft, top: crossTop, width: CROSS_W * PX, height: CROSS_H * PX }}
      >
        <CrossSvg cells={CROSS_BASE} className="" />
        <CrossSvg cells={CROSS_GLOW} className="tree-cross-glow" />
        {/* 빛줄기: 상/하/좌/우로 짧게 퍼졌다가 사라짐 */}
        {RAYS.map(({ dir, left, top, w, h }) => (
          <svg
            key={dir}
            width={w * PX}
            height={h * PX}
            viewBox={`0 0 ${w} ${h}`}
            shapeRendering="crispEdges"
            className={`tree-cross-ray tree-cross-ray-${dir} absolute`}
            style={{ left, top }}
          >
            <rect width={w} height={h} fill={RAY_COLOR} />
          </svg>
        ))}
      </div>
    </div>
  )
}
