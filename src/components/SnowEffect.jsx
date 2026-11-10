// 홈 첫 번째 박스 안에서만 내리는 겨울 눈 효과 + 바닥에 쌓인 눈. 글자/캐릭터 뒤 레이어, 터치 방해 없음.
// (낙엽 AutumnEffect와 같은 위치/레이어 규칙: 부모는 relative + isolate + overflow-hidden, 이 레이어는 -z-10)
// 눈송이는 흰색 픽셀 3종(1x1 점 / 2x2 / 3x3 십자) 동시에 최대 15개이고, 연분홍 박스 위에서 잘 보이도록
// 눈송이 둘레에 1픽셀짜리 옅은 분홍 외곽선을 둠.
const PX = 3 // 캐릭터와 같은 3배 확대
const OUTLINE = '#F4A9C6'

const SHAPES = {
  dot: ['#'],
  square: ['##', '##'],
  cross: ['.#.', '###', '.#.'],
}

// 흰 칸의 위/아래/좌/우에 이웃한 빈 칸을 외곽선 칸으로 만들어 SVG 사각형 목록으로 변환
function buildFlake(rows) {
  const h = rows.length
  const w = rows[0].length
  const white = (x, y) => rows[y - 1]?.[x - 1] === '#' // 1칸 여백(외곽선 자리) 좌표계
  const rects = []
  for (let y = 0; y < h + 2; y += 1) {
    for (let x = 0; x < w + 2; x += 1) {
      if (white(x, y)) {
        rects.push({ x, y, fill: '#fff' })
      } else if (white(x - 1, y) || white(x + 1, y) || white(x, y - 1) || white(x, y + 1)) {
        rects.push({ x, y, fill: OUTLINE })
      }
    }
  }
  return { w: w + 2, h: h + 2, rects }
}

const FLAKES = Object.fromEntries(Object.entries(SHAPES).map(([k, rows]) => [k, buildFlake(rows)]))

// 15개 고정: 점 7 / 네모 5 / 십자 3. 천천히 떨어지며 좌우로 흔들림(sway), 바람이 불면 살짝 옆으로 쓸렸다 돌아옴(push).
const SNOWFLAKES = [
  { shape: 'dot', left: 4, fall: 15, delay: -3, sway: 3.6, swayPx: 6, push: 44 },
  { shape: 'square', left: 10, fall: 13, delay: -9, sway: 4.2, swayPx: 9, push: 56 },
  { shape: 'dot', left: 17, fall: 17, delay: -6, sway: 3.2, swayPx: 6, push: 38 },
  { shape: 'cross', left: 24, fall: 14, delay: -12, sway: 4.6, swayPx: 9, push: 62 },
  { shape: 'dot', left: 31, fall: 16, delay: -1, sway: 3.8, swayPx: 6, push: 42 },
  { shape: 'square', left: 38, fall: 12, delay: -8, sway: 3.4, swayPx: 9, push: 50 },
  { shape: 'dot', left: 45, fall: 18, delay: -14, sway: 4, swayPx: 6, push: 36 },
  { shape: 'cross', left: 52, fall: 15, delay: -5, sway: 4.4, swayPx: 9, push: 60 },
  { shape: 'dot', left: 59, fall: 13, delay: -11, sway: 3.3, swayPx: 6, push: 46 },
  { shape: 'square', left: 66, fall: 17, delay: -2, sway: 3.9, swayPx: 9, push: 54 },
  { shape: 'dot', left: 73, fall: 14, delay: -10, sway: 3.5, swayPx: 6, push: 40 },
  { shape: 'cross', left: 80, fall: 16, delay: -7, sway: 4.8, swayPx: 9, push: 64 },
  { shape: 'square', left: 87, fall: 12, delay: -13, sway: 3.7, swayPx: 9, push: 52 },
  { shape: 'dot', left: 93, fall: 18, delay: -4, sway: 3.1, swayPx: 6, push: 38 },
  { shape: 'dot', left: 97, fall: 15, delay: -9, sway: 4.1, swayPx: 6, push: 34 },
]

function Snowflake({ shape, left, fall, delay, sway, swayPx, push, gusting }) {
  const { w, h, rects } = FLAKES[shape]
  return (
    <span
      className="snow-flake-track"
      style={{ '--fall-dur': `${fall}s`, '--fall-delay': `${delay}s` }}
    >
      <span className="absolute top-0" style={{ left: `${left}%` }}>
        <span
          className={`snow-flake-gust ${gusting ? 'is-gusting' : ''}`}
          style={{ '--push': `${push}px` }}
        >
          <span
            className="snow-flake-sway"
            style={{ '--sway-dur': `${sway}s`, '--sway-px': `${swayPx}px` }}
          >
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
    </span>
  )
}

// 바닥에 쌓인 눈: 맨 아래 한 줄은 꽉 차고, 그 위 한 줄은 울퉁불퉁하게 얹힘 (1칸=3px, 총 2줄)
const PILE_TOP =
  'repeating-linear-gradient(90deg, #fff 0 24px, transparent 24px 33px, #fff 33px 45px, transparent 45px 48px, #fff 48px 69px, transparent 69px 78px)'

export default function SnowEffect({ gusting }) {
  return (
    <div aria-hidden="true" className="snow-layer pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {SNOWFLAKES.map((flake, i) => (
        <Snowflake key={i} {...flake} gusting={gusting} />
      ))}
      <div className="absolute inset-x-0 bottom-0">
        <div style={{ height: PX, backgroundImage: PILE_TOP }} />
        <div className="bg-white" style={{ height: PX }} />
      </div>
    </div>
  )
}
