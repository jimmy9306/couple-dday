import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { isSupabaseEnabled, supabase } from './supabase'

const LOCAL_NAME_KEY = 'dday_local_name'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [localName, setLocalNameState] = useState(() =>
    typeof window === 'undefined' ? '' : localStorage.getItem(LOCAL_NAME_KEY) || ''
  )
  const [loading, setLoading] = useState(isSupabaseEnabled)

  // 로그인은 됐지만 allowed_members(둘만 쓰는 허용 목록)에 없는 사람인지 확인.
  // null = 아직 확인 전(로그인 안 했거나 체크 중), true/false = 확인 완료.
  const [isMember, setIsMember] = useState(isSupabaseEnabled ? null : true)
  const [memberLoading, setMemberLoading] = useState(false)

  useEffect(() => {
    if (!isSupabaseEnabled) return

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!isSupabaseEnabled) return

    if (!user) {
      setIsMember(null)
      return
    }

    let cancelled = false
    setMemberLoading(true)
    supabase
      .from('allowed_members')
      .select('email')
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.error('허용 사용자 확인 실패:', error)
          setIsMember(false)
        } else {
          setIsMember(Boolean(data && data.length > 0))
        }
        setMemberLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user])

  const setLocalName = (name) => {
    localStorage.setItem(LOCAL_NAME_KEY, name)
    setLocalNameState(name)
  }

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    if (isSupabaseEnabled) {
      await supabase.auth.signOut()
    } else {
      localStorage.removeItem(LOCAL_NAME_KEY)
      setLocalNameState('')
    }
  }

  /** 표시 이름 변경 (Supabase 모드: user_metadata.display_name / 로컬 모드: localStorage) */
  const updateDisplayName = async (name) => {
    if (isSupabaseEnabled) {
      const { data, error } = await supabase.auth.updateUser({ data: { display_name: name } })
      if (error) throw error
      setUser(data.user)
    } else {
      setLocalName(name)
    }
  }

  const authorName = isSupabaseEnabled
    ? user?.user_metadata?.display_name || user?.email || null
    : localName || null

  const isAuthed = isSupabaseEnabled ? Boolean(user) : Boolean(localName)

  const value = useMemo(
    () => ({
      mode: isSupabaseEnabled ? 'supabase' : 'local',
      user,
      authorName,
      isAuthed,
      loading,
      isMember,
      memberLoading,
      signIn,
      signUp,
      signOut,
      setLocalName,
      updateDisplayName,
    }),
    [user, authorName, isAuthed, loading, localName, isMember, memberLoading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
