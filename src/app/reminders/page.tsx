'use client'

import RemindersFeed from '@/components/RemindersFeed'
import CategoryPageHero from '@/components/CategoryPageHero'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'

export default function RemindersPage() {
  const { getLocalized } = useLanguage()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <CategoryPageHero
        emoji="💭"
        badge={{
          en: 'Educational Archive',
          am: 'ትምህርታዊ ማህደር',
          ar: 'الأرشيف التعليمي',
        }}
        title={{
          en: 'Reminders',
          am: 'ማስታወሻዎች',
          ar: 'تذكيرات',
        }}
        description={{
          en: 'Heart reminders from Admin — also listed under Da’wah and Library.',
          am: 'ከአድሚን የልብ ማስታወሻዎች — በዳዕዋ እና በቤተ-መጻሕፍትም ይታያሉ።',
          ar: 'تذكيرات القلب من الإدارة — تظهر أيضاً في الدعوة والمكتبة.',
        }}
      >
        <div className="flex flex-wrap gap-3 pt-1">
          <Link
            href="/dawah"
            className="text-sm font-bold text-red-600 hover:underline"
          >
            {getLocalized({ en: 'Da’wah →', am: 'ዳዕዋ →', ar: 'الدعوة →' })}
          </Link>
          <Link
            href="/library"
            className="text-sm font-bold text-red-600 hover:underline"
          >
            {getLocalized({ en: 'Library →', am: 'ቤተ-መጻሕፍት →', ar: 'المكتبة →' })}
          </Link>
        </div>
      </CategoryPageHero>

      <RemindersFeed showHeading={false} />
    </div>
  )
}
