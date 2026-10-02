import { gridFromRows, GRID_HEIGHT, GRID_WIDTH } from '../lib/pixelGrid'
import {
  BOTTOM_OPTIONS,
  DEFAULT_SKIN_COLOR,
  SHOES_OPTIONS,
  SKIN_ROWS,
  TOP_OPTIONS,
  findOption,
  getHairOptions,
} from '../lib/avatarParts'

function Layer({ rowsData, color }) {
  const grid = gridFromRows(rowsData)
  const cells = []
  grid.forEach((row, y) => {
    row.forEach((filled, x) => {
      if (filled) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={color} />)
    })
  })
  return cells
}

// 16x24 픽셀 캐릭터를 레이어 순서(몸→신발→하의→상의→머리)대로 겹쳐 그림.
// 나중에 그려지는 레이어가 자연스럽게 앞선 레이어를 덮으므로 별도 병합 계산이 필요 없음.
export default function AvatarSVG({ gender, config, className = '', style }) {
  const top = findOption(TOP_OPTIONS, config.top)
  const bottom = findOption(BOTTOM_OPTIONS, config.bottom)
  const shoes = findOption(SHOES_OPTIONS, config.shoes)
  const hairOptions = getHairOptions(gender)
  const hair = findOption(hairOptions, config.hair)

  return (
    <svg
      viewBox={`0 0 ${GRID_WIDTH} ${GRID_HEIGHT}`}
      className={className}
      shapeRendering="crispEdges"
      style={{ imageRendering: 'pixelated', ...style }}
    >
      <Layer rowsData={SKIN_ROWS} color={DEFAULT_SKIN_COLOR} />
      <Layer rowsData={shoes.rows} color={config.shoesColor} />
      {!top.isDress && <Layer rowsData={bottom.rows} color={config.bottomColor} />}
      <Layer rowsData={top.rows} color={config.topColor} />
      <Layer rowsData={hair.rows} color={config.hairColor} />
    </svg>
  )
}
