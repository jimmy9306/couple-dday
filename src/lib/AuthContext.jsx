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

  const authorName = isSupabaseEnabled ? user?.email ?? null : localName || null

  const isAuthed = isSupabaseEnabled ? Boolean(user) : Boolean(localName)

  const value = useMemo(
    () => ({
      mode: isSupabaseEnabled ? 'supabase' : 'local',
      user,
      authorName,
      isAuthed,
      loading,
      signIn,
      signUp,
      signOut,
      setLocalName,
    }),
    [user, authorName, isAuthed, loading, localName]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
