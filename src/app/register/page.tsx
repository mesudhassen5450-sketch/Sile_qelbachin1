'use client'

import Link from 'next/link'
import { FormEvent, Suspense, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AuthShell from '@/components/auth/AuthShell'
import GoogleContinueButton from '@/components/auth/GoogleContinueButton'
import { useLanguage } from '@/context/LanguageContext'
import { isValidEmail, mapAuthError, validatePasswordStrength } from '@/lib/auth/password'
import { safePublicNextPath } from '@/lib/auth/redirect'
import {
  getEmailConfirmRedirectUrl,
  isSupabaseAuthConfigured,
} from '@/lib/supabase/env'

function RegisterForm() {
  const { getLocalized } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = safePublicNextPath(searchParams.get('next'), '/')

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [doneEmail, setDoneEmail] = useState<string | null>(null)
  const [resendMsg, setResendMsg] = useState<string | null>(null)

  const configured = useMemo(() => isSupabaseAuthConfigured(), [])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setResendMsg(null)

    if (!configured) {
      setError('Authentication is not configured on this site.')
      return
    }
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.')
      return
    }
    const strength = validatePasswordStrength(password)
    if (!strength.ok) {
      setError(strength.message || 'Password is too weak.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: getEmailConfirmRedirectUrl(),
          data: {
            display_name: displayName.trim() || undefined,
          },
        },
      })

      if (signUpError) {
        setError(mapAuthError(signUpError.message))
        return
      }

      if (data.session && data.user?.email_confirmed_at) {
        router.replace(next)
        return
      }

      setDoneEmail(email.trim())
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const onResend = async () => {
    if (!doneEmail) return
    setResendMsg(null)
    setLoading(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: doneEmail,
        options: { emailRedirectTo: getEmailConfirmRedirectUrl() },
      })
      if (resendError) {
        setResendMsg(mapAuthError(resendError.message))
      } else {
        setResendMsg('Verification email sent again. Check your inbox.')
      }
    } catch {
      setResendMsg('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (doneEmail) {
    return (
      <div className="portfolio-card p-8 space-y-4 text-center">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          {getLocalized({
            en: 'Check your email',
            am: 'ኢሜይልዎን ይመልከቱ',
            ar: 'تحقق من بريدك',
          })}
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
          {getLocalized({
            en: 'A verification link is on its way to:',
            am: 'የማረጋገጫ አገናኝ በመንገድ ላይ ነው ወደ፦',
            ar: 'رابط التحقق في طريقه إلى:',
          })}
        </p>
        <p className="font-mono text-sm font-semibold text-red-600 break-all">{doneEmail}</p>
        {resendMsg ? <p className="text-sm text-neutral-500">{resendMsg}</p> : null}
        <div className="flex flex-col gap-2 pt-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => void onResend()}
            className="w-full px-4 py-2.5 rounded-xl border border-[#E7E2D8] dark:border-neutral-700 text-sm font-bold hover:bg-[#F5F2EA] dark:hover:bg-neutral-800 transition"
          >
            {getLocalized({ en: 'Resend email', am: 'ኢሜይል እንደገና ላክ', ar: 'إعادة إرسال البريد' })}
          </button>
          <Link
            href={`/login?next=${encodeURIComponent(next)}`}
            className="w-full inline-flex justify-center px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition"
          >
            {getLocalized({ en: 'Back to sign in', am: 'ወደ መግቢያ ተመለስ', ar: 'العودة لتسجيل الدخول' })}
          </Link>
        </div>
      </div>
    )
  }

  const safeNext = next
  const askPath = safeNext.split('?')[0]
  const isAskFlow = askPath === '/ask-question'

  return (
    <AuthShell
      variant={isAskFlow ? 'ask' : 'general'}
      title={getLocalized({
        en: isAskFlow ? 'Join to ask' : 'Sign up',
        am: isAskFlow ? 'ለመጠየቅ ይመዝገቡ' : 'መለያ ፍጠር',
        ar: isAskFlow ? 'انضم لتسأل' : 'إنشاء حساب',
      })}
      subtitle={getLocalized(
        isAskFlow
          ? {
              en: 'Create your place here — then write your question with peace of mind.',
              am: 'ቦታዎን እዚህ ይፍጠሩ — ከዚያ ጥያቄዎን በሰላም ይጻፉ።',
              ar: 'أنشئ مكانك هنا — ثم اكتب سؤالك براحة بال.',
            }
          : {
              en: 'Continue with Google, or create an email account.',
              am: 'በGoogle ይቀጥሉ ወይም በኢሜይል መለያ ይፍጠሩ።',
              ar: 'تابع مع Google أو أنشئ حسابًا بالبريد.',
            }
      )}
      footer={
        <p className="text-center">
          {getLocalized({ en: 'Already have an account?', am: 'መለያ አለዎት?', ar: 'لديك حساب؟' })}{' '}
          <Link href={`/login?next=${encodeURIComponent(safeNext)}`} className="text-red-400 font-semibold hover:underline">
            {getLocalized({ en: 'Log in', am: 'ግባ', ar: 'تسجيل الدخول' })}
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

      <div className="relative flex items-center gap-3 py-1">
        <div className="h-px flex-1 bg-neutral-700" />
        <span className="text-2xs font-semibold uppercase tracking-wider text-neutral-500">
          {getLocalized({ en: 'or email', am: 'ወይም ኢሜይል', ar: 'أو البريد' })}
        </span>
        <div className="h-px flex-1 bg-neutral-700" />
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-neutral-400">
          {getLocalized({
            en: 'Display name (optional)',
            am: 'የሚታይ ስም (አማራጭ)',
            ar: 'الاسم الظاهر (اختياري)',
          })}
        </label>
        <input
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          autoComplete="name"
          className="w-full rounded-xl border border-neutral-700 bg-neutral-900/80 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600/40"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-neutral-400">
          {getLocalized({ en: 'Email address', am: 'ኢሜይል', ar: 'البريد' })} *
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email"
          className="w-full rounded-xl border border-neutral-700 bg-neutral-900/80 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600/40"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-neutral-400">
          {getLocalized({ en: 'Set password', am: 'የይለፍ ቃል', ar: 'كلمة المرور' })} *
        </label>
        <input
          type="password"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="new-password"
          className="w-full rounded-xl border border-neutral-700 bg-neutral-900/80 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600/40"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-neutral-400">
          {getLocalized({
            en: 'Confirm password',
            am: 'የይለፍ ቃል አረጋግጥ',
            ar: 'تأكيد كلمة المرور',
          })}{' '}
          *
        </label>
        <input
          type="password"
          required
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          autoComplete="new-password"
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
          ? getLocalized({ en: 'Creating…', am: 'በመፍጠር…', ar: 'جاري الإنشاء…' })
          : getLocalized({ en: 'Sign up', am: 'መለያ ፍጠር', ar: 'إنشاء حساب' })}
      </button>
      </form>
    </AuthShell>
  )
}

export default function RegisterPage() {
  return (
    <div className="max-w-md mx-auto py-10 px-4">
      <Suspense fallback={<div className="portfolio-card p-8 text-sm text-neutral-500">Loading…</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  )
}
