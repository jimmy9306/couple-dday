import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Home from './pages/Home'
import DDay from './pages/DDay'
import Calendar from './pages/Calendar'
import Todo from './pages/Todo'
import Settings from './pages/Settings'
import PixelPanel from './components/PixelPanel'

function NotAllowed() {
  const { user, signOut } = useAuth()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-pastel-bg px-6 text-center">
      <PixelPanel innerClassName="flex flex-col items-center gap-3 px-6 py-8">
        <h1 className="font-title text-[14px] text-pastel-text">초대된 사용자만 이용 가능</h1>
        <p className="font-body text-[11px] text-pastel-text">
          {user?.email ? `${user.email} 계정은` : '이 계정은'} 이 앱을 쓸 수 있는 목록에 없어요.
        </p>
        <button
          type="button"
          onClick={signOut}
          className="pixel-btn font-title border-2 border-pastel-border bg-pastel-accent px-4 py-2 text-[14px] text-pastel-text"
        >
          로그아웃
        </button>
      </PixelPanel>
    </div>
  )
}

function RequireAuth({ children }) {
  const { isAuthed, loading, mode, isMember, memberLoading } = useAuth()

  if (loading) {
    return (
      <div className="font-body flex h-screen items-center justify-center text-[11px] text-pastel-text">
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
        <div className="font-body flex h-screen items-center justify-center text-[11px] text-pastel-text">
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
        <Route index element={<Home />} />
        <Route path="dday" element={<DDay />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="todo" element={<Todo />} />
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
