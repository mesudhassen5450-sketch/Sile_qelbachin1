'use client'

import { useEffect, useState } from 'react'
import CategoryPageHero from '@/components/CategoryPageHero'
import { useLanguage } from '@/context/LanguageContext'
import { fetchPublishedArticles, pickCmsLoc, type CmsLoc } from '@/lib/cmsClient'

type CmsArticle = {
  id: string
  title?: CmsLoc
  excerpt?: CmsLoc
  body?: CmsLoc
  section?: string
}

export default function ArticlesPage() {
  const { getLocalized, language } = useLanguage()
  const [items, setItems] = useState<CmsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      const rows = await fetchPublishedArticles<CmsArticle>()
      if (cancelled) return
      const list = (rows || []).filter(r => !r.section || r.section === 'article')
      setItems(list)
      setOpenId(list[0]?.id || null)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <CategoryPageHero
        emoji="📝"
        badge={{
          en: 'Youth & Heart Corner',
          am: 'የወጣቶች እና የልብ ማዕከል',
          ar: 'ركن الشباب والقلب',
        }}
        title={{
          en: 'Heart healing articles',
          am: 'የቀልብ ሕክምና አጫጭር ጽሑፎች',
          ar: 'مقالات شفاء القلب',
        }}
        description={{
          en: 'Short articles on healing the heart — published by the team.',
          am: 'የቀልብ ሕክምና አጫጭር ጽሑፎች።',
          ar: 'مقالات قصيرة في شفاء القلب.',
        }}
      />

      {loading ? (
        <p className="text-sm text-neutral-500 text-center py-8">
          {getLocalized({ en: 'Loading…', am: 'በመጫን…', ar: 'جاري التحميل…' })}
        </p>
      ) : null}

      {!loading && items.length === 0 ? (
        <div className="portfolio-card p-10 text-center space-y-2">
          <p className="font-bold text-neutral-900 dark:text-white">
            {getLocalized({
              en: 'No articles yet',
              am: 'እስካሁን ጽሑፍ የለም',
              ar: 'لا مقالات بعد',
            })}
          </p>
          <p className="text-sm text-neutral-500">
            {getLocalized({
              en: 'New articles appear here when published in Admin.',
              am: 'በአድሚን ሲታተሙ አዲስ ጽሑፎች እዚህ ይታያሉ።',
              ar: 'تظهر المقالات الجديدة هنا عند نشرها من الإدارة.',
            })}
          </p>
        </div>
      ) : null}

      <div className="space-y-4">
        {items.map(article => {
          const open = openId === article.id
          const title = pickCmsLoc(article.title, language)
          const excerpt = pickCmsLoc(article.excerpt, language)
          const body = pickCmsLoc(article.body, language)
          return (
            <article key={article.id} className="portfolio-card overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenId(open ? null : article.id)}
                className="w-full text-left p-6 space-y-2 hover:bg-[#F5F2EA]/60 dark:hover:bg-neutral-800/40 transition"
              >
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">{title}</h2>
                {excerpt ? (
                  <p className="text-sm text-neutral-600 dark:text-neutral-300">{excerpt}</p>
                ) : null}
              </button>
              {open && body ? (
                <div className="px-6 pb-6 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed border-t border-[#E7E2D8] dark:border-neutral-800 pt-4 whitespace-pre-wrap">
                  {body}
                </div>
              ) : null}
            </article>
          )
        })}
      </div>
    </div>
  )
}
