'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import UserAvatar from '@/components/auth/UserAvatar'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { LogOut, UserRound } from 'lucide-react'

type Props = {
  variant?: 'desktop' | 'mobile'
  onNavigate?: () => void
}

export default function NavAuth({ variant = 'desktop', onNavigate }: Props) {
  const { getLocalized } = useLanguage()
  const { user, profile, loading, configured, signOut, displayName, avatarUrl } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  if (!configured) return null

  if (loading) {
    return (
      <div
        className={`rounded-full bg-neutral-200 dark:bg-neutral-700 animate-pulse ${
          variant === 'mobile' ? 'h-10 w-full' : 'h-9 w-9'
        }`}
        aria-hidden
      />
    )
  }

  if (!user) {
    const loginHref = '/login'
    if (variant === 'mobile') {
      return (
        <Link
          href={loginHref}
          onClick={onNavigate}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-neutral-600 text-white font-bold hover:bg-white/5 transition"
        >
          {getLocalized({ en: 'Sign in', am: 'ግባ', ar: 'تسجيل الدخول' })}
        </Link>
      )
    }
    return (
      <Link
        href={loginHref}
        className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 text-xs sm:text-sm font-bold hover:border-red-600/40 hover:text-red-700 dark:hover:text-red-400 transition shadow-sm"
      >
        <UserRound className="w-4 h-4 opacity-70" />
        <span className="hidden sm:inline">
          {getLocalized({ en: 'Sign in', am: 'ግባ', ar: 'دخول' })}
        </span>
      </Link>
    )
  }

  const name =
    displayName ||
    profile?.display_name?.trim() ||
    user.email?.split('@')[0] ||
    'Account'

  const menu = (
    <div
      className={`absolute z-50 mt-2 w-56 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-xl py-1.5 ${
        variant === 'mobile' ? 'left-0 right-0 w-auto' : 'end-0'
      }`}
    >
      <div className="px-3.5 py-2.5 border-b border-neutral-100 dark:border-neutral-800">
        <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">{name}</p>
        <p className="text-2xs text-neutral-500 font-mono truncate">{user.email}</p>
      </div>
      <Link
        href="/account"
        onClick={() => {
          setOpen(false)
          onNavigate?.()
        }}
        className="block px-3.5 py-2.5 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        {getLocalized({ en: 'My account', am: 'መለያዬ', ar: 'حسابي' })}
      </Link>
      <Link
        href="/ask-question"
        onClick={() => {
          setOpen(false)
          onNavigate?.()
        }}
        className="block px-3.5 py-2.5 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        {getLocalized({ en: 'Ask an Ustaz', am: 'ኡስታዝን ጠይቅ', ar: 'اسأل الأستاذ' })}
      </Link>
      <button
        type="button"
        onClick={async () => {
          setOpen(false)
          onNavigate?.()
          await signOut()
          router.replace('/')
          router.refresh()
        }}
        className="w-full flex items-center gap-2 px-3.5 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 font-semibold"
      >
        <LogOut className="w-4 h-4" />
        {getLocalized({ en: 'Sign out', am: 'ውጣ', ar: 'تسجيل الخروج' })}
      </button>
    </div>
  )

  if (variant === 'mobile') {
    return (
      <div className="relative" ref={rootRef}>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 border border-neutral-700 text-left"
        >
          <UserAvatar url={avatarUrl} name={name} size={36} />
          <span className="min-w-0">
            <span className="block text-sm font-bold truncate">{name}</span>
            <span className="block text-[11px] text-neutral-400 truncate">{user.email}</span>
          </span>
        </button>
        {open ? menu : null}
      </div>
    )
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="rounded-full border-2 border-neutral-200 dark:border-neutral-600 hover:border-red-600/50 transition"
        aria-label={name}
        aria-expanded={open}
      >
        <UserAvatar url={avatarUrl} name={name} size={36} />
      </button>
      {open ? menu : null}
    </div>
  )
}
