'use client'

import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import { SITELINK_PAGES, getSitePageCopy } from '@/lib/seo'

/**
 * Organized hub links (Netlify-style sitelink structure on-page).
 * Helps users + signals clear section URLs for Google sitelinks.
 */
export default function HomeSitelinks() {
  const { language } = useLanguage()

  return (
    <section
      className="mt-10 sm:mt-14 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-gradient-to-br from-neutral-50 to-white dark:from-neutral-950 dark:to-neutral-900 p-5 sm:p-7"
      aria-labelledby="home-sitelinks-heading"
    >
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-5">
        <div>
          <h2
            id="home-sitelinks-heading"
            className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white"
          >
            {language === 'am'
              ? 'ዋና ክፍሎች'
              : language === 'ar'
                ? 'الأقسام الرئيسية'
                : 'Explore Sile Qelbachin'}
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-xl">
            {language === 'am'
              ? 'ቁርኣን፣ ዳዕዋ፣ ቤተ-መጻሕፍት እና ጥያቄ — ሁሉም በአንድ ቦታ።'
              : language === 'ar'
                ? 'قرآن، دعوة، مكتبة واسأل — في مكان واحد.'
                : 'Qur’an, da’wah, library, and ask a question — organized like a professional site map.'}
          </p>
        </div>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {SITELINK_PAGES.map((page) => {
          const copy = getSitePageCopy(page, language)
          return (
            <li key={page.path}>
              <Link
                href={page.path}
                className="group flex items-start justify-between gap-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-950/60 px-4 py-3.5 hover:border-[#A91F24]/50 hover:shadow-sm transition"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-[#A91F24] transition">
                    {copy.name}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400 line-clamp-2">
                    {copy.description}
                  </p>
                </div>
                <span
                  className="shrink-0 text-[#A91F24] text-base leading-none mt-0.5 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition"
                  aria-hidden
                >
                  ↗
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
