'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { BookMarked, Download, ExternalLink, FileText, NotebookPen, Share2 } from 'lucide-react'
import CategoryPageHero from '@/components/CategoryPageHero'
import KitabCard from '@/components/KitabCard'
import RemindersFeed from '@/components/RemindersFeed'
import SectionHeading from '@/components/SectionHeading'
import ShareSheet from '@/components/ShareSheet'
import { useLanguage } from '@/context/LanguageContext'
import { kitabsData, type Kitab } from '@/data/channelData'
import { getPdfs, type MediaItem } from '@/data/mediaStore'
import {
  fetchPublishedKitabs,
  fetchPublishedPdfs,
  pickCmsLoc,
  type CmsKitab,
  type CmsPdf,
} from '@/lib/cmsClient'

type Tab = 'kitab' | 'pdf' | 'notes'

type PdfCard = {
  id: string
  title: { am: string; en: string; ar: string }
  fileUrl: string
  source: 'archive' | 'cms' | 'kitab'
  meta?: string
}

function cmsToKitab(k: CmsKitab): Kitab {
  const loc = (v?: { am?: string | null; ar?: string | null; en?: string | null }) => ({
    am: v?.am || '',
    ar: v?.ar || '',
    en: v?.en || '',
  })
  return {
    slug: k.slug,
    title: loc(k.title),
    author: loc(k.author),
    category: { am: '', ar: '', en: '' },
    coverImage: k.coverImage || undefined,
    pdfUrl: k.pdfUrl || undefined,
    dersCount: k.dersCount ?? (k.dersList?.length || 0),
    description: loc(k.description),
    dersList: (k.dersList || []).map(d => ({
      id: d.id,
      title: loc(d.title),
      speaker: loc(d.speaker),
      duration: d.duration || '',
      audioUrl: d.audioUrl || '',
      kitabId: k.slug,
    })),
  }
}

export default function LibraryPage() {
  const { getLocalized, language } = useLanguage()
  const [tab, setTab] = useState<Tab>('kitab')
  const [kitabs, setKitabs] = useState<Kitab[]>(kitabsData)
  const [pdfs, setPdfs] = useState<CmsPdf[]>([])
  const [shareTarget, setShareTarget] = useState<{ title: string; url: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const [k, p] = await Promise.all([fetchPublishedKitabs(), fetchPublishedPdfs()])
      if (cancelled) return
      if (k?.length) setKitabs(k.map(cmsToKitab))
      if (p?.length) setPdfs(p)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const pdfFromKitabs = useMemo(
    () => kitabs.filter(k => Boolean(k.pdfUrl)),
    [kitabs]
  )

  const archivePdfs = useMemo((): PdfCard[] => {
    return getPdfs().map((p: MediaItem) => ({
      id: `archive-${p.id}`,
      title: p.title,
      fileUrl: p.fileUrl,
      source: 'archive' as const,
      meta: p.date?.match(/^(\d{2}\.\d{2}\.\d{4})/)?.[1] || p.monthYear || undefined,
    }))
  }, [])

  const allPdfs = useMemo(() => {
    const byUrl = new Map<string, PdfCard>()

    archivePdfs.forEach(p => {
      if (p.fileUrl) byUrl.set(p.fileUrl, p)
    })

    pdfs.forEach((p: CmsPdf) => {
      if (!p.fileUrl || byUrl.has(p.fileUrl)) return
      byUrl.set(p.fileUrl, {
        id: `cms-${p.id}`,
        title: {
          am: p.title.am || p.title.en || '',
          en: p.title.en || p.title.am || '',
          ar: p.title.ar || p.title.en || p.title.am || '',
        },
        fileUrl: p.fileUrl,
        source: 'cms',
      })
    })

    pdfFromKitabs.forEach(k => {
      const url = k.pdfUrl
      if (!url || byUrl.has(url)) return
      const title =
        typeof k.title === 'string'
          ? { am: k.title, en: k.title, ar: k.title }
          : k.title
      byUrl.set(url, {
        id: `kitab-pdf-${k.slug}`,
        title,
        fileUrl: url,
        source: 'kitab',
        meta: typeof k.author === 'string' ? k.author : k.author?.am || k.author?.en,
      })
    })

    return Array.from(byUrl.values())
  }, [archivePdfs, pdfs, pdfFromKitabs])

  const tabs: { id: Tab; label: { en: string; am: string; ar: string }; icon: typeof BookMarked }[] = [
    { id: 'kitab', label: { en: 'Kitab', am: 'ኪታብ', ar: 'الكتب' }, icon: BookMarked },
    {
      id: 'pdf',
      label: {
        en: `PDF (${allPdfs.length})`,
        am: `PDF (${allPdfs.length})`,
        ar: `PDF (${allPdfs.length})`,
      },
      icon: FileText,
    },
    { id: 'notes', label: { en: 'Reminders', am: 'ማስታወሻዎች', ar: 'تذكيرات' }, icon: NotebookPen },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <CategoryPageHero
        emoji="📚"
        badge={{
          en: 'Educational Archive',
          am: 'ትምህርታዊ ማህደር',
          ar: 'الأرشيف التعليمي',
        }}
        title={{ en: 'Library', am: 'ቤተ-መጻሕፍት', ar: 'المكتبة' }}
        description={{
          en: 'Kitab ders, downloadable PDFs, and written notes.',
          am: 'የኪታብ ድርሶች፣ ሊወርዱ የሚችሉ PDFዎች እና የተጻፉ ማስታወሻዎች።',
          ar: 'دروس الكتب وملفات PDF للتحميل ومذكرات مكتوبة.',
        }}
      />

      <div className="flex flex-col gap-4">
        <div
          role="tablist"
          aria-label="Library sections"
          className="tab-strip grid-cols-3"
        >
          {tabs.map(item => {
            const Icon = item.icon
            const active = tab === item.id
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(item.id)}
                className={`tab-strip-btn btn-interactive flex-col sm:flex-row ${active ? 'is-active' : ''}`}
              >
                <Icon className="w-4 h-4" />
                {getLocalized(item.label)}
              </button>
            )
          })}
        </div>
      </div>

      {tab === 'kitab' ? (
        <section className="space-y-6" role="tabpanel">
          <SectionHeading
            label={getLocalized({ en: 'Collection', am: 'ስብስብ', ar: 'مجموعة' })}
            title={getLocalized({ en: 'Kitab collection', am: 'የኪታብ ስብስብ', ar: 'مجموعة الكتب' })}
            description={getLocalized({
              en: 'Find sequential kitab ders and audio lessons here.',
              am: 'ተከታታይ የኪታብ ድርሶችን እና የድምፅ ትምህርቶችን እዚህ ያግኙ።',
              ar: 'اعثر هنا على دروس الكتب المتتابعة والدروس الصوتية.',
            })}
            action={
              <Link
                href="/kitab"
                className="btn-interactive text-sm font-bold text-rose-500 hover:text-rose-400"
              >
                {getLocalized({ en: 'Full catalog →', am: 'ሙሉ ካታሎግ →', ar: 'الفهرس الكامل →' })}
              </Link>
            }
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kitabs.map(kitab => (
              <KitabCard key={kitab.slug} kitab={kitab} />
            ))}
          </div>
        </section>
      ) : null}

      {tab === 'pdf' ? (
        <section className="space-y-6" role="tabpanel">
          <SectionHeading
            label={getLocalized({ en: 'Documents', am: 'ሰነዶች', ar: 'مستندات' })}
            title={getLocalized({
              en: `PDF documents (${allPdfs.length})`,
              am: `የPDF ሰነዶች (${allPdfs.length})`,
              ar: `مستندات PDF (${allPdfs.length})`,
            })}
            description={getLocalized({
              en: 'PDF documents to download and read.',
              am: 'ለማውረድ እና ለማንበብ የPDF ሰነዶች።',
              ar: 'مستندات PDF للتحميل والقراءة.',
            })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allPdfs.map(pdf => {
              const title = pickCmsLoc(pdf.title, language) || getLocalized(pdf.title)
              return (
                <div key={pdf.id} className="portfolio-card p-5 space-y-3 group">
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-red-600/10 text-red-600 border border-[#D4AF37]/30">
                      <FileText className="w-5 h-5" />
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setShareTarget({ title, url: pdf.fileUrl })}
                        className="btn-interactive p-2 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/40 text-[#B8860B] dark:text-[#E8C547]"
                        aria-label="Share"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <a
                        href={pdf.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-interactive p-2 rounded-lg text-neutral-400 hover:text-red-600"
                        aria-label="Download"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                  <h3 className="font-bold text-neutral-900 dark:text-white line-clamp-2 group-hover:text-[#B8860B] transition">
                    {title}
                  </h3>
                  {pdf.meta ? (
                    <p className="text-xs text-neutral-500 font-mono">{pdf.meta}</p>
                  ) : null}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <a
                      href={pdf.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-interactive inline-flex items-center gap-1 text-xs font-bold text-rose-500"
                    >
                      {getLocalized({ en: 'Open PDF', am: 'PDF ክፈት', ar: 'افتح PDF' })}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <span className="text-[10px] uppercase font-bold text-[#B8860B]/80">
                      PDF
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {!allPdfs.length ? (
            <div className="portfolio-card p-8 text-center text-sm text-neutral-500">
              {getLocalized({
                en: 'No PDFs found.',
                am: 'PDF አልተገኘም።',
                ar: 'لا ملفات PDF.',
              })}
            </div>
          ) : null}
        </section>
      ) : null}

      {tab === 'notes' ? (
        <section className="space-y-6" role="tabpanel">
          <SectionHeading
            label={getLocalized({ en: 'Heart', am: 'ልብ', ar: 'القلب' })}
            title={getLocalized({
              en: 'Library reminders',
              am: 'የቤተ-መጻሕፍት ማስታወሻዎች',
              ar: 'تذكيرات المكتبة',
            })}
            description={getLocalized({
              en: 'Same reminders as Da’wah — add once in Admin, they appear here too.',
              am: 'ከዳዕዋ ጋር ተመሳሳይ ማስታወሻዎች — በአድሚን አንድ ጊዜ ያክሉ፣ እዚህም ይታያሉ።',
              ar: 'نفس تذكيرات الدعوة — أضفها مرة في الإدارة وتظهر هنا أيضاً.',
            })}
            action={
              <Link
                href="/dawah"
                className="btn-interactive text-sm font-bold text-rose-500 hover:text-rose-400"
              >
                {getLocalized({ en: 'Da’wah reminders →', am: 'የዳዕዋ ማስታወሻዎች →', ar: 'تذكيرات الدعوة →' })}
              </Link>
            }
          />
          <RemindersFeed showHeading={false} />
        </section>
      ) : null}

      <ShareSheet
        open={!!shareTarget}
        onClose={() => setShareTarget(null)}
        title={shareTarget?.title || 'PDF'}
        url={shareTarget?.url}
      />
    </div>
  )
}
