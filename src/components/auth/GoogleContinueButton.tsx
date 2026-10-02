'use client'

import { useState } from 'react'
import { signInWithGoogle } from '@/lib/auth/google'
import { isSupabaseAuthConfigured } from '@/lib/supabase/env'

function GoogleGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

type Props = {
  next?: string
  onError?: (message: string) => void
  className?: string
  label?: string
  loadingLabel?: string
}

export default function GoogleContinueButton({
  next = '/account',
  onError,
  className = '',
  label = 'Continue with Google',
  loadingLabel = 'Connecting to Google…',
}: Props) {
  const [busy, setBusy] = useState(false)
  const configured = isSupabaseAuthConfigured()

  const onClick = async () => {
    if (busy || !configured) return
    setBusy(true)
    onError?.('')
    try {
      const { error } = await signInWithGoogle(next)
      if (error) {
        onError?.(error)
        setBusy(false)
      }
      // On success the browser navigates away — keep busy=true
    } catch {
      onError?.('Could not start Google sign-in. Please try again.')
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy || !configured}
      aria-busy={busy}
      className={`w-full inline-flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-[#E7E2D8] dark:border-neutral-600 bg-white dark:bg-neutral-900 text-sm font-bold text-neutral-800 dark:text-neutral-100 hover:bg-[#F8F6F1] dark:hover:bg-neutral-800 transition disabled:opacity-60 shadow-sm ${className}`}
    >
      <GoogleGlyph className="w-5 h-5 flex-shrink-0" />
      <span>{busy ? loadingLabel : label}</span>
    </button>
  )
}
