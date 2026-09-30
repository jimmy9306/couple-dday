import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import PixelPanel from '../components/PixelPanel'
import { HeartIcon } from '../components/icons'

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
    <div className="flex min-h-screen items-center justify-center bg-pastel-bg px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-2">
            <HeartIcon className="h-4 w-4 text-pastel-border" />
            <h1 className="font-title text-[28px] leading-none text-pastel-text">LOVE QUEST</h1>
            <HeartIcon className="h-4 w-4 text-pastel-border" />
          </div>
          <p className="font-body text-[11px] text-pastel-text">
            {mode === 'supabase' ? '둘만의 공간, 로그인해서 시작해요' : '이름을 입력하고 시작해요'}
          </p>
        </div>

        <PixelPanel innerClassName="p-6">
          {mode === 'supabase' ? (
            <form onSubmit={handleSignIn} className="space-y-3">
              <input
                type="email"
                required
                placeholder="이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="font-body w-full border-2 border-pastel-border bg-pastel-bg px-3 py-2 text-[11px] text-pastel-text outline-none"
              />
              <input
                type="password"
                required
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="font-body w-full border-2 border-pastel-border bg-pastel-bg px-3 py-2 text-[11px] text-pastel-text outline-none"
              />
              {error && <p className="font-body text-[11px] text-pastel-border">{error}</p>}
              {info && <p className="font-body text-[11px] text-pastel-text">{info}</p>}
              <button
                type="submit"
                disabled={busy}
                className="pixel-btn font-title w-full border-2 border-pastel-border bg-pastel-accent py-2 text-[14px] text-pastel-text disabled:opacity-50"
              >
                로그인
              </button>
              <button
                type="button"
                onClick={handleSignUp}
                disabled={busy}
                className="pixel-btn font-title w-full border-2 border-pastel-border bg-pastel-bg py-2 text-[14px] text-pastel-text disabled:opacity-50"
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
                className="font-body w-full border-2 border-pastel-border bg-pastel-bg px-3 py-2 text-[11px] text-pastel-text outline-none"
              />
              <button
                type="submit"
                className="pixel-btn font-title w-full border-2 border-pastel-border bg-pastel-accent py-2 text-[14px] text-pastel-text"
              >
                시작하기
              </button>
              <p className="font-body text-center text-[11px] text-pastel-accent">
                Supabase 연결 전이라 이 기기(브라우저)에만 저장돼요.
              </p>
            </form>
          )}
        </PixelPanel>
      </div>
    </div>
  )
}
