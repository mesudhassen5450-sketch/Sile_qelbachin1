'use client'

import Link from 'next/link'
import { FormEvent, useMemo, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { isValidEmail, mapAuthError } from '@/lib/auth/password'
import { getPasswordResetRedirectUrl, isSupabaseAuthConfigured } from '@/lib/supabase/env'

export default function ForgotPasswordPage() {
  const { getLocalized } = useLanguage()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const configured = useMemo(() => isSupabaseAuthConfigured(), [])

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
    setLoading(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: getPasswordResetRedirectUrl(),
      })
      if (resetError) {
        setError(mapAuthError(resetError.message))
        return
      }
      setSent(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto py-10 px-4">
      <div className="portfolio-card p-8 space-y-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            {getLocalized({ en: 'Forgot password', am: 'የይለፍ ቃል ረሱ', ar: 'نسيت كلمة المرور' })}
          </h1>
          <p className="text-sm text-neutral-500">
            {getLocalized({
              en: 'Enter your email and a reset link will arrive in your inbox.',
              am: 'ኢሜይልዎን ያስገቡ — የማስጀመሪያ አገናኝ ወደ ኢሜይልዎ ይደርሳል።',
              ar: 'أدخل بريدك وسيصلك رابط إعادة التعيين.',
            })}
          </p>
        </div>

        {sent ? (
          <div className="space-y-3 text-sm">
            <p className="text-neutral-700 dark:text-neutral-200">
              {getLocalized({
                en: 'If an account exists for that email, a reset link was sent.',
                am: 'ለዚያ ኢሜይል መለያ ካለ የማስጀመሪያ አገናኝ ተልኳል።',
                ar: 'إذا وُجد حساب لهذا البريد فقد أُرسل رابط إعادة التعيين.',
              })}
            </p>
            <Link href="/login" className="inline-flex text-red-600 font-semibold hover:underline">
              {getLocalized({ en: 'Back to sign in', am: 'ወደ መግቢያ ተመለስ', ar: 'العودة لتسجيل الدخول' })}
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-500">
                {getLocalized({ en: 'Email', am: 'ኢሜይል', ar: 'البريد' })}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full rounded-xl border border-[#E7E2D8] dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-2.5 text-sm"
              />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <button
              type="submit"
              disabled={loading || !configured}
              className="w-full px-4 py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition disabled:opacity-60"
            >
              {loading
                ? getLocalized({ en: 'Sending…', am: 'በመላክ…', ar: 'جاري الإرسال…' })
                : getLocalized({ en: 'Send reset link', am: 'አገናኝ ላክ', ar: 'إرسال الرابط' })}
            </button>
            <Link href="/login" className="block text-center text-sm text-neutral-500 hover:underline">
              {getLocalized({ en: 'Back to sign in', am: 'ወደ መግቢያ ተመለስ', ar: 'العودة لتسجيل الدخول' })}
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}
