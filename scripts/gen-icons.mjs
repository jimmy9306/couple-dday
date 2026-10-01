// 외부 이미지 생성 도구 없이, 순수 Node로 "파스텔 핑크 픽셀 RPG" 앱 아이콘을 생성한다.
// 32x32 픽셀 그리드로 디자인한 뒤 nearest-neighbor로 확대해서 각 해상도 PNG를 만든다.
// (PNG 포맷을 직접 인코딩: IHDR + IDAT(zlib) + IEND)
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'public')
const ICONS_DIR = join(OUT_DIR, 'icons')

mkdirSync(ICONS_DIR, { recursive: true })

// 앱 5색 팔레트 (DECISIONS.md 참고) — 이 5색만 사용
const BG = [255, 244, 247, 255] // #FFF4F7 배경
const BOX = [255, 200, 221, 255] // #FFC8DD 하이라이트
const ACCENT = [255, 143, 184, 255] // #FF8FB8 하트 본체
const BORDER = [214, 69, 122, 255] // #D6457A 외곽선/그림자

function crc32(buf) {
  let c
  const table =
    crc32.table ||
    (crc32.table = (() => {
      const t = new Uint32Array(256)
      for (let n = 0; n < 256; n += 1) {
        c = n
        for (let k = 0; k < 8; k += 1) {
          c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
        }
        t[n] = c >>> 0
      }
      return t
    })())
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i += 1) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

function encodePng(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(width, 0)
  ihdrData.writeUInt32BE(height, 4)
  ihdrData[8] = 8 // bit depth
  ihdrData[9] = 6 // color type RGBA
  ihdrData[10] = 0
  ihdrData[11] = 0
  ihdrData[12] = 0

  // 각 스캔라인 앞에 필터 타입 바이트(0) 추가
  const raw = Buffer.alloc((width * 4 + 1) * height)
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (width * 4 + 1)
    raw[rowStart] = 0
    rgba.copy(raw, rowStart + 1, y * width * 4, (y + 1) * width * 4)
  }

  const idatData = deflateSync(raw, { level: 9 })

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdrData),
    chunk('IDAT', idatData),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const GRID = 32

/** (x,y) in [-1,1] 좌표계에서 하트 내부 여부 (표준 하트 음함수, 위아래 반전 보정) */
function isInsideHeart(x, y) {
  const yy = -y
  const v = (x * x + yy * yy - 1) ** 3 - x * x * yy ** 3
  return v <= 0
}

function buildHeartMask(scale) {
  const inside = Array.from({ length: GRID }, () => Array(GRID).fill(false))
  for (let gy = 0; gy < GRID; gy += 1) {
    for (let gx = 0; gx < GRID; gx += 1) {
      const nx = ((gx + 0.5) / GRID - 0.5) * 2
      const ny = ((gy + 0.5) / GRID - 0.5) * 2
      const hx = nx / scale
      const hy = ny / scale + 0.15 // 살짝 위로 올려 중앙 정렬 보정
      inside[gy][gx] = isInsideHeart(hx, hy)
    }
  }
  return inside
}

/**
 * 32x32 아이콘 디자인:
 * - 크림 배경 위 큰 픽셀 하트 (본체 ACCENT, 외곽선 BORDER)
 * - 하트 오른쪽 아래로 1px 오프셋 하드 섀도우 (BORDER)
 * - 왼쪽 위에 하이라이트 픽셀 2~3개 (BOX)
 * - 배경 모서리에 작은 반짝이 2개
 */
function buildIconGrid({ maskable }) {
  // maskable은 둥근 마스크로 잘려도 하트가 안전영역(가운데 80%) 안에 들어오도록 더 작게
  const scale = maskable ? 0.42 : 0.6
  const inside = buildHeartMask(scale)
  const isInside = (x, y) => x >= 0 && x < GRID && y >= 0 && y < GRID && inside[y][x]

  const color = Array.from({ length: GRID }, () => Array(GRID).fill(BG))

  // 1) 하트 본체 + 외곽선 (이웃 중 하나라도 바깥이면 테두리)
  for (let y = 0; y < GRID; y += 1) {
    for (let x = 0; x < GRID; x += 1) {
      if (!inside[y][x]) continue
      const isEdge =
        !isInside(x - 1, y) || !isInside(x + 1, y) || !isInside(x, y - 1) || !isInside(x, y + 1)
      color[y][x] = isEdge ? BORDER : ACCENT
    }
  }

  // 2) 하드 섀도우: 하트 외곽을 오른쪽 아래로 1픽셀 오프셋
  for (let y = 0; y < GRID; y += 1) {
    for (let x = 0; x < GRID; x += 1) {
      if (!inside[y][x]) continue
      const sx = x + 1
      const sy = y + 1
      if (sx < GRID && sy < GRID && !isInside(sx, sy)) {
        color[sy][sx] = BORDER
      }
    }
  }

  // 3) 왼쪽 위 하이라이트 픽셀 2~3개 (외곽선과 떨어진, 완전히 안쪽인 칸만 후보로)
  const isDeepFill = (x, y) =>
    color[y][x] === ACCENT &&
    isInside(x - 1, y) &&
    isInside(x + 1, y) &&
    isInside(x, y - 1) &&
    isInside(x, y + 1)
  const fillCells = []
  for (let y = 0; y < GRID; y += 1) {
    for (let x = 0; x < GRID / 2; x += 1) {
      if (isDeepFill(x, y)) fillCells.push([x, y])
    }
  }
  fillCells.sort((a, b) => a[1] - b[1] || a[0] - b[0])
  fillCells.slice(0, 3).forEach(([x, y]) => {
    color[y][x] = BOX
  })

  // 4) 배경 모서리 반짝이 2개 (하트와 겹치지 않는 완전한 모서리 자리)
  const sparkle = (cx, cy) => {
    ;[
      [cx, cy],
      [cx - 1, cy],
      [cx + 1, cy],
      [cx, cy - 1],
      [cx, cy + 1],
    ].forEach(([x, y]) => {
      if (x >= 0 && x < GRID && y >= 0 && y < GRID && color[y][x] === BG) {
        color[y][x] = ACCENT
      }
    })
  }
  sparkle(4, 4)
  sparkle(GRID - 5, GRID - 5)

  return color
}

/** 32x32 색상 그리드를 nearest-neighbor로 outSize x outSize RGBA로 확대 */
function gridToRgba(colorGrid, outSize) {
  const rgba = Buffer.alloc(outSize * outSize * 4)
  const cell = outSize / GRID
  for (let py = 0; py < outSize; py += 1) {
    const gy = Math.min(GRID - 1, Math.floor(py / cell))
    for (let px = 0; px < outSize; px += 1) {
      const gx = Math.min(GRID - 1, Math.floor(px / cell))
      const c = colorGrid[gy][gx]
      const idx = (py * outSize + px) * 4
      rgba[idx] = c[0]
      rgba[idx + 1] = c[1]
      rgba[idx + 2] = c[2]
      rgba[idx + 3] = c[3]
    }
  }
  return rgba
}

function generateIcon({ size, maskable }) {
  const grid = buildIconGrid({ maskable })
  const rgba = gridToRgba(grid, size)
  return encodePng(size, size, rgba)
}

const targets = [
  { file: join(ICONS_DIR, 'icon-192.png'), size: 192 },
  { file: join(ICONS_DIR, 'icon-512.png'), size: 512 },
  { file: join(ICONS_DIR, 'icon-maskable-512.png'), size: 512, maskable: true },
  { file: join(OUT_DIR, 'apple-touch-icon.png'), size: 180 },
  { file: join(OUT_DIR, 'favicon.png'), size: 64 },
]

for (const t of targets) {
  const png = generateIcon(t)
  writeFileSync(t.file, png)
  console.log(`generated ${t.file} (${t.size}x${t.size})`)
}
