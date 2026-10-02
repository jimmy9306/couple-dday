// 아바타용 16x24 픽셀 그리드 공용 유틸. icons.jsx의 PixelIcon과 같은 방식(문자열 행 →
// '#'=칠해짐)이지만, 레이어를 여러 장 겹쳐 그려야 해서 그리드↔SVG rect 변환을 분리해둠.

export const GRID_WIDTH = 16
export const GRID_HEIGHT = 24

/** 16x24 문자열 배열('#'/'.')을 boolean 2차원 배열로 변환 */
export function gridFromRows(rows) {
  return rows.map((row) => row.split('').map((ch) => ch === '#'))
}

/** 빈 칸으로 채운 그리드 (높이/너비 기본값은 아바타 기준) */
export function emptyGrid(width = GRID_WIDTH, height = GRID_HEIGHT) {
  return Array.from({ length: height }, () => Array(width).fill(false))
}

/** grid의 칠해진 칸만 <rect> 배열로 변환 (SVG 자식으로 바로 사용) */
export function gridToRects(grid, color, keyPrefix) {
  const rects = []
  grid.forEach((row, y) => {
    row.forEach((filled, x) => {
      if (filled) {
        rects.push({ key: `${keyPrefix}-${x}-${y}`, x, y, color })
      }
    })
  })
  return rects
}
