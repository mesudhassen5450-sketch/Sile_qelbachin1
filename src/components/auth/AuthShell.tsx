'use client'

import Image from 'next/image'
import type { ReactNode } from 'react'
import { siteMetadata } from '@/data/channelData'
import { useLanguage } from '@/context/LanguageContext'

export type AuthShellVariant = 'general' | 'ask'

/**
 * Split-panel auth shell — two friendly modes:
 * - general: welcome / sign in to Sile Qelbachin
 * - ask: sign in so your question answer reaches your email
 */
export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
  variant = 'general',
}: {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  variant?: AuthShellVariant
}) {
  const { getLocalized } = useLanguage()

  const brand =
    variant === 'ask'
      ? {
          headline: getLocalized({
            en: 'Ask with your email — your answer comes soon.',
            am: 'በኢሜይልዎ ጠይቁ — መልስዎ በቅርቡ ይደርስዎታል።',
            ar: 'اسأل ببريدك — وستصلك الإجابة قريباً.',
          }),
          body: getLocalized({
            en: 'Sign in gently, write your question, and the Ustaz reply reaches your inbox. You are among family here.',
            am: 'በሰላም ይግቡ፣ ጥያቄዎን ይጻፉ፤ የኡስታዝ መልስ ወደ ኢሜይልዎ ይደርሳል። እዚህ እንደ ቤተሰብ ነዎት።',
            ar: 'سجّل بهدوء واكتب سؤالك؛ يصل رد الأستاذ إلى بريدك. أنت بين أهل هنا.',
          }),
        }
      : {
          headline: getLocalized({
            en: 'Welcome to Sile Qelbachin!',
            am: 'እንኳን ወደ ስለ ቀልባችን በደህና መጡ!',
            ar: 'أهلاً بك في سله قلباشين!',
          }),
          body: getLocalized({
            en: 'A digital platform for Qur’an, reminders, and your private questions. Sign in easily with your Google account.',
            am: 'ለቁርኣን፣ ለማስታወሻዎች እና ለግል ጥያቄዎችዎ የተዘጋጀ ዲጂታል መድረክ። በGoogle መለያዎ በቀላሉ ይግቡ።',
            ar: 'منصة رقمية للقرآن والتذكير وأسئلتك الخاصة. سجّل بسهولة بحساب Google.',
          }),
        }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-3 py-6 sm:py-12 overflow-x-hidden">
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl sm:rounded-3xl border border-neutral-800 shadow-2xl shadow-black/40 grid md:grid-cols-2 bg-[#0c0c0e]">
        {/* Brand panel — compact on mobile so welcome message is never hidden */}
        <div className="relative flex flex-col justify-between p-5 sm:p-8 lg:p-10 text-white overflow-hidden md:min-h-[420px]">
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at 20% 20%, rgba(220,38,38,0.55), transparent 55%), radial-gradient(ellipse at 80% 80%, rgba(127,29,29,0.7), transparent 50%), linear-gradient(160deg, #1a0505 0%, #0a0a0c 55%, #1f0a0a 100%)',
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />
          <div className="relative z-10 flex items-center gap-3">
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-white/20">
              <Image src="/logo.jpg" alt="" fill sizes="40px" className="object-cover" />
            </div>
            <span className="font-bold tracking-tight text-sm sm:text-base">
              {siteMetadata.channelName}
            </span>
          </div>
          <div className="relative z-10 space-y-2 sm:space-y-3 max-w-sm mt-4 md:mt-0">
            <h2 className="text-xl sm:text-3xl font-bold leading-tight">{brand.headline}</h2>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed line-clamp-3 sm:line-clamp-none">
              {brand.body}
            </p>
          </div>
          <p className="relative z-10 text-2xs text-white/40 mt-3 md:mt-0 hidden sm:block">
            {siteMetadata.telegramHandle}
          </p>
        </div>

        {/* Form panel */}
        <div className="relative bg-[#121214] p-5 sm:p-8 lg:p-10 flex flex-col justify-center space-y-5 sm:space-y-6 border-t md:border-t-0 md:border-s border-neutral-800">
          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {title}
            </h1>
            {subtitle ? <p className="text-sm text-neutral-400">{subtitle}</p> : null}
          </div>
          {children}
          {footer ? <div className="text-sm text-neutral-500 pt-1">{footer}</div> : null}
        </div>
      </div>
    </div>
  )
}
