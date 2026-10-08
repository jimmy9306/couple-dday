// 홈 첫 번째 박스 안에서만 흩날리는 가을 낙엽 + 바람 효과. 글자/캐릭터 뒤 레이어, 터치 방해 없음.
// 낙엽은 5개(최대 8개 제한 이내)만 CSS 애니메이션으로 움직임.
const PX = 3 // 캐릭터와 같은 3배 확대

const SPRITES = {
  orange: {
    colors: { o: '#E8883A', d: '#B85E1E' },
    rows: ['...o...', '..ooo..', 'o.ooo.o', 'ooodooo', '.oodoo.', '..odo..', '...d...'],
  },
  red: {
    colors: { o: '#D0483A', d: '#982C28' },
    rows: ['..oo..', '.oooo.', 'ooodoo', 'ooodoo', '.oodo.', '..d...'],
  },
  yellow: {
    colors: { o: '#F2C14E', d: '#C99A2E' },
    rows: ['..o..', '.ooo.', 'oodoo', '.odo.', '..d..'],
  },
  brown: {
    colors: { o: '#9A6A3C', d: '#6E4624' },
    rows: ['.ooo..', 'ooooo.', 'oodoo.', '.odoo.', '..do..', '..d...'],
  },
}

const LEAVES = [
  { sprite: 'orange', left: 8, fall: 13, delay: -2, sway: 3.2, spin: 5, push: 150 },
  { sprite: 'red', left: 28, fall: 15, delay: -9, sway: 2.8, spin: 6, push: 170 },
  { sprite: 'yellow', left: 50, fall: 12, delay: -5, sway: 3.6, spin: 4.4, push: 130 },
  { sprite: 'brown', left: 70, fall: 14, delay: -11, sway: 3, spin: 5.6, push: 150 },
  { sprite: 'orange', left: 88, fall: 16, delay: -7, sway: 3.4, spin: 4.8, push: 110 },
]

const WIND_LINES = [
  { top: '20%', width: 54, delay: 0 },
  { top: '44%', width: 36, delay: 0.12 },
  { top: '68%', width: 72, delay: 0.24 },
]

function Leaf({ sprite, left, fall, delay, sway, spin, push, gusting }) {
  const { rows, colors } = SPRITES[sprite]
  return (
    <span
      className="autumn-leaf-track"
      style={{ '--fall-dur': `${fall}s`, '--fall-delay': `${delay}s` }}
    >
      <span className="absolute top-0" style={{ left: `${left}%` }}>
        <span
          className={`autumn-leaf-gust ${gusting ? 'is-gusting' : ''}`}
          style={{ '--push': `${push}px` }}
        >
          <span className="autumn-leaf-sway" style={{ '--sway-dur': `${sway}s` }}>
            <span className="autumn-leaf-spin" style={{ '--spin-dur': `${spin}s` }}>
              <svg
                width={rows[0].length * PX}
                height={rows.length * PX}
                viewBox={`0 0 ${rows[0].length} ${rows.length}`}
                shapeRendering="crispEdges"
                className="block"
              >
                {rows.flatMap((row, y) =>
                  row.split('').map((ch, x) =>
                    ch === '.' ? null : (
                      <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={colors[ch]} />
                    )
                  )
                )}
              </svg>
            </span>
          </span>
        </span>
      </span>
    </span>
  )
}

export default function AutumnEffect({ gusting, gustKey }) {
  return (
    <div aria-hidden="true" className="autumn-layer pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {LEAVES.map((leaf, i) => (
        <Leaf key={i} {...leaf} gusting={gusting} />
      ))}
      {gusting &&
        WIND_LINES.map((line, i) => (
          <span
            key={`${gustKey}-${i}`}
            className="autumn-wind-line"
            style={{
              top: line.top,
              width: `${line.width}px`,
              animationDelay: `${line.delay}s`,
              boxShadow: `${line.width + 12}px 0 0 #fff`,
            }}
          />
        ))}
    </div>
  )
}
