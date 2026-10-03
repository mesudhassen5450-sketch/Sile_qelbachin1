'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { featuredHeartFirst, fetchHeartReadings } from '@/lib/heartReadings'

type HomeItem = {
  id: string
  title: { en: string; am: string; ar: string }
  featured?: boolean
  priority?: number
}

const TITLE_SHORT = 48

/**
 * Home strip under Marriage — clear button cards (light + dark), Featured accent,
 * left/right scroll, Show more → /articles?id=
 */
export default function HomeReminders() {
  const { getLocalized } = useLanguage()
  const [items, setItems] = useState<HomeItem[]>([])
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const stripRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const rows = await fetchHeartReadings()
      if (cancelled) return
      if (!rows.length) {
        setItems([])
        return
      }
      const picked = featuredHeartFirst(rows, Math.max(8, rows.length)).map(r => ({
        id: r.id,
        title: {
          en: r.title.en || r.title.am || '',
          am: r.title.am || r.title.en || '',
          ar: r.title.ar || r.title.en || r.title.am || '',
        },
        featured: Boolean(r.featured),
        priority: r.priority,
      }))
      setItems(picked)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const scrollStrip = (dir: -1 | 1) => {
    const el = stripRef.current
    if (!el) return
    el.scrollBy({ left: dir * Math.min(280, el.clientWidth * 0.75), behavior: 'smooth' })
  }

  if (!items.length) return null

  return (
    <section
      aria-label="Featured articles and reminders"
      className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] overflow-hidden"
    >
      <div className="flex items-center justify-between gap-3 px-3 sm:px-4 pt-3 pb-2 border-b border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/90 dark:bg-neutral-900/60">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#A91F24] dark:text-amber-400">
            {getLocalized({
              en: 'Featured · Articles & reminders',
              am: 'ተለይተው · ጽሑፎች እና ማስታወሻዎች',
              ar: 'مميز · مقالات وتذكيرات',
            })}
          </p>
          <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5">
            {getLocalized({
              en: 'Tap a button to open and read.',
              am: 'ለማንበብ አንዱን ቁልፍ ይንኩ።',
              ar: 'اضغط زرًا لفتح القراءة.',
            })}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => scrollStrip(-1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 hover:border-[#A91F24] hover:text-[#A91F24] dark:hover:border-amber-400 dark:hover:text-amber-400 transition shadow-sm"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollStrip(1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 hover:border-[#A91F24] hover:text-[#A91F24] dark:hover:border-amber-400 dark:hover:text-amber-400 transition shadow-sm"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <Link
            href="/articles"
            className="ms-1 hidden sm:inline text-[11px] font-bold text-[#A91F24] dark:text-red-400 hover:underline"
          >
            {getLocalized({ en: 'All →', am: 'ሁሉም →', ar: 'الكل →' })}
          </Link>
        </div>
      </div>

      <div
        ref={stripRef}
        className="flex gap-3 overflow-x-auto scroll-smooth px-3 sm:px-4 py-3.5 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map(item => {
          const full = getLocalized(item.title)
          const isLong = full.length > TITLE_SHORT
          const open = Boolean(expanded[item.id])
          const shown = !isLong || open ? full : `${full.slice(0, TITLE_SHORT).trimEnd()}…`
          const featured = Boolean(item.featured)
          const href = `/articles?id=${encodeURIComponent(item.id)}`

          return (
            <div
              key={item.id}
              className={`snap-start shrink-0 w-[min(78vw,17rem)] sm:w-[16rem] flex flex-col rounded-xl border-2 p-3 shadow-sm transition ${
                featured
                  ? 'border-amber-500 bg-amber-50 dark:border-amber-500/70 dark:bg-amber-950/40'
                  : 'border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900/80 hover:border-[#A91F24]/50'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-2">
                {featured ? (
                  <span className="inline-flex items-center rounded-md bg-amber-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                    {getLocalized({ en: 'Featured', am: 'ተለይቶ', ar: 'مميز' })}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-md bg-[#7f1d1d] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                    {getLocalized({ en: 'Article', am: 'ጽሑፍ', ar: 'مقال' })}
                  </span>
                )}
                {typeof item.priority === 'number' && item.priority >= 1 ? (
                  <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
                    P{item.priority}
                  </span>
                ) : null}
              </div>

              <p
                className={`text-[13.5px] font-bold leading-snug min-h-[2.6em] ${
                  featured
                    ? 'text-amber-950 dark:text-amber-50'
                    : 'text-neutral-900 dark:text-white'
                }`}
              >
                {shown}
              </p>

              {isLong ? (
                <button
                  type="button"
                  onClick={() => setExpanded(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                  className="mt-1 self-start text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 hover:underline"
                >
                  {open
                    ? getLocalized({ en: 'Show less', am: 'አሳንስ', ar: 'أقل' })
                    : getLocalized({ en: 'Show more', am: 'ተጨማሪ', ar: 'المزيد' })}
                </button>
              ) : null}

              <Link
                href={href}
                className={`mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-[12.5px] font-bold text-white shadow-sm transition active:scale-[0.98] ${
                  featured
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : 'bg-[#A91F24] hover:bg-red-700'
                }`}
              >
                {getLocalized({
                  en: 'Open article',
                  am: 'ጽሑፍ ክፈት',
                  ar: 'افتح المقال',
                })}
                <ArrowRight className="w-3.5 h-3.5" aria-hidden />
              </Link>
            </div>
          )
        })}
      </div>
    </section>
  )
}
