import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Main from './pages/Main'
import Calendar from './pages/Calendar'
import Todo from './pages/Todo'

function RequireAuth({ children }) {
  const { isAuthed, loading } = useAuth()

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
        <Route index element={<Main />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="todo" element={<Todo />} />
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
