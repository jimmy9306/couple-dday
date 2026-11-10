// 작은 픽셀 모양(문자열 격자, '#' = 칸)을 "흰 칸 + 1칸 둘레 외곽선" SVG 사각형 목록으로 바꿔주는 도우미.
// 눈송이와 입김처럼 연분홍 배경 위에서 흰색이 잘 보이게 옅은 분홍 외곽선을 두를 때 씀.
export const SOFT_OUTLINE = '#F4A9C6'

export function buildOutlinedShape(rows, fill = '#fff', outline = SOFT_OUTLINE) {
  const h = rows.length
  const w = rows[0].length
  const on = (x, y) => rows[y - 1]?.[x - 1] === '#' // 1칸 여백(외곽선 자리)을 포함한 좌표계
  const rects = []
  for (let y = 0; y < h + 2; y += 1) {
    for (let x = 0; x < w + 2; x += 1) {
      if (on(x, y)) {
        rects.push({ x, y, fill })
      } else if (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1)) {
        rects.push({ x, y, fill: outline })
      }
    }
  }
  return { w: w + 2, h: h + 2, rects }
}
