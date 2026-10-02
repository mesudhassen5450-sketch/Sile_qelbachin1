'use client'

/**
 * AuthContext — real Supabase session only.
 * Identity comes from auth.users (Google / email), never from typed form fields alone.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { googleAvatarUrl, googleDisplayName } from '@/lib/auth/google'
import { isSupabaseAuthConfigured } from '@/lib/supabase/env'

export type UserProfile = {
  id: string
  user_id: string
  display_name: string
  email: string
  created_at?: string
  updated_at?: string
}

type AuthState = {
  loading: boolean
  configured: boolean
  session: Session | null
  user: User | null
  profile: UserProfile | null
  emailVerified: boolean
  displayName: string
  avatarUrl: string | null
  refresh: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

async function loadProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('id, user_id, display_name, email, created_at, updated_at')
      .eq('user_id', userId)
      .maybeSingle()
    return (data as UserProfile | null) || null
  } catch {
    return null
  }
}

/** Ensure a profiles row exists after Google (or email) login when the trigger missed. */
async function ensureProfile(user: User): Promise<UserProfile | null> {
  const existing = await loadProfile(user.id)
  if (existing) {
    const name = googleDisplayName(user)
    const email = user.email || existing.email
    if (
      (name && !existing.display_name) ||
      (email && email !== existing.email)
    ) {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data } = await supabase
          .from('profiles')
          .update({
            display_name: existing.display_name || name,
            email,
          })
          .eq('user_id', user.id)
          .select('id, user_id, display_name, email, created_at, updated_at')
          .maybeSingle()
        return (data as UserProfile | null) || existing
      } catch {
        return existing
      }
    }
    return existing
  }

  try {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .upsert(
        {
          user_id: user.id,
          display_name: googleDisplayName(user),
          email: user.email || '',
        },
        { onConflict: 'user_id' }
      )
      .select('id, user_id, display_name, email, created_at, updated_at')
      .maybeSingle()
    return (data as UserProfile | null) || null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseAuthConfigured()
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)

  const applySession = useCallback(async (next: Session | null) => {
    setSession(next)
    const nextUser = next?.user ?? null
    setUser(nextUser)
    if (nextUser) {
      const p = await ensureProfile(nextUser)
      setProfile(p)
    } else {
      setProfile(null)
    }
  }, [])

  const refresh = useCallback(async () => {
    if (!configured) {
      setSession(null)
      setUser(null)
      setProfile(null)
      setLoading(false)
      return
    }
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      // getUser() revalidates with Supabase (more reliable than getSession alone)
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        await applySession(null)
        return
      }
      const { data } = await supabase.auth.getSession()
      await applySession(data.session)
    } catch {
      setSession(null)
      setUser(null)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [configured, applySession])

  useEffect(() => {
    if (!configured) {
      setLoading(false)
      return
    }

    let mounted = true
    let unsubscribe: (() => void) | undefined

    void (async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: userData } = await supabase.auth.getUser()
        if (!mounted) return
        if (!userData.user) {
          await applySession(null)
        } else {
          const { data } = await supabase.auth.getSession()
          await applySession(data.session)
        }
        setLoading(false)

        const { data: sub } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
          if (!mounted) return
          await applySession(nextSession)
        })
        unsubscribe = () => sub.subscription.unsubscribe()
      } catch {
        if (mounted) setLoading(false)
      }
    })()

    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)

    return () => {
      mounted = false
      unsubscribe?.()
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [configured, applySession, refresh])

  const signOut = useCallback(async () => {
    if (!configured) return
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch {
      // ignore
    }
    setSession(null)
    setUser(null)
    setProfile(null)
  }, [configured])

  const emailVerified = Boolean(user?.email_confirmed_at)
  const displayName =
    profile?.display_name?.trim() || (user ? googleDisplayName(user) : '') || user?.email || ''
  const avatarUrl = user ? googleAvatarUrl(user) : null

  const value = useMemo<AuthState>(
    () => ({
      loading,
      configured,
      session,
      user,
      profile,
      emailVerified,
      displayName,
      avatarUrl,
      refresh,
      signOut,
    }),
    [
      loading,
      configured,
      session,
      user,
      profile,
      emailVerified,
      displayName,
      avatarUrl,
      refresh,
      signOut,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be within AuthProvider')
  return ctx
}
