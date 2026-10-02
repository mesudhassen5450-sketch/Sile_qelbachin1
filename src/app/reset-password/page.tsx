'use client'

import Link from 'next/link'
import { FormEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { mapAuthError, validatePasswordStrength } from '@/lib/auth/password'
import { isSupabaseAuthConfigured } from '@/lib/supabase/env'

export default function ResetPasswordPage() {
  const { getLocalized } = useLanguage()
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const configured = useMemo(() => isSupabaseAuthConfigured(), [])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!configured) {
      setError('Authentication is not configured on this site.')
      return
    }
    if (!user) {
      setError('Open the reset link from your email first.')
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
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        setError(mapAuthError(updateError.message))
        return
      }
      setDone(true)
      setTimeout(() => router.replace('/account'), 1200)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="max-w-md mx-auto py-10 px-4">
        <div className="portfolio-card p-8 text-sm text-neutral-500">Loading…</div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto py-10 px-4">
      <form onSubmit={onSubmit} className="portfolio-card p-8 space-y-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            {getLocalized({ en: 'Set new password', am: 'አዲስ የይለፍ ቃል ያዘጋጁ', ar: 'تعيين كلمة مرور جديدة' })}
          </h1>
          <p className="text-sm text-neutral-500">
            {getLocalized({
              en: 'Choose a strong password for your account.',
              am: 'ለመለያዎ ጠንካራ የይለፍ ቃል ይምረጡ።',
              ar: 'اختر كلمة مرور قوية لحسابك.',
            })}
          </p>
        </div>

        {!user ? (
          <p className="text-sm text-amber-700">
            {getLocalized({
              en: 'No recovery session. Request a new reset link.',
              am: 'የማስጀመሪያ ክፍለ ጊዜ የለም። አዲስ አገናኝ ይጠይቁ።',
              ar: 'لا توجد جلسة استعادة. اطلب رابطًا جديدًا.',
            })}{' '}
            <Link href="/forgot-password" className="text-red-600 font-semibold hover:underline">
              Forgot password
            </Link>
          </p>
        ) : null}

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-neutral-500">
            {getLocalized({ en: 'New password', am: 'አዲስ የይለፍ ቃል', ar: 'كلمة المرور الجديدة' })}
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="new-password"
            className="w-full rounded-xl border border-[#E7E2D8] dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-2.5 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-neutral-500">
            {getLocalized({
              en: 'Confirm new password',
              am: 'አዲስ የይለፍ ቃል አረጋግጥ',
              ar: 'تأكيد كلمة المرور الجديدة',
            })}
          </label>
          <input
            type="password"
            required
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            autoComplete="new-password"
            className="w-full rounded-xl border border-[#E7E2D8] dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-2.5 text-sm"
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {done ? (
          <p className="text-sm text-green-700">
            {getLocalized({
              en: 'Password updated. Redirecting…',
              am: 'የይለፍ ቃል ተዘምኗል። በመቀየር…',
              ar: 'تم تحديث كلمة المرور. جاري التحويل…',
            })}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading || !configured || !user || done}
          className="w-full px-4 py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition disabled:opacity-60"
        >
          {loading
            ? getLocalized({ en: 'Saving…', am: 'በማስቀመጥ…', ar: 'جاري الحفظ…' })
            : getLocalized({ en: 'Update password', am: 'የይለፍ ቃል አዘምን', ar: 'تحديث كلمة المرور' })}
        </button>
      </form>
    </div>
  )
}
