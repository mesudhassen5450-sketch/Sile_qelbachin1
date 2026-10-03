'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import { featuredHeartFirst, fetchHeartReadings } from '@/lib/heartReadings'

/**
 * Compact strip under Marriage: 4 article/reminder titles → /articles?id=
 */
export default function HomeReminders() {
  const { getLocalized } = useLanguage()
  const [items, setItems] = useState<Array<{ id: string; title: { en: string; am: string; ar: string } }>>(
    []
  )

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const rows = await fetchHeartReadings()
      if (cancelled) return
      if (!rows.length) {
        setItems([])
        return
      }
      const picked = featuredHeartFirst(rows, 4).map(r => ({
        id: r.id,
        title: {
          en: r.title.en || r.title.am || '',
          am: r.title.am || r.title.en || '',
          ar: r.title.ar || r.title.en || r.title.am || '',
        },
      }))
      setItems(picked)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (!items.length) return null

  return (
    <section
      aria-label="Featured articles and reminders"
      className="rounded-xl border border-red-500/30 bg-gradient-to-r from-red-950/25 via-red-900/10 to-transparent dark:from-red-950/35 px-3 py-2.5 sm:px-4 space-y-1.5"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-red-400">
          {getLocalized({
            en: 'Featured · Articles & reminders',
            am: 'ተለይተው · ጽሑፎች እና ማስታወሻዎች',
            ar: 'مميز · مقالات وتذكيرات',
          })}
        </p>
        <Link
          href="/articles"
          className="text-[10px] font-semibold text-red-400 hover:underline shrink-0"
        >
          {getLocalized({ en: 'All →', am: 'ሁሉም →', ar: 'الكل →' })}
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5">
        {items.map(item => (
          <Link
            key={item.id}
            href={`/articles?id=${encodeURIComponent(item.id)}`}
            className="block rounded-md px-1.5 py-1.5 text-[12.5px] sm:text-[13px] font-semibold leading-snug text-neutral-100 hover:bg-red-500/10 hover:text-red-300 transition line-clamp-1"
          >
            {getLocalized(item.title)}
          </Link>
        ))}
      </div>
    </section>
  )
}
