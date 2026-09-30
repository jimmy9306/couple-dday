// 레트로 메뉴판용 심플 라인 아이콘. 전부 stroke 기반 직접 제작 (외부 아이콘셋 미사용).

const base = {
  viewBox: '0 0 32 32',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function HeartIcon({ className }) {
  return (
    <svg {...base} className={className}>
      <path d="M16 27.5S4.5 20 4.5 12.2C4.5 8.2 7.6 5 11.4 5c2.3 0 4.3 1.2 4.6 3 0.3-1.8 2.3-3 4.6-3 3.8 0 6.9 3.2 6.9 7.2 0 7.8-11.5 15.3-11.5 15.3z" />
    </svg>
  )
}

export function CalendarIcon({ className }) {
  return (
    <svg {...base} className={className}>
      <rect x="5" y="8" width="22" height="19" rx="3" />
      <line x1="5" y1="13.5" x2="27" y2="13.5" />
      <line x1="11" y1="5" x2="11" y2="10" />
      <line x1="21" y1="5" x2="21" y2="10" />
    </svg>
  )
}

export function CheckIcon({ className }) {
  return (
    <svg {...base} className={className}>
      <rect x="5" y="5" width="22" height="22" rx="6" />
      <path d="M10 17l4.3 4.3L22.5 12.5" />
    </svg>
  )
}

export function GiftIcon({ className }) {
  return (
    <svg {...base} className={className}>
      <rect x="5" y="13.5" width="22" height="13.5" rx="2" />
      <line x1="5" y1="18.5" x2="27" y2="18.5" />
      <line x1="16" y1="13.5" x2="16" y2="27" />
      <path d="M16 13.5c-1.6-5-8.4-5.2-7.6-1.3 0.4 2 3.9 1.8 7.6 1.3z" />
      <path d="M16 13.5c1.6-5 8.4-5.2 7.6-1.3-0.4 2-3.9 1.8-7.6 1.3z" />
    </svg>
  )
}

export function GearIcon({ className }) {
  const teeth = Array.from({ length: 8 })
  return (
    <svg {...base} className={className}>
      <circle cx="16" cy="16" r="6.2" />
      {teeth.map((_, i) => {
        const angle = (i * 360) / teeth.length
        const rad = (angle * Math.PI) / 180
        const x1 = 16 + 8.6 * Math.cos(rad)
        const y1 = 16 + 8.6 * Math.sin(rad)
        const x2 = 16 + 13 * Math.cos(rad)
        const y2 = 16 + 13 * Math.sin(rad)
        return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} />
      })}
    </svg>
  )
}
