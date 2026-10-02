'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type AdminLang = 'en' | 'am'

type Dict = { en: string; am: string }

type AdminLocaleValue = {
  lang: AdminLang
  setLang: (lang: AdminLang) => void
  t: (dict: Dict) => string
}

const STORAGE_KEY = 'sile-admin-lang'

const AdminLocaleContext = createContext<AdminLocaleValue | null>(null)

export function AdminLocaleProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<AdminLang>('am')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === 'en' || saved === 'am') setLangState(saved)
    } catch {
      /* ignore */
    }
  }, [])

  const setLang = useCallback((next: AdminLang) => {
    setLangState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
  }, [])

  const t = useCallback((dict: Dict) => (lang === 'am' ? dict.am : dict.en), [lang])

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])

  return <AdminLocaleContext.Provider value={value}>{children}</AdminLocaleContext.Provider>
}

export function useAdminLocale() {
  const ctx = useContext(AdminLocaleContext)
  if (!ctx) {
    return {
      lang: 'am' as AdminLang,
      setLang: () => {},
      t: (dict: Dict) => dict.am,
    }
  }
  return ctx
}
