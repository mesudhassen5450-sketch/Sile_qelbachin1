'use client'

import React, { useState } from 'react'
import { getPdfs } from '@/data/mediaStore'
import type { Kitab } from '@/data/channelData'
import KitabCard from '@/components/KitabCard'
import { BookOpen, ArrowRight, FileText, Headphones, Download } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

export default function KitabPageClient({
  kitabs,
  source: _source
}: {
  kitabs: Kitab[]
  source: string
}) {
  const [activeView, setActiveView] = useState<'audio' | 'pdf'>('audio')
  const { getLocalized, t } = useLanguage()
  const pdfDocuments = getPdfs()

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-red-600 font-semibold text-xs tracking-wider uppercase">
          <BookOpen className="w-4 h-4" />
          <span>{t('kitabLibraryLabel')}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white">
          {t('kitabCollectionTitle')}
        </h1>
        <p className="text-base text-neutral-600 dark:text-neutral-300 max-w-3xl leading-relaxed">
          {t('kitabCollectionIntro')}
        </p>
      </section>

      <div className="portfolio-card p-2 inline-flex gap-2 rounded-xl">
        <button
          onClick={() => setActiveView('audio')}
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm transition-all duration-200 ${
            activeView === 'audio'
              ? 'bg-red-600 text-white shadow-md'
              : 'bg-transparent text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <Headphones className="w-4 h-4" />
          <span>{t('kitabAudioSeries')}</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              activeView === 'audio' ? 'bg-white/20' : 'bg-neutral-200 dark:bg-neutral-700'
            }`}
          >
            {kitabs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveView('pdf')}
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm transition-all duration-200 ${
            activeView === 'pdf'
              ? 'bg-red-600 text-white shadow-md'
              : 'bg-transparent text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{t('kitabPdfDocuments')}</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              activeView === 'pdf' ? 'bg-white/20' : 'bg-neutral-200 dark:bg-neutral-700'
            }`}
          >
            {pdfDocuments.length}
          </span>
        </button>
      </div>

      {activeView === 'audio' && (
        <>
          <div className="portfolio-card p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center">
                <Headphones className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {kitabs.length} {t('kitabAudioSeriesCount')}
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {kitabs.reduce((sum, kitab) => sum + kitab.dersCount, 0)} {t('kitabTotalLessons')}
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
              <span>{t('kitabAllAudioAmharic')}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </div>
          </div>

          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                {t('kitabAllSeries')}
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {kitabs.length} {t('kitabSeriesCount')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {kitabs.map(kitab => (
                <KitabCard key={kitab.slug} kitab={kitab} />
              ))}
            </div>
          </section>
        </>
      )}

      {activeView === 'pdf' && (
        <>
          <div className="portfolio-card p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center">
                <FileText className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {pdfDocuments.length} {t('kitabPdfDocuments')}
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {t('kitabPdfSubtitle')}
                </p>
              </div>
            </div>
          </div>

          <section className="space-y-6">
            {pdfDocuments.length === 0 ? (
              <div className="portfolio-card p-12 text-center space-y-4">
                <FileText className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mx-auto" />
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                  {t('kitabNoPdfs')}
                </h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pdfDocuments.map(pdf => (
                  <div
                    key={pdf.id}
                    className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col"
                  >
                    <div className="p-6 space-y-3">
                      <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                        {getLocalized(pdf.title)}
                      </h3>
                      <a
                        href={pdf.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-red-700 hover:bg-red-800 text-white text-xs font-bold px-5 py-2.5 rounded-lg inline-flex items-center gap-2"
                      >
                        <span>{t('kitabReadPdf')}</span>
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
