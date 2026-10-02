'use client'

import Link from 'next/link'
import { ChevronRight, Sparkles } from 'lucide-react'
import HeroCardMedia from '@/components/HeroCardMedia'
import { kitabsData, siteMetadata } from '@/data/channelData'
import { useLanguage } from '@/context/LanguageContext'

/**
 * Shared home hero — desktop layout unchanged (lg+).
 * Light: portfolio daylight (soft grid inherits from body). Night unchanged.
 * One primary CTA (archive); Ask a Question stays in the navbar only.
 */
export default function HomeHero() {
  const { t, getLocalized, language } = useLanguage()
  const kitabCount = kitabsData.length

  const quickLinks = [
    { href: '/kitab', en: 'Kitabs', am: 'ክታቦች', ar: 'كتب' },
    { href: '/dawah', en: 'Audio', am: 'ድምጽ', ar: 'صوت' },
    { href: '/videos', en: 'Video', am: 'ቪዲዮ', ar: 'فيديو' },
    { href: '/marriage', en: 'Youth & Heart', am: 'ወጣትና ልብ', ar: 'الشباب' },
  ]

  const categoryClass =
    'rounded-full px-3.5 py-1.5 text-xs font-semibold border border-[#e5e7eb] dark:border-neutral-700 bg-white/80 dark:bg-neutral-900/80 text-[#4b5563] dark:text-neutral-300 transition-all duration-200 hover:bg-[#A91F24]/10 hover:border-[#A91F24]/35 hover:text-[#A91F24] hover:font-bold dark:hover:bg-red-600/15 dark:hover:border-red-500/40 dark:hover:text-red-400'

  return (
    <section className="w-screen max-w-[100vw] relative left-1/2 -translate-x-1/2 -mt-4 sm:-mt-6 mb-3 sm:mb-4 overflow-hidden bg-[#f8f9fb]/90 dark:bg-neutral-950 border-b border-[#e5e7eb] dark:border-neutral-800">
      <div
        className="pointer-events-none absolute inset-0 opacity-50 dark:opacity-30"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 100% 0%, rgba(169,31,36,0.04), transparent 55%), radial-gradient(ellipse 70% 50% at 0% 100%, rgba(59,130,246,0.03), transparent 50%)',
        }}
      />
      <div className="absolute inset-0 -z-10 hidden dark:flex items-center justify-center opacity-25">
        <div className="relative w-[70%] max-w-3xl h-full mx-auto bg-gradient-to-r from-neutral-950 via-transparent to-red-950/40" />
      </div>

      <div className="relative z-10 max-w-[72rem] mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-12 lg:py-20 flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-10 lg:gap-14">
        <div className="w-full lg:w-7/12 space-y-5 sm:space-y-6 lg:space-y-7 text-start min-w-0">
          <div className="space-y-2.5 sm:space-y-4">
            <div className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white dark:bg-neutral-900 border border-[#e5e7eb] dark:border-neutral-700 text-[#A91F24] dark:text-red-400 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:shadow-none">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>{t('hero.badge')}</span>
            </div>
            <h1 className="text-[1.75rem] leading-tight sm:text-4xl sm:text-5xl lg:text-[3.25rem] font-bold text-[#111827] dark:text-white tracking-tight sm:leading-[1.12]">
              {siteMetadata.channelName}
              <span className="block text-sm sm:text-lg sm:text-xl font-semibold font-mono text-[#6b7280] dark:text-red-400 mt-1 sm:mt-2">
                {siteMetadata.telegramHandle}
              </span>
            </h1>
          </div>

          <div className="portfolio-card p-3.5 sm:p-5 sm:p-7 space-y-2 sm:space-y-3 border-s-4 border-s-[#A91F24] dark:border-s-red-600 bg-white/90 dark:bg-transparent">
            <p
              className={`text-sm sm:text-lg sm:text-xl font-semibold leading-relaxed text-[#111827] dark:text-neutral-100 line-clamp-5 sm:line-clamp-none ${
                language === 'ar' ? 'arabic-text' : ''
              }`}
            >
              {getLocalized(siteMetadata.heroHadithText)}
            </p>
            <p className="text-[11px] sm:text-xs sm:text-sm font-bold text-[#A91F24] dark:text-red-400 text-end">
              {getLocalized(siteMetadata.heroHadithSource)}
            </p>
          </div>

          {/* Primary action + category shortcuts — one band, no duplicate Ask CTA */}
          <div className="space-y-3 sm:space-y-3.5">
            <Link
              href="#archive"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl bg-[#111827] hover:bg-[#030712] dark:bg-red-600 dark:hover:bg-red-700 text-white font-bold text-sm shadow-[0_2px_8px_rgba(15,23,42,0.14)] dark:shadow-xl hover:-translate-y-0.5 transition"
            >
              {getLocalized({
                en: 'Explore the archive',
                am: 'ማህደሩን ያሰሱ',
                ar: 'استكشف الأرشيف',
              })}
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </Link>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2">
              {quickLinks.map(pill => (
                <Link key={pill.href} href={pill.href} className={`text-center ${categoryClass}`}>
                  {getLocalized({ en: pill.en, am: pill.am, ar: pill.ar })}
                </Link>
              ))}
            </div>
          </div>

          <p className="text-xs sm:text-sm text-[#6b7280] dark:text-neutral-500 font-medium tracking-wide">
            <span className="text-[#111827] dark:text-neutral-200 font-bold tabular-nums">
              {kitabCount}+
            </span>{' '}
            {getLocalized({ en: 'kitab collections', am: 'የክታብ ስብስቦች', ar: 'مجموعات كتب' })}
            <span className="mx-2 text-[#d1d5db] dark:text-neutral-700" aria-hidden>
              ·
            </span>
            <span className="text-[#111827] dark:text-neutral-200 font-bold tabular-nums">3</span>{' '}
            {getLocalized({ en: 'languages', am: 'ቋንቋዎች', ar: 'لغات' })}
          </p>
        </div>

        <div className="w-full lg:w-5/12 min-w-0">
          <HeroCardMedia />
        </div>
      </div>
    </section>
  )
}
