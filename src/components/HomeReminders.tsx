'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'
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

/**
 * Home: up to 4 featured reminder titles only (no body).
 * Tap → /articles?id=… (same content as Da’wah / Library reminders for now).
 */
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
    <section className="portfolio-card p-6 sm:p-8 space-y-5 border-red-200/40 dark:border-red-900/30">
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-2 text-red-600 text-xs font-bold uppercase tracking-wider">
          <BookOpen className="w-4 h-4" />
          {getLocalized({
            en: 'Heart reminders',
            am: 'የልብ ማስታወሻዎች',
            ar: 'تذكيرات القلب',
          })}
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#111827] dark:text-white">
          {getLocalized({
            en: 'Read this week',
            am: 'በዚህ ሳምንት ያንብቡ',
            ar: 'اقرأ هذا الأسبوع',
          })}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map(item => (
          <Link
            key={item.id}
            href={`/articles?id=${encodeURIComponent(item.id)}`}
            className="group flex items-start gap-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-950/50 px-4 py-3.5 hover:border-red-500/60 hover:bg-red-50/60 dark:hover:bg-red-950/30 hover:ring-2 hover:ring-red-500/20 transition"
          >
            <span className="mt-0.5 text-red-600 font-bold text-sm shrink-0">◆</span>
            <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 group-hover:text-red-700 dark:group-hover:text-red-400 transition leading-snug line-clamp-3">
              {getLocalized(item.title)}
            </span>
          </Link>
        ))}
      </div>

      <Link
        href="/articles"
        className="inline-flex items-center text-sm font-bold text-red-600 hover:underline"
      >
        {getLocalized({
          en: 'All articles & reminders →',
          am: 'ሁሉም ጽሑፎች እና ማስታወሻዎች →',
          ar: 'كل المقالات والتذكيرات →',
        })}
      </Link>
    </section>
  )
}
