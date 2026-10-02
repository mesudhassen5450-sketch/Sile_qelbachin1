'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import UserAvatar from '@/components/auth/UserAvatar'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'

export default function AccountPage() {
  const { getLocalized } = useLanguage()
  const { user, profile, emailVerified, loading, signOut, configured, displayName, avatarUrl } =
    useAuth()
  const router = useRouter()

  if (loading) {
    return (
      <div className="max-w-md mx-auto py-10 px-4">
        <div className="portfolio-card p-8 text-sm text-neutral-500">Loading…</div>
      </div>
    )
  }

  if (!configured) {
    return (
      <div className="max-w-md mx-auto py-10 px-4">
        <div className="portfolio-card p-8 space-y-3">
          <h1 className="text-xl font-bold">Account</h1>
          <p className="text-sm text-amber-700">
            Supabase Auth is not configured. Set NEXT_PUBLIC_SUPABASE_URL and
            NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    router.replace('/login?next=/account')
    return null
  }

  const name = displayName || profile?.display_name?.trim() || ''
  const isGoogle = Boolean(
    user.app_metadata?.provider === 'google' ||
      (Array.isArray(user.app_metadata?.providers) &&
        user.app_metadata.providers.includes('google'))
  )

  return (
    <div className="max-w-md mx-auto py-10 px-4">
      <div className="portfolio-card p-8 space-y-6">
        <div className="flex items-start gap-4">
          <UserAvatar
            url={avatarUrl}
            name={name || user.email}
            size={56}
            className="border-2 border-red-600/20"
          />
          <div className="space-y-1 min-w-0">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
              {getLocalized({ en: 'My account', am: 'መለያዬ', ar: 'حسابي' })}
            </h1>
            {name ? (
              <p className="text-base font-semibold text-neutral-800 dark:text-neutral-100 truncate">
                {name}
              </p>
            ) : null}
            <p className="font-mono text-sm text-neutral-700 dark:text-neutral-300 break-all">
              {user.email}
            </p>
            <p
              className={`inline-flex text-xs font-bold px-2.5 py-1 rounded-full ${
                emailVerified
                  ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-900'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900'
              }`}
            >
              {emailVerified
                ? isGoogle
                  ? getLocalized({
                      en: 'Signed in with Google',
                      am: 'በGoogle ገብተዋል',
                      ar: 'مسجّل عبر Google',
                    })
                  : getLocalized({ en: 'Email verified', am: 'ኢሜይል ተረጋግጧል', ar: 'البريد موثّق' })
                : getLocalized({
                    en: 'Email not verified',
                    am: 'ኢሜይል አልተረጋገጠም',
                    ar: 'البريد غير موثّق',
                  })}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {!isGoogle ? (
            <Link
              href="/account/change-password"
              className="w-full inline-flex justify-center px-4 py-2.5 rounded-xl border border-[#E7E2D8] dark:border-neutral-700 text-sm font-bold hover:bg-[#F5F2EA] dark:hover:bg-neutral-800 transition"
            >
              {getLocalized({ en: 'Change password', am: 'የይለፍ ቃል ቀይር', ar: 'تغيير كلمة المرور' })}
            </Link>
          ) : null}
          <Link
            href="/ask-question"
            className="w-full inline-flex justify-center px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition"
          >
            {getLocalized({ en: 'Ask an Ustaz', am: 'ኡስታዝን ጠይቅ', ar: 'اسأل الأستاذ' })}
          </Link>
          <button
            type="button"
            onClick={async () => {
              await signOut()
              router.replace('/')
              router.refresh()
            }}
            className="w-full px-4 py-2.5 rounded-xl text-sm font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            {getLocalized({ en: 'Sign out', am: 'ውጣ', ar: 'تسجيل الخروج' })}
          </button>
        </div>
      </div>
    </div>
  )
}
