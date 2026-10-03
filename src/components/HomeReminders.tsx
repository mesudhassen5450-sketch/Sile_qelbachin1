'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import { fetchPublishedReminders, type CmsLoc, type CmsReminder } from '@/lib/cmsClient'

function asLoc(v?: CmsLoc | null): { en: string; am: string; ar: string } {
  return {
    en: v?.en || v?.am || '',
    am: v?.am || v?.en || '',
    ar: v?.ar || v?.en || v?.am || '',
  }
}

function featuredFirst(rows: CmsReminder[], limit: number): CmsReminder[] {
  const scored = [...rows].sort((a, b) => {
    const fa = a.featured ? 1 : 0
    const fb = b.featured ? 1 : 0
    if (fa !== fb) return fb - fa
    const pa = typeof a.priority === 'number' && a.priority >= 1 ? a.priority : 9999
    const pb = typeof b.priority === 'number' && b.priority >= 1 ? b.priority : 9999
    if (pa !== pb) return pa - pb
    return 0
  })
  const featured = scored.filter(r => r.featured)
  if (featured.length >= limit) return featured.slice(0, limit)
  return scored.slice(0, limit)
}

/** Compact home strip: up to 4 reminder titles only → /articles?id= */
export default function HomeReminders() {
  const { getLocalized } = useLanguage()
  const [items, setItems] = useState<Array<{ id: string; title: { en: string; am: string; ar: string } }>>(
    []
  )

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const rows = await fetchPublishedReminders()
      if (cancelled || !rows?.length) return
      const picked = featuredFirst(rows, 4)
        .map(r => {
          const title = asLoc(r.title)
          if (!title.en && !title.am) return null
          return { id: r.id, title }
        })
        .filter((x): x is { id: string; title: { en: string; am: string; ar: string } } => Boolean(x))
      setItems(picked)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (!items.length) return null

  return (
    <section className="rounded-xl border border-neutral-200/80 dark:border-neutral-800 px-3 py-2.5 sm:px-4 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-red-600">
          {getLocalized({
            en: 'Reminders',
            am: 'ማስታወሻዎች',
            ar: 'تذكيرات',
          })}
        </p>
        <Link
          href="/articles"
          className="text-[11px] font-semibold text-red-600 hover:underline shrink-0"
        >
          {getLocalized({ en: 'All →', am: 'ሁሉም →', ar: 'الكل →' })}
        </Link>
      </div>
      <ul className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
        {items.map(item => (
          <li key={item.id}>
            <Link
              href={`/articles?id=${encodeURIComponent(item.id)}`}
              className="block py-1.5 text-[13px] font-medium leading-snug text-neutral-800 dark:text-neutral-200 hover:text-red-600 dark:hover:text-red-400 transition line-clamp-1"
            >
              {getLocalized(item.title)}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
