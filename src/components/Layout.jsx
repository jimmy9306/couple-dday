import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { HomeIcon, HeartIcon, CalendarIcon, CheckIcon, GearIcon } from './icons'

const tabs = [
  { to: '/', label: '홈', Icon: HomeIcon, end: true },
  { to: '/dday', label: '디데이', Icon: HeartIcon, end: false },
  { to: '/calendar', label: '달력', Icon: CalendarIcon, end: false },
  { to: '/todo', label: '투두', Icon: CheckIcon, end: false },
  { to: '/settings', label: '설정', Icon: GearIcon, end: false },
]

export default function Layout() {
  const { authorName, signOut, mode } = useAuth()

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-pastel-bg pt-[env(safe-area-inset-top)]">
      {mode === 'local' && (
        <div className="font-body border-b-2 border-pastel-border bg-pastel-accent px-4 py-1.5 text-center text-[11px] text-pastel-text">
          테스트 모드 — 이 기기에만 저장돼요 (연인과 공유 안 됨)
        </div>
      )}

      <header className="font-body flex items-center justify-between px-4 pt-3 pb-3 text-[11px]">
        <div className="text-pastel-text">{authorName ? `${authorName} 님` : ''}</div>
        <button type="button" onClick={signOut} className="text-pastel-text underline">
          {mode === 'supabase' ? '로그아웃' : '이름 재설정'}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+6rem)]">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 border-t-2 border-pastel-border bg-pastel-box pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around">
          {tabs.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `font-body flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] ${
                  isActive ? 'text-pastel-border' : 'text-pastel-text'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
