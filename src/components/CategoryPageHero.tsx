'use client'

import type { ReactNode } from 'react'
import { useLanguage } from '@/context/LanguageContext'

type Loc = { en: string; am: string; ar: string }

type CategoryPageHeroProps = {
  emoji: string
  badge: Loc
  title: Loc
  description?: Loc
  children?: ReactNode
  showAskCta?: boolean
}

export default function CategoryPageHero({
  emoji,
  badge,
  title,
  description,
  children,
}: CategoryPageHeroProps) {
  const { getLocalized } = useLanguage()
  const loc = (v: Loc) => getLocalized(v) || v.en

  return (
    <div className="portfolio-card p-6 sm:p-10 space-y-4 text-center sm:text-left">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 text-rose-500 text-xs font-bold border border-rose-500/30">
        <span aria-hidden>{emoji}</span>
        <span>{loc(badge)}</span>
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white leading-tight">
        {loc(title)}
      </h1>
      {description ? (
        <p className="text-base text-neutral-600 dark:text-neutral-300 max-w-3xl leading-relaxed">
          {loc(description)}
        </p>
      ) : null}
      {children}
    </div>
  )
}
