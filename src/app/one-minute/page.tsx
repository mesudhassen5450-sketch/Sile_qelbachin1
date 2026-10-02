'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import CategoryPageHero from '@/components/CategoryPageHero'
import OneMinuteFeed, { type FeedFilter } from '@/components/OneMinuteFeed'
import { useLanguage } from '@/context/LanguageContext'
import { fetchPublishedOneMinute, type CmsOneMinute } from '@/lib/cmsClient'
import { getLocalOneMinuteSlides } from '@/data/oneMinuteCatalog'

type Slide = CmsOneMinute & { durationSeconds?: number }

export default function OneMinutePage() {
  const { getLocalized } = useLanguage()
  const [filter, setFilter] = useState<FeedFilter>('all')
  const [slides, setSlides] = useState<Slide[]>(() => getLocalOneMinuteSlides())

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const rows = await fetchPublishedOneMinute()
        if (cancelled) return
        if (rows?.length) {
          const sorted = [...rows].sort((a, b) => {
            const pa = (a as { priority?: number | null }).priority
            const pb = (b as { priority?: number | null }).priority
            if (typeof pa === 'number' && typeof pb === 'number' && pa !== pb) return pa - pb
            const fa = (a as { featured?: boolean }).featured ? 1 : 0
            const fb = (b as { featured?: boolean }).featured ? 1 : 0
            if (fa !== fb) return fb - fa
            const soA = (a as { sortOrder?: number | null }).sortOrder
            const soB = (b as { sortOrder?: number | null }).sortOrder
            if (typeof soA === 'number' && typeof soB === 'number' && soA !== soB) {
              return soA - soB
            }
            const ta = Date.parse(a.updatedAt || '') || 0
            const tb = Date.parse(b.updatedAt || '') || 0
            return tb - ta
          })
          setSlides(sorted)
          return
        }
      } catch {
        /* Admin may be offline — keep local catalog */
      }
      if (!cancelled) setSlides(getLocalOneMinuteSlides())
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <CategoryPageHero
        emoji="⏱️"
        badge={{
          en: 'Educational Archive · Youth ideas',
          am: 'ትምህርታዊ ማህደር • የወጣቶች ሀሳብ',
          ar: 'الأرشيف التعليمي · أفكار الشباب',
        }}
        title={{
          en: '1-Minute Message',
          am: 'የ1 ደቂቃ መልእክት',
          ar: 'رسالة دقيقة',
        }}
        description={{
          en: 'Video, audio, and text reminders under 1 minute.',
          am: 'ከ1 ደቂቃ በታች የሆኑ የቪዲዮ፣ የድምፅ እና የጽሑፍ ማስታወሻዎች።',
          ar: 'تذكيرات فيديو وصوت ونص أقل من دقيقة.',
        }}
      />

      {/* Filter tabs live inside OneMinuteFeed — no duplicate count cards above */}
      <OneMinuteFeed slides={slides} filter={filter} onFilterChange={setFilter} />

      <p className="text-center text-sm text-neutral-500 pb-8 space-x-4">
        <Link href="/dawah" className="text-red-600 font-semibold hover:underline">
          {getLocalized({
            en: 'Da’wah (reminders & audio) →',
            am: 'ዳዕዋ (ማስታወሻና ድምጽ) →',
            ar: 'الدعوة (تذكيرات وصوت) →',
          })}
        </Link>
        <Link href="/videos" className="text-red-600 font-semibold hover:underline">
          {getLocalized({
            en: 'All videos →',
            am: 'ሁሉም ቪዲዮዎች →',
            ar: 'كل الفيديوهات →',
          })}
        </Link>
      </p>
    </div>
  )
}
