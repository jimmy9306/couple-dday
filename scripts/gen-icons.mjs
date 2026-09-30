// 외부 이미지 생성 도구 없이, 순수 Node로 하트 모양 PNG 아이콘을 생성한다.
// (PNG 포맷을 직접 인코딩: IHDR + IDAT(zlib) + IEND)
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'public')
const ICONS_DIR = join(OUT_DIR, 'icons')

mkdirSync(ICONS_DIR, { recursive: true })

const BG = [255, 245, 247, 255] // love-50
const HEART = [255, 92, 138, 255] // love-500

function crc32(buf) {
  let c
  const table = crc32.table || (crc32.table = (() => {
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

/** (x,y) in [-1,1] 좌표계에서 하트 내부 여부 (표준 하트 음함수 사용, 위아래 반전 보정) */
function isInsideHeart(x, y) {
  const yy = -y
  const v = (x * x + yy * yy - 1) ** 3 - x * x * yy ** 3
  return v <= 0
}

function generateHeartIcon({ size, padding = 0.14, maskable = false }) {
  const rgba = Buffer.alloc(size * size * 4)

  // maskable 아이콘은 safe-zone 확보를 위해 하트를 더 작게, 배경을 꽉 채움
  const scale = maskable ? 0.62 : 1 - padding * 2

  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      const nx = ((px + 0.5) / size - 0.5) * 2
      const ny = ((py + 0.5) / size - 0.5) * 2
      const hx = nx / scale
      const hy = ny / scale + 0.15 // 살짝 위로 올려 중앙 정렬 보정

      const idx = (py * size + px) * 4
      const color = isInsideHeart(hx, hy) ? HEART : BG
      rgba[idx] = color[0]
      rgba[idx + 1] = color[1]
      rgba[idx + 2] = color[2]
      rgba[idx + 3] = color[3]
    }
  }

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
  const png = generateHeartIcon(t)
  writeFileSync(t.file, png)
  console.log(`generated ${t.file} (${t.size}x${t.size})`)
}
