'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { fetchHeartReadings, type HeartReading } from '@/lib/heartReadings'

const PREVIEW_MAX = 160

function truncate(s: string, max = PREVIEW_MAX): string {
  const t = s.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  return `${t.slice(0, max).replace(/\s+\S*$/, '').trimEnd()}…`
}

type Props = {
  showHeading?: boolean
}

/** Da’wah / Library reminders — for now same as Admin Youth → Articles. */
export default function RemindersFeed({ showHeading = true }: Props) {
  const { getLocalized } = useLanguage()
  const [items, setItems] = useState<HeartReading[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      const rows = await fetchHeartReadings()
      if (!cancelled) {
        setItems(rows)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const active = activeId ? items.find(i => i.id === activeId) : null

  useEffect(() => {
    if (!activeId) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeId])

  const titleOf = (r: HeartReading) =>
    getLocalized({
      en: r.title?.en || r.title?.am || '',
      am: r.title?.am || r.title?.en || '',
      ar: r.title?.ar || r.title?.en || r.title?.am || '',
    })
  const bodyOf = (r: HeartReading) =>
    getLocalized({
      en: r.body?.en || r.body?.am || '',
      am: r.body?.am || r.body?.en || '',
      ar: r.body?.ar || r.body?.en || r.body?.am || '',
    })

  return (
    <div className="space-y-5">
      {showHeading ? (
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
            {getLocalized({
              en: 'Heart reminders',
              am: 'የልብ ማስታወሻዎች',
              ar: 'تذكيرات القلب',
            })}
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            {getLocalized({
              en: 'Short reflections to soften the heart — tap a card to read the full text.',
              am: 'ልብን የሚያለስልሱ አጫጭር ማስታወሻዎች — ሙሉ ጽሑፍ ለማንበብ ካርዱን ይንኩ።',
              ar: 'تأملات قصيرة لترقيق القلب — المس البطاقة لقراءة النص كاملاً.',
            })}
          </p>
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-neutral-500 text-center py-8">
          {getLocalized({ en: 'Loading…', am: 'በመጫን ላይ…', ar: 'جاري التحميل…' })}
        </p>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {items.map(r => {
          const title = titleOf(r)
          const body = bodyOf(r)
          if (!title && !body) return null
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => setActiveId(r.id)}
              className="portfolio-card p-5 sm:p-6 space-y-2.5 text-start hover:border-red-500/40 hover:ring-2 hover:ring-red-500/20 transition w-full"
            >
              <span className="inline-flex items-center rounded-full bg-[#7f1d1d] text-white text-[10px] font-semibold tracking-wide px-2.5 py-1 border border-[#A91F24]/50">
                {getLocalized({ en: 'Reminder', am: 'ማስታወሻ', ar: 'تذكير' })}
              </span>
              {title ? (
                <h3 className="font-semibold text-neutral-900 dark:text-white text-base sm:text-lg leading-snug line-clamp-2">
                  {title}
                </h3>
              ) : null}
              {body ? (
                <p className="text-sm text-[#9CA3AF] leading-relaxed line-clamp-4 whitespace-pre-line">
                  {truncate(body)}
                </p>
              ) : null}
              <p className="text-xs font-semibold text-[#A91F24] pt-1">
                {getLocalized({
                  en: 'Read full reminder →',
                  am: 'ሙሉ ማስታወሻ አንብብ →',
                  ar: 'اقرأ التذكير كاملاً ←',
                })}
              </p>
            </button>
          )
        })}
      </div>

      {active ? (
        <div
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          onClick={() => setActiveId(null)}
        >
          <div
            className="relative w-full sm:max-w-2xl max-h-[92dvh] sm:max-h-[88vh] flex flex-col rounded-t-2xl sm:rounded-2xl border border-[#e3e2e0] dark:border-neutral-700 bg-white dark:bg-neutral-950 shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#e3e2e0] dark:border-neutral-800 bg-white/95 dark:bg-neutral-950/95 px-4 py-3 backdrop-blur shrink-0">
              <span className="inline-flex items-center rounded-full bg-[#7f1d1d] text-white text-[10px] font-semibold px-2.5 py-1">
                {getLocalized({ en: 'Reminder', am: 'ማስታወሻ', ar: 'تذكير' })}
              </span>
              <button
                type="button"
                onClick={() => setActiveId(null)}
                className="rounded-xl p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto overscroll-contain px-4 sm:px-6 py-5 space-y-4 flex-1 min-h-0">
              <h2 className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-white leading-snug">
                {titleOf(active)}
              </h2>
              <p className="text-base text-neutral-700 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap pb-8">
                {bodyOf(active)}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
