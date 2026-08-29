'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Kitab } from '@/data/channelData';
import { getKitabDetailBannerStyle } from '@/components/KitabCard';
import { useAudio } from '@/context/AudioContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  BookOpen,
  Headphones,
  Play,
  Pause,
  ArrowLeft,
  FileText,
  Eye,
  Download,
  X,
  Maximize2,
  Minimize2,
} from 'lucide-react';

export default function KitabDetailClient({ kitab }: { kitab: Kitab }) {
  const { currentTrack, isPlaying, playTrack, togglePlayPause } = useAudio();
  const { t, getLocalized } = useLanguage();
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isDualPaneMode, setIsDualPaneMode] = useState(false);

  const displayTitle = getLocalized(kitab.title);
  const displayAuthor = getLocalized(kitab.author);
  const displayCategory = getLocalized(kitab.category);
  const displayDesc = getLocalized(kitab.description);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Back Link */}
      <Link
        href="/kitab"
        className="inline-flex items-center space-x-2 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>ወደ ኪታቦች ዝርዝር ተመለስ (Back to Kitab Library)</span>
      </Link>

      {/* Kitab Main Header Card — Cover Image Banner */}
      <div className="portfolio-card overflow-hidden">
        {/* Hero image strip */}
        <div
          className="relative h-64 sm:h-80 w-full flex items-center justify-center overflow-hidden"
          style={{ backgroundColor: kitab.coverBg ?? '#0d0d0d' }}
        >
          {kitab.coverImage ? (
            <Image
              src={kitab.coverImage}
              alt={`${displayTitle} cover`}
              fill
              sizes="(max-width: 1280px) 100vw, 1280px"
              style={getKitabDetailBannerStyle(kitab.slug)}
              priority
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-red-950 via-neutral-900 to-neutral-950" />
          )}
          {/* Bottom-only gradient scrim so metadata is readable */}
          <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

          {/* Metadata overlay on image */}
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7 space-y-1.5 z-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-red-600/90 backdrop-blur-sm text-white text-xs font-semibold shadow">
                <BookOpen className="w-3 h-3" />
                <span>{displayCategory}</span>
              </span>
              <span className="inline-flex items-center space-x-1 text-xs font-semibold text-white/80 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
                <Headphones className="w-3 h-3 text-red-400" />
                <span>{kitab.dersCount} Audio Lectures</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-lg leading-tight">
              {displayTitle}
            </h1>
            <p className="text-sm font-medium text-red-300">
              ✍️ {displayAuthor}
            </p>
          </div>
        </div>

        {/* Description below the image */}
        <div className="p-6 sm:p-8 bg-white dark:bg-neutral-900/60">
          <p className="text-base text-neutral-700 dark:text-neutral-300 leading-relaxed max-w-4xl">
            {displayDesc}
          </p>
        </div>
      </div>

      {/* 1. PROMINENT PDF DOCUMENT PRIORITY CARD */}
      {kitab.pdfUrl && (
        <section className="portfolio-card p-6 sm:p-8 border-2 border-red-600/30 dark:border-red-900/40 space-y-6 bg-gradient-to-r from-red-950/10 via-transparent to-neutral-900/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            
            <div className="flex items-start space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center flex-shrink-0 shadow-lg border border-red-500/40">
                <FileText className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-2xs font-extrabold uppercase tracking-wider text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950 px-2 py-0.5 rounded">
                    PDF Document (ዋና የኪታብ ፋይል)
                  </span>
                  {kitab.pdfSize && (
                    <span className="text-2xs font-mono text-neutral-400">
                      📦 {kitab.pdfSize}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                  {displayTitle} — PDF
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-300">
                  ትምህርቱን በፅሁፍ እየተከታተሉ ለማዳመጥ ፒዲኤፉን እዚህ ያንብቡ ወይም ያውርዱ።
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIsDualPaneMode(true)}
                className="btn-red px-5 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center space-x-2 shadow-md"
              >
                <Maximize2 className="w-4 h-4" />
                <span>Dual Pane View (ድርሶችና ፒዲኤፍ)</span>
              </button>

              <button
                onClick={() => setIsPdfModalOpen(true)}
                className="px-5 py-3 rounded-xl font-bold text-xs sm:text-sm bg-neutral-900 text-white dark:bg-neutral-800 hover:bg-neutral-800 transition flex items-center space-x-2 shadow-md border border-neutral-700"
              >
                <Eye className="w-4 h-4 text-red-500" />
                <span>PDF Only</span>
              </button>

              <a
                href={kitab.pdfUrl}
                download
                className="px-5 py-3 rounded-xl font-bold text-xs sm:text-sm bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white hover:bg-neutral-200 transition flex items-center space-x-2 shadow-md"
              >
                <Download className="w-4 h-4 text-red-500" />
                <span>Download</span>
              </a>
            </div>

          </div>
        </section>
      )}

      {/* DUAL-PANE WORKSPACE: Audio Player (Left) + PDF Viewer (Right) */}
      {isDualPaneMode && kitab.pdfUrl && (
        <div className="fixed inset-0 z-50 bg-black w-screen h-screen flex flex-col overflow-hidden">
          {/* Header Bar */}
          <div className="bg-neutral-900 border-b border-neutral-800 px-6 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-bold text-white truncate">
                {displayTitle} — Dual Pane Workspace
              </h2>
            </div>
            <button
              onClick={() => setIsDualPaneMode(false)}
              className="p-2 text-neutral-400 hover:text-white rounded-full bg-neutral-800 hover:bg-neutral-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Dual-Pane Content Area filling remaining vertical space */}
          <div className="flex flex-1 w-full h-full overflow-hidden gap-2 p-2">
            
            {/* Left Panel: Audio Player & Playlist */}
            <div className="w-1/3 h-full bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden shadow-xl">
              <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex-shrink-0">
                <div className="flex items-center space-x-2 text-xs font-bold text-red-600 dark:text-red-400 mb-2">
                  <Headphones className="w-4 h-4" />
                  <span>AUDIO LECTURES</span>
                </div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  {kitab.dersList.length} Lessons
                </h3>
              </div>

              {/* Scrollable Playlist */}
              <div className="flex-1 overflow-y-auto">
                {kitab.dersList.map((ders) => {
                  const isPlayingThis = currentTrack?.id === ders.id && isPlaying;
                  
                  const handleTrackPlay = () => {
                    if (currentTrack?.id === ders.id) {
                      togglePlayPause();
                    } else {
                      playTrack(
                        {
                          id: ders.id,
                          title: getLocalized(ders.title),
                          speaker: getLocalized(ders.speaker),
                          duration: ders.duration,
                          audioUrl: ders.audioUrl,
                          kitabId: kitab.slug,
                          kitabTitle: displayTitle,
                        },
                        kitab.dersList.map((d) => ({
                          id: d.id,
                          title: getLocalized(d.title),
                          speaker: getLocalized(d.speaker),
                          duration: d.duration,
                          audioUrl: d.audioUrl,
                          kitabId: kitab.slug,
                          kitabTitle: displayTitle,
                        }))
                      );
                    }
                  };

                  return (
                    <div
                      key={ders.id}
                      className={`p-4 border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition cursor-pointer ${
                        isPlayingThis ? 'bg-red-50 dark:bg-red-950/30 border-l-4 border-l-red-600' : ''
                      }`}
                      onClick={handleTrackPlay}
                    >
                      <div className="flex items-start space-x-3">
                        <button
                          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition ${
                            isPlayingThis ? 'bg-red-600 animate-pulse' : 'bg-neutral-200 dark:bg-neutral-700'
                          }`}
                        >
                          {isPlayingThis ? (
                            <Pause className="w-4 h-4 fill-white text-white" />
                          ) : (
                            <Play className="w-4 h-4 fill-neutral-700 dark:fill-white text-neutral-700 dark:text-white ml-0.5" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0 space-y-1">
                          <h4 className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                            {getLocalized(ders.title)}
                          </h4>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                            🎙️ {getLocalized(ders.speaker)}
                          </p>
                          <span className="text-xs font-mono text-neutral-400">
                            ⏱️ {ders.duration}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Panel: PDF Viewer */}
            <div className="w-2/3 h-full bg-neutral-900 rounded-lg overflow-hidden shadow-xl">
              <iframe
                src={kitab.pdfUrl}
                className="w-full h-full border-none"
                title="Kitab PDF Viewer"
              />
            </div>

          </div>
        </div>
      )}

      {/* PDF Modal Reader */}
      {isPdfModalOpen && kitab.pdfUrl && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 text-white rounded-3xl max-w-5xl w-full h-[88vh] p-6 space-y-4 relative border border-neutral-800 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center space-x-3 truncate pr-4">
                <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
                <h3 className="text-lg font-bold truncate">
                  {displayTitle} — PDF Document
                </h3>
              </div>
              <button
                onClick={() => setIsPdfModalOpen(false)}
                className="p-2 text-neutral-400 hover:text-white rounded-full bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-grow bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-800">
              <iframe
                src={kitab.pdfUrl}
                className="w-full h-full border-none"
                title="Kitab PDF Reader"
              />
            </div>

            <div className="flex items-center justify-between pt-2 text-xs">
              <span className="text-neutral-400 font-mono">
                {kitab.pdfSize ? `📦 Size: ${kitab.pdfSize}` : ''}
              </span>
              <a
                href={kitab.pdfUrl}
                download
                className="btn-red px-5 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>PDF አውርድ (Download PDF)</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 2. SEQUENTIAL CHILD AUDIO LECTURES PLAYLIST */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center space-x-2">
            <Headphones className="w-6 h-6 text-red-600" />
            <span>የተያያዙ የድምፅ ድርሶች (Audio Lessons Playlist)</span>
          </h2>
          <span className="text-xs font-mono text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-full">
            {kitab.dersList.length} Tracks
          </span>
        </div>

        <div className="portfolio-card divide-y divide-neutral-100 dark:divide-neutral-800 overflow-hidden">
          {kitab.dersList.map((ders) => {
            const isPlayingThis = currentTrack?.id === ders.id && isPlaying;
            
            const handleTrackPlay = () => {
              if (currentTrack?.id === ders.id) {
                togglePlayPause();
              } else {
                playTrack(
                  {
                    id: ders.id,
                    title: getLocalized(ders.title),
                    speaker: getLocalized(ders.speaker),
                    duration: ders.duration,
                    audioUrl: ders.audioUrl,
                    kitabId: kitab.slug,
                    kitabTitle: displayTitle,
                  },
                  kitab.dersList.map((d) => ({
                    id: d.id,
                    title: getLocalized(d.title),
                    speaker: getLocalized(d.speaker),
                    duration: d.duration,
                    audioUrl: d.audioUrl,
                    kitabId: kitab.slug,
                    kitabTitle: displayTitle,
                  }))
                );
              }
            };

            return (
              <div
                key={ders.id}
                className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition duration-300 ${
                  isPlayingThis
                    ? 'bg-red-50/70 dark:bg-red-950/30 border-l-4 border-red-600'
                    : 'hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleTrackPlay}
                    className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm transition transform hover:scale-105 ${
                      isPlayingThis ? 'bg-red-700 ring-4 ring-red-600/30 animate-pulse' : 'btn-red'
                    }`}
                  >
                    {isPlayingThis ? (
                      <Pause className="w-5 h-5 fill-white" />
                    ) : (
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    )}
                  </button>

                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                      {getLocalized(ders.title)}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      🎙️ {getLocalized(ders.speaker)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 justify-between sm:justify-end">
                  <span className="text-xs font-mono text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-md">
                    ⏱️ {ders.duration}
                  </span>

                  <button
                    onClick={handleTrackPlay}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                      isPlayingThis
                        ? 'bg-red-600 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200'
                    }`}
                  >
                    {isPlayingThis ? t('buttons.pause') : t('buttons.play')}
                  </button>

                  <a
                    href={ders.audioUrl}
                    download
                    className="p-2 rounded-lg text-neutral-400 hover:text-red-600 transition"
                    title="Download Audio (.ogg/.mp3)"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
