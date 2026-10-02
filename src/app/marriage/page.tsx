'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import CategoryPageHero from '@/components/CategoryPageHero'
import { useLanguage } from '@/context/LanguageContext'
import { type MarriageTopic } from '@/data/youthCorner'
import { fetchPublishedMarriage, pickCmsLoc, type CmsLoc } from '@/lib/cmsClient'

type CmsMarriage = {
  id: string
  slug?: string
  title?: CmsLoc
  excerpt?: CmsLoc
  body?: CmsLoc
  featured?: boolean
}

export default function MarriagePage() {
  const { getLocalized } = useLanguage()
  const [topics, setTopics] = useState<MarriageTopic[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      const rows = await fetchPublishedMarriage<CmsMarriage>()
      if (cancelled) return
      setTopics(
        (rows || []).map(r => ({
          id: r.id,
          title: {
            en: r.title?.en || '',
            am: r.title?.am || r.title?.en || '',
            ar: r.title?.ar || r.title?.en || '',
          },
          summary: {
            en: r.excerpt?.en || pickCmsLoc(r.body, 'en').slice(0, 180),
            am: r.excerpt?.am || r.excerpt?.en || '',
            ar: r.excerpt?.ar || r.excerpt?.en || '',
          },
          href: '/ask-question',
        }))
      )
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <CategoryPageHero
        emoji="💍"
        badge={{
          en: 'Youth & Heart Corner',
          am: 'የወጣቶች እና የልብ ማዕከል',
          ar: 'ركن الشباب والقلب',
        }}
        title={{
          en: 'Marriage & Love',
          am: 'ጋብቻ እና ፍቅር',
          ar: 'الزواج والحب',
        }}
        description={{
          en: 'Marriage guidance, choosing a spouse rightly, and a love life rooted in Islamic teaching.',
          am: 'የጋብቻ መመሪያዎች፣ ትክክለኛ የአጋር መረጣ እና በእስልምና አስተምህሮ ላይ የተመሠረተ የፍቅር ሕይወት።',
          ar: 'إرشاد الزواج، حسن اختيار الشريك، وحياة حب مبنية على تعاليم الإسلام.',
        }}
      />

      {loading ? (
        <p className="text-sm text-neutral-500 text-center py-8">
          {getLocalized({ en: 'Loading…', am: 'በመጫን…', ar: 'جاري التحميل…' })}
        </p>
      ) : null}

      {!loading && topics.length === 0 ? (
        <div className="portfolio-card p-10 text-center space-y-3">
          <p className="font-bold text-neutral-900 dark:text-white">
            {getLocalized({
              en: 'No marriage topics yet',
              am: 'እስካሁን የጋብቻ ርዕስ የለም',
              ar: 'لا موضوعات زواج بعد',
            })}
          </p>
          <p className="text-sm text-neutral-500 max-w-md mx-auto">
            {getLocalized({
              en: 'When the team prepares real guidance in Admin, it appears here.',
              am: 'ቡድኑ በአድሚን እውነተኛ መመሪያ ሲያዘጋጅ እዚህ ይታያል።',
              ar: 'عندما يعدّ الفريق إرشاداً حقيقياً من الإدارة يظهر هنا.',
            })}
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {topics.map(topic => (
          <Link
            key={topic.id}
            href={topic.href || '/ask-question'}
            className="portfolio-card p-6 space-y-3 hover:border-red-600/40 transition"
          >
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
              {getLocalized(topic.title)}
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
              {getLocalized(topic.summary)}
            </p>
            <span className="text-xs font-semibold text-red-600">
              {getLocalized({ en: 'Explore →', am: 'ይመልከቱ →', ar: 'استكشف →' })}
            </span>
          </Link>
        ))}
      </div>

      <div className="portfolio-card p-6 sm:p-8 space-y-3 bg-[#F5F2EA]/80 dark:bg-red-950/20 border-[#E7E2D8] dark:border-red-900/40">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
          {getLocalized({
            en: 'Need personal guidance?',
            am: 'የግል መመሪያ ይፈልጋሉ?',
            ar: 'تحتاج إرشاداً شخصياً؟',
          })}
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-300 max-w-2xl">
          {getLocalized({
            en: 'Send a respectful question about marriage or relationships.',
            am: 'ስለ ጋብቻ ወይም ግንኙነት በአክብሮት ጥያቄ ይላኩ።',
            ar: 'أرسل سؤالاً محترماً عن الزواج أو العلاقات.',
          })}
        </p>
        <Link
          href="/ask-question"
          className="inline-flex px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition"
        >
          {getLocalized({ en: 'Ask about marriage', am: 'ስለ ጋብቻ ጠይቅ', ar: 'اسأل عن الزواج' })}
        </Link>
      </div>
    </div>
  )
}
