'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { mapAuthError, validatePasswordStrength } from '@/lib/auth/password'

export default function ChangePasswordPage() {
  const { getLocalized } = useLanguage()
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  if (authLoading) {
    return (
      <div className="max-w-md mx-auto py-10 px-4">
        <div className="portfolio-card p-8 text-sm text-neutral-500">Loading…</div>
      </div>
    )
  }

  if (!user) {
    router.replace('/login?next=/account/change-password')
    return null
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
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
      setSuccess('Password updated successfully.')
      setPassword('')
      setConfirm('')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto py-10 px-4">
      <form onSubmit={onSubmit} className="portfolio-card p-8 space-y-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            {getLocalized({ en: 'Change password', am: 'የይለፍ ቃል ቀይር', ar: 'تغيير كلمة المرور' })}
          </h1>
          <p className="text-sm text-neutral-500 break-all">{user.email}</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-neutral-500">
            {getLocalized({ en: 'New password', am: 'አዲس የይለፍ ቃል', ar: 'كلمة المرور الجديدة' })}
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
        {success ? <p className="text-sm text-green-700">{success}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition disabled:opacity-60"
        >
          {loading
            ? getLocalized({ en: 'Saving…', am: 'በማስቀመጥ…', ar: 'جاري الحفظ…' })
            : getLocalized({ en: 'Update password', am: 'የይለፍ ቃል አዘምን', ar: 'تحديث كلمة المرور' })}
        </button>

        <Link href="/account" className="block text-center text-sm text-neutral-500 hover:underline">
          {getLocalized({ en: 'Back to account', am: 'ወደ መለያ ተመለስ', ar: 'العودة للحساب' })}
        </Link>
      </form>
    </div>
  )
}
