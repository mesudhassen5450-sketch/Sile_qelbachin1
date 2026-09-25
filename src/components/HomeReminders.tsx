'use client'

import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'

import { useLanguage } from '@/context/LanguageContext'

type ReminderItem = {
  id: string
  title: { am?: string | null; ar?: string | null; en?: string | null }
  description: { am?: string | null; ar?: string | null; en?: string | null }
}

const CMS_BASE = (process.env.NEXT_PUBLIC_CMS_API_BASE || '').replace(/\/+$/, '')

function pick(
  loc: { am?: string | null; ar?: string | null; en?: string | null } | undefined,
  language: string
): string {
  if (!loc) return ''
  if (language === 'am') return loc.am || loc.en || loc.ar || ''
  if (language === 'ar') return loc.ar || loc.en || loc.am || ''
  return loc.en || loc.am || loc.ar || ''
}

/** Home-page reminders from Admin (under About Our Hearts). */
export default function HomeReminders() {
  const { language } = useLanguage()
  const [items, setItems] = useState<ReminderItem[]>([])

  useEffect(() => {
    if (!CMS_BASE) return
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch(`${CMS_BASE}/reminders`, { cache: 'no-store' })
        const data = await res.json()
        if (!cancelled && res.ok && data.ok && Array.isArray(data.data)) {
          setItems(data.data)
        }
      } catch {
        // keep empty
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (!items.length) return null

  return (
    <section className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center gap-2 text-red-600 font-semibold text-xs tracking-wider uppercase">
        <Bell className="w-4 h-4" />
        <span>{language === 'am' ? 'ማስታወሻ' : language === 'ar' ? 'تذكير' : 'Reminder'}</span>
      </div>
      <div className="space-y-3">
        {items.map(item => {
          const title = pick(item.title, language)
          const description = pick(item.description, language)
          if (!title && !description) return null
          return (
            <div
              key={item.id}
              className="portfolio-card p-6 md:p-8 space-y-2 border-l-4 border-l-red-600"
            >
              {title ? (
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">{title}</h3>
              ) : null}
              {description ? (
                <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed text-base whitespace-pre-line">
                  {description}
                </p>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}
