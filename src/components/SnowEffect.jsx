// 홈 첫 번째 박스 안의 겨울 장면: 눈 + 눈 쌓인 바닥 (+ 크리스마스 트리). 글자/캐릭터 뒤 레이어, 터치 방해 없음.
// (낙엽 AutumnEffect와 같은 위치/레이어 규칙: 부모는 relative + isolate + overflow-hidden, 이 레이어는 -z-10)
// 눈송이는 흰색 픽셀 3종(1x1 점 / 2x2 / 3x3 십자) 동시에 최대 15개이고, 연분홍 박스 위에서 잘 보이도록
// 눈송이 둘레에 1픽셀짜리 옅은 분홍 외곽선을 둠. 바람 없이 천천히 거의 수직으로 살랑살랑 떨어짐.
// "동작 줄이기"면 CSS에서 애니메이션만 멈추고(index.css) 장면은 정지 상태로 그대로 보임.
import { buildOutlinedShape } from '../lib/pixelShapes'
import ChristmasTree from './ChristmasTree'

const PX = 3 // 캐릭터와 같은 3배 확대

// 캐릭터 발(스프라이트 맨 아래 행)이 박스 바닥에서 떨어진 거리 = 패딩 16 + 이름 줄(16.5) + 간격 4.
// 눈 바닥/트리 기둥을 이 높이에 맞춰서 발이 눈 위에 서 있게 함 (Home.jsx 의 캐릭터 레이아웃과 짝).
export const FEET_BOTTOM = 36.5
const BURY = PX // 발·기둥이 눈에 1픽셀(3px) 묻힘 → 눈 윗면은 발바닥보다 3px 위

const SHAPES = {
  dot: ['#'],
  square: ['##', '##'],
  cross: ['.#.', '###', '.#.'],
}
const FLAKES = Object.fromEntries(Object.entries(SHAPES).map(([k, rows]) => [k, buildOutlinedShape(rows)]))

// 15개 고정: 점 7 / 네모 5 / 십자 3. 아주 천천히(15~24초에 박스 한 번) 떨어지고 좌우로는 1칸(3px)만 살랑임.
const SNOWFLAKES = [
  { shape: 'dot', left: 4, fall: 20, delay: -3, sway: 6 },
  { shape: 'square', left: 10, fall: 17, delay: -9, sway: 7 },
  { shape: 'dot', left: 17, fall: 23, delay: -6, sway: 5 },
  { shape: 'cross', left: 24, fall: 19, delay: -12, sway: 8 },
  { shape: 'dot', left: 31, fall: 22, delay: -1, sway: 6 },
  { shape: 'square', left: 38, fall: 16, delay: -8, sway: 5 },
  { shape: 'dot', left: 45, fall: 24, delay: -14, sway: 7 },
  { shape: 'cross', left: 52, fall: 20, delay: -5, sway: 8 },
  { shape: 'dot', left: 59, fall: 18, delay: -11, sway: 5 },
  { shape: 'square', left: 66, fall: 23, delay: -2, sway: 6 },
  { shape: 'dot', left: 73, fall: 19, delay: -10, sway: 7 },
  { shape: 'cross', left: 80, fall: 21, delay: -7, sway: 8 },
  { shape: 'square', left: 87, fall: 16, delay: -13, sway: 6 },
  { shape: 'dot', left: 93, fall: 24, delay: -4, sway: 5 },
  { shape: 'dot', left: 97, fall: 20, delay: -9, sway: 7 },
]

function Snowflake({ shape, left, fall, delay, sway }) {
  const { w, h, rects } = FLAKES[shape]
  // 동작 줄이기일 때 멈춰 있을 높이: 애니메이션 진행도(delay 기준)에 해당하는 위치
  const progress = (((-delay % fall) + fall) % fall) / fall
  const staticY = `${Math.round((progress * 110 - 6) * 10) / 10}%`
  return (
    <span
      className="snow-flake-track"
      style={{ '--fall-dur': `${fall}s`, '--fall-delay': `${delay}s`, '--static-y': staticY }}
    >
      <span className="absolute top-0" style={{ left: `${left}%` }}>
        <span className="snow-flake-sway" style={{ '--sway-dur': `${sway}s` }}>
          <svg
            width={w * PX}
            height={h * PX}
            viewBox={`0 0 ${w} ${h}`}
            shapeRendering="crispEdges"
            className="block"
          >
            {rects.map((r) => (
              <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width="1" height="1" fill={r.fill} />
            ))}
          </svg>
        </span>
      </span>
    </span>
  )
}

// 눈 바닥: 흰색 띠 + 울퉁불퉁한 윗면(3px 단위 두 줄) + 맨 아래 아주 옅은 하늘색 음영 1줄
const FLOOR_TOP = FEET_BOTTOM + BURY // 평평한 눈 윗면 높이(박스 바닥 기준)
// 윗면 울퉁불퉁: 3px 단위 세 줄. 아래 줄일수록 넓고 촘촘, 위 줄은 드문드문 좁은 봉우리
const BUMPS_LOW =
  'repeating-linear-gradient(90deg, #fff 0 54px, transparent 54px 60px, #fff 60px 111px, transparent 111px 120px, #fff 120px 162px, transparent 162px 168px, #fff 168px 210px)'
const BUMPS_MID =
  'repeating-linear-gradient(90deg, transparent 0 12px, #fff 12px 48px, transparent 48px 93px, #fff 93px 135px, transparent 135px 171px, #fff 171px 186px, transparent 186px 231px)'
const BUMPS_HIGH =
  'repeating-linear-gradient(90deg, transparent 0 24px, #fff 24px 39px, transparent 39px 111px, #fff 111px 132px, transparent 132px 177px, #fff 177px 192px, transparent 192px 261px)'

function SnowFloor() {
  return (
    <>
      <div className="absolute inset-x-0 bottom-0 bg-white" style={{ height: FLOOR_TOP }} />
      <div className="absolute inset-x-0" style={{ bottom: FLOOR_TOP, height: PX, backgroundImage: BUMPS_LOW }} />
      <div
        className="absolute inset-x-0"
        style={{ bottom: FLOOR_TOP + PX, height: PX, backgroundImage: BUMPS_MID }}
      />
      <div
        className="absolute inset-x-0"
        style={{ bottom: FLOOR_TOP + 2 * PX, height: PX, backgroundImage: BUMPS_HIGH }}
      />
      <div className="absolute inset-x-0 bottom-0" style={{ height: PX, backgroundColor: '#D8ECF9' }} />
    </>
  )
}

export default function SnowEffect({ tree = false }) {
  return (
    <div aria-hidden="true" className="snow-layer pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <SnowFloor />
      {tree && <ChristmasTree bottom={FEET_BOTTOM} />}
      {SNOWFLAKES.map((flake, i) => (
        <Snowflake key={i} {...flake} />
      ))}
    </div>
  )
}
