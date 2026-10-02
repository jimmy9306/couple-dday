// 홈 화면 커플 캐릭터 — 24x32 픽셀, 2등신 치비. 완전히 새로 그린 오리지널 디자인.
// 작은 사각형(rect) 단위로 부위를 쌓은 뒤, 배경과 맞닿는 칸에 자동으로 외곽선을 둘러
// "문자열 배열(한 글자=한 픽셀) + 팔레트 맵" 최종 결과물을 만들어냄 — 이 방식이면
// 외곽선이 실루엣과 항상 정확히 맞아떨어져서 손으로 한 줄씩 그리는 것보다 훨씬 정확함.

const W = 24
const H = 32

function emptyGrid() {
  return Array.from({ length: H }, () => Array(W).fill(null))
}

function fillRect(grid, x0, y0, x1, y1, key) {
  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      if (grid[y] && x >= 0 && x < W) grid[y][x] = key
    }
  }
}

function setCell(grid, x, y, key) {
  if (grid[y] && x >= 0 && x < W) grid[y][x] = key
}

// 배경(null)인 칸 중 상하좌우로 색칠된 칸과 맞닿은 칸을 외곽선으로 채움.
function addOutline(grid, outlineKey) {
  const toMark = []
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      if (grid[y][x] != null) continue
      const touches =
        (grid[y - 1] && grid[y - 1][x] != null) ||
        (grid[y + 1] && grid[y + 1][x] != null) ||
        grid[y][x - 1] != null ||
        grid[y][x + 1] != null
      if (touches) toMark.push([x, y])
    }
  }
  toMark.forEach(([x, y]) => setCell(grid, x, y, outlineKey))
}

function gridToRows(grid) {
  return grid.map((row) => row.map((c) => c || '.').join(''))
}

// ---------------------------------------------------------------------------
// 얼굴 — 남녀 공통 (이목구비 배치는 같고, 머리카락/옷만 다름)
// ---------------------------------------------------------------------------
function paintFace(grid) {
  // 이마~볼 (피부 베이스 + 오른쪽 음영)
  fillRect(grid, 8, 6, 15, 11, 'S')
  fillRect(grid, 14, 6, 15, 11, 's')
  fillRect(grid, 7, 12, 16, 12, 'S')
  fillRect(grid, 15, 12, 16, 12, 's')
  fillRect(grid, 8, 13, 15, 13, 'S')
  fillRect(grid, 14, 13, 15, 13, 's')
  fillRect(grid, 9, 14, 14, 14, 'S')
  fillRect(grid, 13, 14, 14, 14, 's')
  // 목
  fillRect(grid, 10, 15, 13, 15, 'S')
  fillRect(grid, 12, 15, 13, 15, 's')

  // 눈 (2x3, 왼쪽 위 1픽셀 하이라이트)
  fillRect(grid, 9, 8, 10, 10, 'E')
  fillRect(grid, 13, 8, 14, 10, 'E')
  setCell(grid, 9, 8, 'e')
  setCell(grid, 13, 8, 'e')

  // 볼터치
  fillRect(grid, 8, 11, 9, 11, 'C')
  fillRect(grid, 14, 11, 15, 11, 'C')

  // 입 (볼터치보다 한 칸 아래, 작게)
  fillRect(grid, 11, 12, 12, 12, 'M')
}

function paintHands(grid) {
  setCell(grid, 6, 22, 'S')
  setCell(grid, 17, 22, 'S')
}

// ---------------------------------------------------------------------------
// 남성 — 짧은 흑갈색 머리, 파스텔 블루 티셔츠, 청바지, 운동화
// ---------------------------------------------------------------------------
function buildMale() {
  const grid = emptyGrid()
  paintFace(grid)

  // 머리 — 짧은 단발형, 윗머리 둥글게 + 옆머리(살짝 각진 텍스처로 덩어리감)
  fillRect(grid, 10, 0, 13, 0, 'B')
  fillRect(grid, 9, 1, 14, 1, 'B')
  fillRect(grid, 8, 2, 15, 2, 'B')
  fillRect(grid, 7, 3, 16, 3, 'B')
  fillRect(grid, 6, 4, 17, 5, 'B')
  fillRect(grid, 12, 0, 13, 1, 'b')
  fillRect(grid, 13, 2, 15, 3, 'b')
  fillRect(grid, 13, 4, 17, 5, 'b')
  // 옆머리(구레나룻), 오른쪽은 음영
  fillRect(grid, 6, 4, 7, 10, 'B')
  fillRect(grid, 16, 4, 17, 10, 'b')
  // 앞머리 텍스처 — 가운데는 짧고 양쪽으로 갈수록 한 칸씩 내려오는 지그재그
  setCell(grid, 8, 6, 'B')
  setCell(grid, 9, 6, 'B')
  setCell(grid, 10, 6, 'B')
  setCell(grid, 14, 6, 'b')
  setCell(grid, 15, 6, 'b')
  setCell(grid, 7, 6, 'B')

  paintHands(grid)

  // 상의 — 티셔츠 (왼쪽 베이스, 오른쪽 음영)
  fillRect(grid, 7, 16, 16, 22, 'T')
  fillRect(grid, 12, 16, 16, 22, 't')

  // 하의 — 청바지 (허리 + 다리 2개)
  fillRect(grid, 7, 23, 16, 23, 'P')
  fillRect(grid, 12, 23, 16, 23, 'p')
  fillRect(grid, 8, 24, 10, 28, 'P')
  fillRect(grid, 13, 24, 15, 28, 'p')

  // 신발 — 운동화 (양쪽 밑창 넓게 + 포인트 컬러)
  fillRect(grid, 7, 29, 10, 30, 'F')
  fillRect(grid, 13, 29, 16, 30, 'f')
  fillRect(grid, 6, 31, 10, 31, 'F')
  fillRect(grid, 13, 31, 17, 31, 'f')
  setCell(grid, 8, 29, 'A')
  setCell(grid, 15, 29, 'A')

  addOutline(grid, 'K')
  return gridToRows(grid)
}

// ---------------------------------------------------------------------------
// 여성 — 어깨 길이 갈색 단발, 핑크 블라우스, 치마, 메리제인 구두
// ---------------------------------------------------------------------------
function buildFemale() {
  const grid = emptyGrid()
  paintFace(grid)

  // 머리 — 단발 크라운
  fillRect(grid, 10, 0, 13, 0, 'B')
  fillRect(grid, 9, 1, 14, 1, 'B')
  fillRect(grid, 8, 2, 15, 2, 'B')
  fillRect(grid, 6, 3, 17, 3, 'B')
  fillRect(grid, 5, 4, 18, 5, 'B')
  fillRect(grid, 12, 0, 13, 1, 'b')
  fillRect(grid, 14, 2, 15, 3, 'b')
  fillRect(grid, 14, 4, 18, 5, 'b')
  // 어깨까지 내려오는 옆머리 (볼륨감 있게 아래로 갈수록 살짝 벌어짐)
  fillRect(grid, 5, 4, 7, 15, 'B')
  fillRect(grid, 16, 4, 18, 15, 'b')
  fillRect(grid, 4, 16, 7, 19, 'B')
  fillRect(grid, 16, 16, 19, 19, 'b')
  // 앞머리 텍스처
  setCell(grid, 8, 6, 'B')
  setCell(grid, 9, 6, 'B')
  setCell(grid, 10, 6, 'B')
  setCell(grid, 14, 6, 'b')
  setCell(grid, 15, 6, 'b')
  setCell(grid, 7, 6, 'B')

  paintHands(grid)

  // 상의 — 블라우스
  fillRect(grid, 7, 16, 16, 22, 'T')
  fillRect(grid, 12, 16, 16, 22, 't')

  // 하의 — 치마 (플레어) + 아래로 드러나는 다리
  fillRect(grid, 7, 23, 16, 23, 'P')
  fillRect(grid, 12, 23, 16, 23, 'p')
  fillRect(grid, 6, 24, 17, 26, 'P')
  fillRect(grid, 12, 24, 17, 26, 'p')
  fillRect(grid, 9, 27, 10, 28, 'S')
  fillRect(grid, 13, 27, 14, 28, 's')

  // 신발 — 메리제인 (어두운 베이스 + 밝은 스트랩)
  fillRect(grid, 8, 29, 10, 31, 'F')
  fillRect(grid, 13, 29, 15, 31, 'f')
  setCell(grid, 9, 29, 'A')
  setCell(grid, 14, 29, 'A')

  addOutline(grid, 'K')
  return gridToRows(grid)
}

function setChar(str, index, ch) {
  return str.slice(0, index) + ch + str.slice(index + 1)
}

// 눈 깜빡임 프레임 — 눈 부분(8~10행)을 가는 감은 눈 선으로 바꿔치기.
function getBlinkRows(baseRows) {
  const rows = [...baseRows]
  rows[8] = setChar(setChar(rows[8], 9, 'S'), 10, 'S')
  rows[8] = setChar(setChar(rows[8], 13, 'S'), 14, 's')
  rows[9] = setChar(setChar(rows[9], 9, 'E'), 10, 'E')
  rows[9] = setChar(setChar(rows[9], 13, 'E'), 14, 'E')
  rows[10] = setChar(setChar(rows[10], 9, 'S'), 10, 'S')
  rows[10] = setChar(setChar(rows[10], 13, 'S'), 14, 's')
  return rows
}

export const MALE_ROWS = buildMale()
export const FEMALE_ROWS = buildFemale()
export const MALE_BLINK_ROWS = getBlinkRows(MALE_ROWS)
export const FEMALE_BLINK_ROWS = getBlinkRows(FEMALE_ROWS)

export const MALE_PALETTE = {
  K: '#4A2430',
  S: '#FFD9B3',
  s: '#F0BE91',
  E: '#3A2420',
  e: '#FFFFFF',
  C: '#FFAFC0',
  M: '#B5574A',
  B: '#3B2A24',
  b: '#2A1C18',
  T: '#8FB8E0',
  t: '#6E9BC9',
  P: '#5A6B8C',
  p: '#44536F',
  F: '#F5F0E6',
  f: '#D8CFC0',
  A: '#E8829A',
}

export const FEMALE_PALETTE = {
  K: '#4A2430',
  S: '#FFD9B3',
  s: '#F0BE91',
  E: '#3A2420',
  e: '#FFFFFF',
  C: '#FFAFC0',
  M: '#B5574A',
  B: '#5A3A28',
  b: '#432A1C',
  T: '#F2A8BC',
  t: '#D98AA0',
  P: '#C97C94',
  p: '#A85F78',
  F: '#3B2A24',
  f: '#2A1C18',
  A: '#F2C14E',
}

export const AVATAR_GRID_WIDTH = W
export const AVATAR_GRID_HEIGHT = H

export const MALE_EMAIL = 'jiminppoppo93@gmail.com'
export const FEMALE_EMAIL = 'eunjippoppo95@gmail.com'
export const EMAIL_FALLBACK_NAME = {
  [MALE_EMAIL]: '지민',
  [FEMALE_EMAIL]: '은지',
}
