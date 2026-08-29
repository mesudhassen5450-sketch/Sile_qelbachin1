'use client';

import React, { useState } from 'react';
import { kitabsData } from '@/data/kitabs';
import { getPdfs } from '@/data/mediaStore';
import KitabCard from '@/components/KitabCard';
import { BookOpen, ArrowRight, FileText, Headphones, Download } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function KitabPage() {
  const [activeView, setActiveView] = useState<'audio' | 'pdf'>('audio');
  const { getLocalized } = useLanguage();
  const pdfDocuments = getPdfs();

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      
      {/* Page Header */}
      <section className="space-y-4">
        <div className="flex items-center space-x-2 text-red-600 font-semibold text-xs tracking-wider uppercase">
          <BookOpen className="w-4 h-4" />
          <span>Islamic Books Library</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white">
          📖 Complete Kitab Collection
        </h1>
        <p className="text-base text-neutral-600 dark:text-neutral-300 max-w-3xl leading-relaxed">
          Explore our complete collection of Islamic books with audio lectures and PDF documents. Each Kitab contains multiple parts (Ders) covering essential topics from Qur'an, Hadith, Aqeedah, Fiqh, and spiritual purification.
        </p>
      </section>

      {/* View Toggle / Tab Switcher */}
      <div className="portfolio-card p-2 inline-flex gap-2 rounded-xl">
        <button
          onClick={() => setActiveView('audio')}
          className={`inline-flex items-center space-x-2 px-6 py-3 rounded-lg font-bold text-sm transition-all duration-200 ${
            activeView === 'audio'
              ? 'bg-red-600 text-white shadow-md'
              : 'bg-transparent text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <Headphones className="w-4 h-4" />
          <span>Audio Series</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            activeView === 'audio' ? 'bg-white/20' : 'bg-neutral-200 dark:bg-neutral-700'
          }`}>
            {kitabsData.length}
          </span>
        </button>
        
        <button
          onClick={() => setActiveView('pdf')}
          className={`inline-flex items-center space-x-2 px-6 py-3 rounded-lg font-bold text-sm transition-all duration-200 ${
            activeView === 'pdf'
              ? 'bg-red-600 text-white shadow-md'
              : 'bg-transparent text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>PDF Documents</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            activeView === 'pdf' ? 'bg-white/20' : 'bg-neutral-200 dark:bg-neutral-700'
          }`}>
            {pdfDocuments.length}
          </span>
        </button>
      </div>

      {/* Audio Series View */}
      {activeView === 'audio' && (
        <>
          {/* Kitab Stats Banner */}
          <div className="portfolio-card p-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center">
                <Headphones className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {kitabsData.length} Kitab Audio Series
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {kitabsData.reduce((sum, kitab) => sum + kitab.dersCount, 0)} Total Audio Lessons
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center space-x-2 text-sm text-neutral-500 dark:text-neutral-400">
              <span>All audio lessons in Amharic</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Kitab Cards Grid */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                All Kitab Audio Series
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {kitabsData.length} series
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {kitabsData.map((kitab) => (
                <KitabCard key={kitab.slug} kitab={kitab} />
              ))}
            </div>
          </section>

          {/* Bottom Call to Action */}
          <section className="portfolio-card p-8 sm:p-10 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/40 mb-4">
              <Headphones className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">
              Start Your Learning Journey
            </h3>
            <p className="text-base text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto">
              Select any Kitab above to begin listening to the audio lectures. Each series is structured to build your knowledge progressively.
            </p>
          </section>
        </>
      )}

      {/* PDF Documents View */}
      {activeView === 'pdf' && (
        <>
          {/* PDF Stats Banner */}
          <div className="portfolio-card p-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center">
                <FileText className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {pdfDocuments.length} PDF Documents
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Complete Islamic books in PDF format
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center space-x-2 text-sm text-neutral-500 dark:text-neutral-400">
              <span>Available for reading & download</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* PDF Documents Grid */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                Kitab PDF Library
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {pdfDocuments.length} documents
              </p>
            </div>
            
            {pdfDocuments.length === 0 ? (
              <div className="portfolio-card p-12 text-center space-y-4">
                <FileText className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mx-auto" />
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                  No PDF Documents Available Yet
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                  PDF documents will be added soon. Check back later.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pdfDocuments.map((pdf) => (
                  <div
                    key={pdf.id}
                    className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col justify-between hover:shadow-lg hover:border-red-600/30 transition-all duration-300"
                  >
                    {/* PDF Header Badge */}
                    <div className="relative bg-gradient-to-br from-red-900 to-red-950 p-8 flex flex-col items-center justify-center min-h-[140px]">
                      <FileText className="w-20 h-20 text-white/10 absolute" />
                      <div className="relative text-center space-y-3 z-10">
                        <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold bg-white/10 text-white backdrop-blur-sm border border-white/20 uppercase tracking-wider">
                          📄 KITAB PDF
                        </span>
                        {pdf.fileSize && (
                          <div className="flex items-center justify-center space-x-2 text-xs text-white/80">
                            <Download className="w-3.5 h-3.5" />
                            <span className="font-mono font-semibold">{pdf.fileSize}</span>
                          </div>
                        )}
                        {pdf.date && (
                          <p className="text-xs text-white/60 font-medium">
                            Added {pdf.date}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* PDF Content */}
                    <div className="p-6 flex flex-col flex-grow justify-between space-y-4">
                      <div className="space-y-3">
                        {/* Main Title in Amharic/Arabic */}
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white leading-snug line-clamp-2">
                          {getLocalized(pdf.title)}
                        </h3>
                        
                        {/* Description/Explanation */}
                        {pdf.description && (
                          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-3">
                            {getLocalized(pdf.description)}
                          </p>
                        )}
                        
                        {/* Category Badge */}
                        {pdf.category && (
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                            {pdf.category}
                          </span>
                        )}
                      </div>

                      {/* PDF Footer Actions */}
                      <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wide mb-1">
                            Document
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono truncate max-w-[120px]">
                            {pdf.rawFilename?.substring(0, 20) || 'PDF File'}...
                          </span>
                        </div>
                        <a
                          href={pdf.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-red-700 hover:bg-red-800 dark:bg-red-600 dark:hover:bg-red-700 text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
                        >
                          <span>Read PDF</span>
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Bottom Call to Action */}
          <section className="portfolio-card p-8 sm:p-10 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/40 mb-4">
              <FileText className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">
              Read & Download Islamic Books
            </h3>
            <p className="text-base text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto">
              Access complete Islamic books in PDF format. Perfect for offline reading and in-depth study.
            </p>
          </section>
        </>
      )}

    </div>
  );
}
