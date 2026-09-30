import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Menu from './pages/Menu'
import DDay from './pages/DDay'
import Calendar from './pages/Calendar'
import Todo from './pages/Todo'
import Anniversaries from './pages/Anniversaries'
import Settings from './pages/Settings'

function NotAllowed() {
  const { user, signOut } = useAuth()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-love-50 px-6 text-center">
      <div className="frame-glow flex flex-col items-center gap-3 px-6 py-8">
        <div className="text-4xl">🚫</div>
        <h1 className="text-glow text-lg font-bold text-love-700">초대된 사용자만 이용 가능</h1>
        <p className="text-sm text-love-500">
          {user?.email ? `${user.email} 계정은` : '이 계정은'} 이 앱을 쓸 수 있는 목록에 없어요.
        </p>
        <button
          type="button"
          onClick={signOut}
          className="mt-2 rounded-xl border border-love-300 px-4 py-2 text-sm font-semibold text-love-600"
        >
          로그아웃
        </button>
      </div>
    </div>
  )
}

function RequireAuth({ children }) {
  const { isAuthed, loading, mode, isMember, memberLoading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-love-400">
        불러오는 중...
      </div>
    )
  }

  if (!isAuthed) {
    return <Navigate to="/login" replace />
  }

  if (mode === 'supabase') {
    if (isMember === null || memberLoading) {
      return (
        <div className="flex h-screen items-center justify-center text-love-400">
          확인 중...
        </div>
      )
    }
    if (isMember === false) {
      return <NotAllowed />
    }
  }

  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Menu />} />
        <Route path="dday" element={<DDay />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="todo" element={<Todo />} />
        <Route path="anniversaries" element={<Anniversaries />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
