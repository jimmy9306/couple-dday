import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { HeartIcon, CalendarIcon, CheckIcon, GiftIcon, GearIcon } from './icons'

const tabs = [
  { to: '/', label: '홈', Icon: null, emoji: '🕹️', end: true },
  { to: '/dday', label: '디데이', Icon: HeartIcon, end: false },
  { to: '/calendar', label: '달력', Icon: CalendarIcon, end: false },
  { to: '/todo', label: '투두', Icon: CheckIcon, end: false },
  { to: '/anniversaries', label: '기념일', Icon: GiftIcon, end: false },
  { to: '/settings', label: '설정', Icon: GearIcon, end: false },
]

export default function Layout() {
  const { authorName, signOut, mode } = useAuth()

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-love-50">
      {mode === 'local' && (
        <div className="bg-amber-400 px-4 py-1.5 text-center text-xs font-semibold text-amber-950">
          🧪 테스트 모드 — 이 기기에만 저장돼요 (연인과 공유 안 됨)
        </div>
      )}

      <header className="flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3">
        <div className="text-sm font-medium text-love-700">
          {authorName ? `${authorName} 님` : ''}
        </div>
        <button
          type="button"
          onClick={signOut}
          className="text-xs text-love-400 underline underline-offset-2"
        >
          {mode === 'supabase' ? '로그아웃' : '이름 재설정'}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-24">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 border-t-[3px] border-love-500 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_16px_rgba(199,125,214,0.35)] backdrop-blur">
        <div className="flex justify-around">
          {tabs.map(({ to, label, Icon, emoji, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] ${
                  isActive ? 'text-glow font-semibold text-love-600' : 'text-gray-400'
                }`
              }
            >
              {Icon ? (
                <Icon className="h-5 w-5" />
              ) : (
                <span className="text-base leading-none">{emoji}</span>
              )}
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
