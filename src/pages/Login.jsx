import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function Login() {
  const { mode, isAuthed, signIn, signUp, setLocalName } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  if (isAuthed) return <Navigate to="/" replace />

  const handleLocalSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setLocalName(name.trim())
  }

  const handleSignIn = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setBusy(true)
    try {
      await signIn(email.trim(), password)
    } catch (err) {
      setError(err.message || '로그인에 실패했어요.')
    } finally {
      setBusy(false)
    }
  }

  const handleSignUp = async () => {
    setError('')
    setInfo('')
    if (!email.trim() || !password) {
      setError('이메일과 비밀번호를 입력해 주세요.')
      return
    }
    setBusy(true)
    try {
      await signUp(email.trim(), password)
      setInfo('가입 완료! 이메일 확인이 필요할 수 있어요. 확인 후 로그인해 주세요.')
    } catch (err) {
      setError(err.message || '회원가입에 실패했어요.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-love-50 px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-glow-strong text-3xl font-extrabold tracking-wide text-love-600">
            LOVEPAD
          </h1>
          <p className="mt-1 text-sm text-love-400">
            {mode === 'supabase' ? '둘만의 공간, 로그인해서 시작해요' : '이름을 입력하고 시작해요'}
          </p>
        </div>

        <div className="frame-glow p-6">
          {mode === 'supabase' ? (
            <form onSubmit={handleSignIn} className="space-y-3">
              <input
                type="email"
                required
                placeholder="이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-love-200 bg-white px-4 py-3 text-sm outline-none focus:border-love-400"
              />
              <input
                type="password"
                required
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-love-200 bg-white px-4 py-3 text-sm outline-none focus:border-love-400"
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
              {info && <p className="text-xs text-love-600">{info}</p>}
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-love-500 py-3 text-sm font-semibold text-white shadow-[0_0_10px_rgba(199,125,214,0.5)] disabled:opacity-50"
              >
                로그인
              </button>
              <button
                type="button"
                onClick={handleSignUp}
                disabled={busy}
                className="w-full rounded-xl border border-love-300 py-3 text-sm font-semibold text-love-600 disabled:opacity-50"
              >
                회원가입
              </button>
            </form>
          ) : (
            <form onSubmit={handleLocalSubmit} className="space-y-3">
              <input
                type="text"
                required
                placeholder="이름 (예: 지민)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-love-200 bg-white px-4 py-3 text-sm outline-none focus:border-love-400"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-love-500 py-3 text-sm font-semibold text-white shadow-[0_0_10px_rgba(199,125,214,0.5)]"
              >
                시작하기
              </button>
              <p className="text-center text-xs text-gray-400">
                Supabase 연결 전이라 이 기기(브라우저)에만 저장돼요.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
