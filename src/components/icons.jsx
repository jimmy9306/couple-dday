// 16x16 픽셀 그리드로 직접 그린 라인업(하트/달력/체크/선물/톱니).
// 외부 아이콘셋 미사용. shape-rendering:crispEdges + image-rendering:pixelated로 각진 픽셀 유지.

const SIZE = 16

function emptyGrid() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0))
}

function fillRect(grid, x0, y0, x1, y1) {
  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      if (grid[y] && x >= 0 && x < SIZE) grid[y][x] = 1
    }
  }
}

function strokeRect(grid, x0, y0, x1, y1) {
  fillRect(grid, x0, y0, x1, y0)
  fillRect(grid, x0, y1, x1, y1)
  fillRect(grid, x0, y0, x0, y1)
  fillRect(grid, x1, y0, x1, y1)
}

function setCells(grid, coords) {
  coords.forEach(([x, y]) => {
    if (grid[y] && x >= 0 && x < SIZE) grid[y][x] = 1
  })
}

function gridFromRows(rows) {
  return rows.map((row) => row.split('').map((ch) => (ch === '#' ? 1 : 0)))
}

function PixelIcon({ grid, className }) {
  const cells = []
  grid.forEach((row, y) => {
    row.forEach((v, x) => {
      if (v) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />)
    })
  })
  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className={className}
      fill="currentColor"
      shapeRendering="crispEdges"
      style={{ imageRendering: 'pixelated' }}
    >
      {cells}
    </svg>
  )
}

const HEART_ROWS = [
  '................',
  '..###......###..',
  '.######..######.',
  '.##############.',
  '.##############.',
  '..############..',
  '...##########...',
  '....########....',
  '.....######.....',
  '......####......',
  '.......##.......',
  '................',
  '................',
  '................',
  '................',
  '................',
]

export function HeartIcon({ className }) {
  return <PixelIcon grid={gridFromRows(HEART_ROWS)} className={className} />
}

export function CalendarIcon({ className }) {
  const grid = emptyGrid()
  strokeRect(grid, 1, 3, 14, 14)
  fillRect(grid, 1, 5, 14, 5)
  fillRect(grid, 4, 1, 5, 2)
  fillRect(grid, 10, 1, 11, 2)
  return <PixelIcon grid={grid} className={className} />
}

export function CheckIcon({ className }) {
  const grid = emptyGrid()
  strokeRect(grid, 1, 1, 14, 14)
  setCells(grid, [
    [3, 8],
    [4, 9],
    [5, 10],
    [6, 11],
    [7, 10],
    [8, 9],
    [9, 8],
    [10, 7],
    [11, 6],
    [12, 5],
  ])
  return <PixelIcon grid={grid} className={className} />
}

export function GiftIcon({ className }) {
  const grid = emptyGrid()
  strokeRect(grid, 2, 7, 13, 14)
  fillRect(grid, 1, 5, 14, 6)
  fillRect(grid, 7, 5, 8, 14)
  fillRect(grid, 4, 2, 6, 4)
  fillRect(grid, 9, 2, 11, 4)
  fillRect(grid, 7, 3, 8, 4)
  return <PixelIcon grid={grid} className={className} />
}

export function GearIcon({ className }) {
  const grid = emptyGrid()
  strokeRect(grid, 4, 4, 11, 11)
  fillRect(grid, 7, 0, 8, 2)
  fillRect(grid, 7, 13, 8, 15)
  fillRect(grid, 0, 7, 2, 8)
  fillRect(grid, 13, 7, 15, 8)
  setCells(grid, [
    [2, 2],
    [3, 3],
    [12, 2],
    [12, 3],
    [2, 13],
    [3, 12],
    [12, 13],
    [12, 12],
  ])
  return <PixelIcon grid={grid} className={className} />
}
