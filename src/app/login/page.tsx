'use client'

import Link from 'next/link'
import { FormEvent, Suspense, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AuthShell from '@/components/auth/AuthShell'
import GoogleContinueButton from '@/components/auth/GoogleContinueButton'
import { useLanguage } from '@/context/LanguageContext'
import { isValidEmail, mapAuthError } from '@/lib/auth/password'
import { safePublicNextPath } from '@/lib/auth/redirect'
import { isSupabaseAuthConfigured } from '@/lib/supabase/env'

function loginErrorFromQuery(code: string | null): string | null {
  if (!code) return null
  switch (code) {
    case 'verification_failed':
      return 'Email verification failed. Try signing in or request a new link.'
    case 'otp_expired':
      return 'That sign-in link expired. Please try again.'
    case 'link_invalid':
      return 'That sign-in link is invalid. Please try again.'
    case 'oauth_failed':
    case 'access_denied':
      return 'Google sign-in was cancelled or failed. Please try again.'
    default:
      return null
  }
}

function LoginForm() {
  const { getLocalized } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/'
  const urlError = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(loginErrorFromQuery(urlError))
  const [showEmail, setShowEmail] = useState(false)

  const configured = useMemo(() => isSupabaseAuthConfigured(), [])
  const safeNext = safePublicNextPath(next, '/')
  const isAskFlow = safeNext === '/ask-question' || safeNext.startsWith('/ask-question/')

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!configured) {
      setError('Authentication is not configured on this site.')
      return
    }
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.')
      return
    }
    if (!password) {
      setError('Password is required.')
      return
    }

    setLoading(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (signInError) {
        if (signInError.message.toLowerCase().includes('email not confirmed')) {
          setError('Please verify your email before continuing.')
        } else {
          setError(mapAuthError(signInError.message))
        }
        return
      }

      if (!data.user?.email_confirmed_at) {
        await supabase.auth.signOut()
        setError('Please verify your email before continuing.')
        return
      }

      router.replace(safeNext)
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      variant={isAskFlow ? 'ask' : 'general'}
      title={getLocalized({
        en: isAskFlow ? 'Sign in to ask' : 'Sign in',
        am: isAskFlow ? 'ለመጠየቅ ይግቡ' : 'ግባ',
        ar: isAskFlow ? 'سجّل لتسأل' : 'تسجيل الدخول',
      })}
      subtitle={getLocalized(
        isAskFlow
          ? {
              en: 'Your email keeps the Ustaz answer safe in your inbox.',
              am: 'ኢሜይልዎ የኡስታዝ መልስ በደህና ወደ እርስዎ ያደርሳል።',
              ar: 'بريدك يحفظ رد الأستاذ في صندوقك بأمان.',
            }
          : {
              en: 'Continue with Google — quick and friendly.',
              am: 'በGoogle ይቀጥሉ — ፈጣንና ሞቅ ያለ።',
              ar: 'تابع مع Google — سريع ولطيف.',
            }
      )}
      footer={
        <p className="text-center">
          {getLocalized({ en: 'New here?', am: 'አዲስ ነዎት?', ar: 'جديد هنا؟' })}{' '}
          <Link
            href={`/register?next=${encodeURIComponent(safeNext)}`}
            className="text-red-400 font-semibold hover:underline"
          >
            {getLocalized({ en: 'Create account', am: 'መለያ ፍጠር', ar: 'إنشاء حساب' })}
          </Link>
        </p>
      }
    >
      {!configured ? (
        <p className="text-sm text-amber-400 bg-amber-950/40 border border-amber-900 rounded-xl px-3 py-2">
          Supabase Auth is not configured.
        </p>
      ) : null}

      <GoogleContinueButton
        next={safeNext}
        onError={msg => setError(msg || null)}
        className="!border-red-600/50 !bg-transparent !text-red-400 hover:!bg-red-950/40 !shadow-none"
        label={getLocalized({
          en: 'Continue with Google',
          am: 'በGoogle ይቀጥሉ',
          ar: 'المتابعة مع Google',
        })}
        loadingLabel={getLocalized({
          en: 'Connecting to Google…',
          am: 'ከGoogle ጋር በመገናኘት…',
          ar: 'جارٍ الاتصال بـ Google…',
        })}
      />

      <button
        type="button"
        onClick={() => setShowEmail(v => !v)}
        className="text-xs font-semibold text-neutral-500 hover:text-neutral-300 transition w-full text-center"
      >
        {showEmail
          ? getLocalized({ en: 'Hide email sign-in', am: 'ኢሜይል ደብቅ', ar: 'إخفاء البريد' })
          : getLocalized({
              en: 'or sign in with email',
              am: 'ወይም በኢሜይል ይግቡ',
              ar: 'أو سجّل بالبريد',
            })}
      </button>

      {showEmail ? (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-400">
              {getLocalized({ en: 'Email address', am: 'ኢሜይል', ar: 'البريد' })}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@gmail.com"
              className="w-full rounded-xl border border-neutral-700 bg-neutral-900/80 px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-red-600/40"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-400">
              {getLocalized({ en: 'Password', am: 'የይለፍ ቃል', ar: 'كلمة المرور' })}
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full rounded-xl border border-neutral-700 bg-neutral-900/80 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600/40"
            />
          </div>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button
            type="submit"
            disabled={loading || !configured}
            className="w-full px-4 py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-500 transition disabled:opacity-60"
          >
            {loading
              ? getLocalized({ en: 'Signing in…', am: 'በመግባት…', ar: 'جاري الدخول…' })
              : getLocalized({ en: 'Sign in', am: 'ግባ', ar: 'تسجيل الدخول' })}
          </button>
          <Link href="/forgot-password" className="block text-center text-xs text-red-400 hover:underline">
            {getLocalized({ en: 'Forgot password?', am: 'የይለፍ ቃል ረሱ?', ar: 'نسيت كلمة المرور؟' })}
          </Link>
        </form>
      ) : error ? (
        <p className="text-sm text-red-400 text-center">{error}</p>
      ) : null}
    </AuthShell>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto py-10 text-sm text-neutral-500 text-center">Loading…</div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
