import { AVATAR_GRID_HEIGHT, AVATAR_GRID_WIDTH } from '../lib/avatarParts'

// rows(문자열 배열, 한 글자=한 픽셀) + palette(글자→색상)를 받아 그대로 SVG로 렌더링.
export default function AvatarSVG({ rows, palette, className = '', style }) {
  return (
    <svg
      viewBox={`0 0 ${AVATAR_GRID_WIDTH} ${AVATAR_GRID_HEIGHT}`}
      className={className}
      shapeRendering="crispEdges"
      style={{ imageRendering: 'pixelated', ...style }}
    >
      {rows.map((row, y) =>
        row.split('').map((ch, x) => {
          if (ch === '.') return null
          const color = palette[ch]
          if (!color) return null
          return <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={color} />
        })
      )}
    </svg>
  )
}
