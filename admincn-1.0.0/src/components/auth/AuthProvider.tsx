'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import type { Permission, StaffProfile, StaffRole } from '@/lib/auth/permissions'
import { canAccessPath, hasPermission } from '@/lib/auth/permissions'
import { isSupabaseAuthConfigured } from '@/lib/supabase/env'

type AuthState = {
  loading: boolean
  authenticated: boolean
  profile: StaffProfile | null
  role: StaffRole | null
  permissions: Permission[]
  email: string | null
  refresh: () => Promise<void>
  can: (permission: Permission) => boolean
  canPath: (path: string) => boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<StaffProfile | null>(null)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [email, setEmail] = useState<string | null>(null)
  const [authenticated, setAuthenticated] = useState(false)

  const refresh = useCallback(async () => {
    if (!isSupabaseAuthConfigured()) {
      setAuthenticated(false)
      setProfile(null)
      setPermissions([])
      setEmail(null)
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/session', { cache: 'no-store' })
      const data = await res.json()
      if (res.ok && data.ok) {
        setAuthenticated(true)
        setProfile(data.profile)
        setPermissions(data.permissions || [])
        setEmail(data.user?.email || null)
      } else {
        setAuthenticated(false)
        setProfile(null)
        setPermissions([])
        setEmail(null)
      }
    } catch {
      setAuthenticated(false)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const signOut = useCallback(async () => {
    await fetch('/api/auth/session', { method: 'DELETE' })
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch {
      // ignore
    }
    setAuthenticated(false)
    setProfile(null)
    window.location.href = '/pages/auth/login'
  }, [])

  const value = useMemo<AuthState>(() => {
    const role = profile?.role || null
    return {
      loading,
      authenticated,
      profile,
      role,
      permissions,
      email,
      refresh,
      can: (permission: Permission) => (role ? hasPermission(role, permission) : false),
      canPath: (path: string) => (role ? canAccessPath(role, path) : false),
      signOut
    }
  }, [loading, authenticated, profile, permissions, email, refresh, signOut])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
