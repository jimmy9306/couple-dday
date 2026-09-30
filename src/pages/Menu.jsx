import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRelationship, subscribeToChanges } from '../lib/store'
import { getDayCount } from '../lib/date-utils'
import { HeartIcon, CalendarIcon, CheckIcon, GiftIcon, GearIcon } from '../components/icons'

const MENU_ITEMS = [
  { label: '디데이', to: '/dday', Icon: HeartIcon },
  { label: '달력', to: '/calendar', Icon: CalendarIcon },
  { label: '투두', to: '/todo', Icon: CheckIcon },
  { label: '기념일', to: '/anniversaries', Icon: GiftIcon },
  { label: '설정', to: '/settings', Icon: GearIcon },
]

function MenuItem({ label, to, Icon }) {
  const navigate = useNavigate()
  const [pressed, setPressed] = useState(false)

  const handleClick = () => {
    setPressed(true)
    window.setTimeout(() => navigate(to), 150)
    window.setTimeout(() => setPressed(false), 450)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`lp-menu-item flex w-full items-center gap-4 px-5 py-4 text-left ${
        pressed ? 'is-pressed' : ''
      }`}
    >
      <span className="lp-menu-icon flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border-2 border-love-500 text-love-600 shadow-[0_0_10px_rgba(199,125,214,0.45)] transition-shadow">
        <Icon className="h-6 w-6" />
      </span>
      <span className="text-glow flex-1 text-xl font-semibold text-love-700">{label}</span>
      <span className="text-lg text-love-400">›</span>
    </button>
  )
}

export default function Menu() {
  const [dayCount, setDayCount] = useState(null)

  useEffect(() => {
    const load = () => {
      getRelationship().then((rel) => {
        setDayCount(rel?.startDate ? getDayCount(rel.startDate) : null)
      })
    }
    load()
    const unsubscribe = subscribeToChanges(load)
    return unsubscribe
  }, [])

  return (
    <div className="flex flex-col gap-4 pt-4">
      <div className="flex items-start justify-between">
        <h1 className="text-glow-strong text-3xl font-extrabold tracking-wide text-love-600">
          LOVEPAD
        </h1>
        <p className="pt-2 text-right text-[10px] font-semibold uppercase leading-tight tracking-widest text-love-400">
          Our Anniversary
          <br />
          Program
        </p>
      </div>

      <nav className="frame-glow divide-y divide-love-100 overflow-hidden">
        {MENU_ITEMS.map((item) => (
          <MenuItem key={item.to} {...item} />
        ))}
      </nav>

      <p className="pr-1 text-right text-[11px] font-medium uppercase tracking-widest text-love-400">
        Couple No.1 / Day {dayCount ?? '—'}
      </p>
    </div>
  )
}
