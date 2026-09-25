'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Kitab } from '@/data/channelData';
import { useAudio } from '@/context/AudioContext';
import { useLanguage } from '@/context/LanguageContext';
import { resolveMediaUrl, resolvePdfEmbedUrl } from '@/lib/mediaUrl';
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
  Columns2,
  Rows2,
  GripVertical,
  GripHorizontal,
} from 'lucide-react';

export default function KitabDetailClient({ kitab }: { kitab: Kitab }) {
  const { currentTrack, isPlaying, playTrack, togglePlayPause } = useAudio();
  const { t, getLocalized, language } = useLanguage();
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isDualPaneMode, setIsDualPaneMode] = useState(false);
  /** Dual always stacks: PDF on top (full-screen style), audio choices underneath. */
  const [stackVertical, setStackVertical] = useState(true);
  const [isPdfExpanded, setIsPdfExpanded] = useState(false);
  /** Share of space for the audio pane (bottom when stacked). PDF gets the rest. */
  const [audioShare, setAudioShare] = useState(24);
  const autoPlayedRef = useRef(false);
  const splitRef = useRef<HTMLDivElement | null>(null);
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const pdfModalRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const stackedRef = useRef(false);
  const lastPointerDownRef = useRef(0);

  const displayTitle = getLocalized(kitab.title);
  const displayAuthor = getLocalized(kitab.author);
  const displayCategory = getLocalized(kitab.category);
  const displayDesc = getLocalized(kitab.description);
  const coverSrc = resolveMediaUrl(kitab.coverImage);
  const pdfSrc = resolveMediaUrl(kitab.pdfUrl);
  const pdfEmbedSrc = resolvePdfEmbedUrl(kitab.pdfUrl);
  const isArabic = language === 'ar';

  const playDers = useCallback(
    (ders: (typeof kitab.dersList)[number]) => {
      playTrack(
        {
          id: ders.id,
          title: getLocalized(ders.title),
          speaker: getLocalized(ders.speaker),
          duration: ders.duration,
          audioUrl: resolveMediaUrl(ders.audioUrl),
          kitabId: kitab.slug,
          kitabTitle: displayTitle,
        },
        kitab.dersList.map((d) => ({
          id: d.id,
          title: getLocalized(d.title),
          speaker: getLocalized(d.speaker),
          duration: d.duration,
          audioUrl: resolveMediaUrl(d.audioUrl),
          kitabId: kitab.slug,
          kitabTitle: displayTitle,
        }))
      );
    },
    [displayTitle, getLocalized, kitab.dersList, kitab.slug, playTrack]
  );

  useEffect(() => {
    if (autoPlayedRef.current) return;
    const dersParam = new URLSearchParams(window.location.search).get('ders');
    if (!dersParam) return;

    const lessonNumber = parseInt(dersParam, 10);
    const ders = kitab.dersList.find((d) => {
      const match = d.id.match(/ders-(\d+)$/);
      return match ? parseInt(match[1], 10) === lessonNumber : d.id === dersParam;
    });

    if (!ders) return;
    autoPlayedRef.current = true;
    playDers(ders);
  }, [kitab.dersList, playDers]);

  useEffect(() => {
    // Dual mode prefers stacked PDF-top / audio-bottom on all viewports.
    setStackVertical(true);
  }, []);

  const enterBrowserFullscreen = useCallback(async (el: HTMLElement | null) => {
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
      }
    } catch {
      // Browser may block fullscreen without a direct gesture; CSS overlay still covers the site chrome.
    }
  }, []);

  const exitBrowserFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement && isPdfExpanded) {
        // keep CSS expanded state; user can collapse with the button
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, [isPdfExpanded]);

  const togglePdfExpanded = useCallback(async () => {
    setIsPdfExpanded((prev) => {
      const next = !prev;
      if (next) {
        queueMicrotask(() => enterBrowserFullscreen(workspaceRef.current));
      } else {
        queueMicrotask(() => exitBrowserFullscreen());
      }
      return next;
    });
  }, [enterBrowserFullscreen, exitBrowserFullscreen]);

  const closeDualPane = useCallback(async () => {
    setIsDualPaneMode(false);
    setIsPdfExpanded(false);
    await exitBrowserFullscreen();
  }, [exitBrowserFullscreen]);

  const openPdfOnly = useCallback(async () => {
    setIsPdfModalOpen(true);
    queueMicrotask(() => enterBrowserFullscreen(pdfModalRef.current));
  }, [enterBrowserFullscreen]);

  const closePdfOnly = useCallback(async () => {
    setIsPdfModalOpen(false);
    await exitBrowserFullscreen();
  }, [exitBrowserFullscreen]);

  const isStacked = stackVertical;
  stackedRef.current = isStacked;
  const playerOffset = currentTrack ? '6.5rem' : '0px';
  // Dual matches PDF-only: cover the site chrome; audio strip sits under the PDF.
  const coversSiteChrome = true;

  const updateShareFromPoint = useCallback((clientX: number, clientY: number) => {
    const box = splitRef.current?.getBoundingClientRect();
    if (!box) return;
    // Stacked = PDF on top, audio under. Side-by-side = PDF first, audio second.
    // Grip position always maps to the PDF share; audio gets the remainder.
    const fromStart = stackedRef.current
      ? (clientY - box.top) / box.height
      : (document.documentElement.dir === 'rtl' ? box.right - clientX : clientX - box.left) / box.width;
    const next = (1 - fromStart) * 100;
    setAudioShare(Math.min(45, Math.max(18, next)));
  }, []);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (!draggingRef.current) return;
      event.preventDefault();
      updateShareFromPoint(event.clientX, event.clientY);
    };
    const onUp = () => {
      draggingRef.current = false;
    };
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [updateShareFromPoint]);

  const onSplitPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    const now = Date.now();
    if (now - lastPointerDownRef.current < 350) {
      setIsPdfExpanded(true);
      queueMicrotask(() => enterBrowserFullscreen(workspaceRef.current));
      lastPointerDownRef.current = 0;
      return;
    }
    lastPointerDownRef.current = now;
    draggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateShareFromPoint(event.clientX, event.clientY);
  };

  const audioPaneStyle = isPdfExpanded
    ? { display: 'none' as const }
    : isStacked
      ? { height: `${audioShare}%`, width: '100%' }
      : { width: `${audioShare}%`, height: '100%' };

  const pdfPaneStyle = isPdfExpanded
    ? { width: '100%', height: '100%' }
    : isStacked
      ? { height: `${100 - audioShare}%`, width: '100%' }
      : { width: `${100 - audioShare}%`, height: '100%' };

  const renderPlaylist = (compact = false) => (
    <div className="flex-1 overflow-y-auto min-h-0">
      {kitab.dersList.map((ders) => {
        const isPlayingThis = currentTrack?.id === ders.id && isPlaying;
        const handleTrackPlay = () => {
          if (currentTrack?.id === ders.id) {
            togglePlayPause();
          } else {
            playDers(ders);
          }
        };

        return (
          <div
            id={compact ? undefined : ders.id}
            key={ders.id}
            className={`p-4 border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition cursor-pointer ${
              isPlayingThis ? 'bg-red-50 dark:bg-red-950/30 border-s-4 border-red-600' : ''
            }`}
            onClick={handleTrackPlay}
          >
            <div className="flex items-start gap-3">
              <button
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition ${
                  isPlayingThis ? 'bg-red-600 animate-pulse' : 'bg-neutral-200 dark:bg-neutral-700'
                }`}
                aria-label={`${isPlayingThis ? t('buttons.pause') : t('buttons.play')} ${getLocalized(ders.title)}`}
              >
                {isPlayingThis ? (
                  <Pause className="w-4 h-4 fill-white text-white" />
                ) : (
                  <Play className="w-4 h-4 fill-neutral-700 dark:fill-white text-neutral-700 dark:text-white ms-0.5" />
                )}
              </button>
              <div className="flex-1 min-w-0 space-y-1">
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                  {getLocalized(ders.title)}
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                  {getLocalized(ders.speaker)}
                </p>
              </div>
              <a
                href={resolveMediaUrl(ders.audioUrl)}
                download
                onClick={(event) => event.stopPropagation()}
                className="p-2 rounded-lg text-neutral-400 hover:text-red-600 transition flex-shrink-0"
                title={t('downloadAudio')}
                aria-label={`Download ${getLocalized(ders.title)}`}
              >
                <Download className="w-4 h-4" />
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <Link
        href="/kitab"
        className="inline-flex items-center gap-2 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition"
      >
        <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
        <span>{t('kitabBackToLibrary')}</span>
      </Link>

      <div className="portfolio-card overflow-hidden">
        <div
          className="w-full flex items-center justify-center"
          style={{ backgroundColor: kitab.coverBg ?? '#111111' }}
        >
          {coverSrc ? (
            <Image
              src={coverSrc}
              alt={`${displayTitle} cover`}
              width={1600}
              height={900}
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="w-full h-auto object-contain"
              priority
              unoptimized
            />
          ) : (
            <div className="w-full min-h-[16rem] bg-gradient-to-br from-red-950 via-neutral-900 to-neutral-950" />
          )}
        </div>

        <div className="p-6 sm:p-8 bg-white dark:bg-neutral-900/60 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-semibold">
              <BookOpen className="w-3 h-3" />
              <span className={isArabic ? 'arabic-text' : ''}>{displayCategory}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-full">
              <Headphones className="w-3 h-3 text-red-500" />
              <span>
                {kitab.dersCount} {t('kitabAudioLectures')}
              </span>
            </span>
          </div>
          <h1
            className={`text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight leading-tight ${
              isArabic ? 'arabic-text' : ''
            }`}
          >
            {displayTitle}
          </h1>
          <p className={`text-sm font-medium text-red-600 dark:text-red-400 ${isArabic ? 'arabic-text' : ''}`}>
            {displayAuthor}
          </p>
          <p className={`text-base text-neutral-700 dark:text-neutral-300 leading-relaxed max-w-4xl ${isArabic ? 'arabic-text' : ''}`}>
            {displayDesc}
          </p>
        </div>
      </div>

      {pdfSrc && (
        <section className="portfolio-card p-6 sm:p-8 border-2 border-red-600/30 dark:border-red-900/40 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center flex-shrink-0 shadow-lg">
                <FileText className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <span className="text-2xs font-extrabold uppercase tracking-wider text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950 px-2 py-0.5 rounded">
                  {t('kitabPdfDocument')}
                </span>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                  {displayTitle} — PDF
                </h2>
                <p className="text-xs text-neutral-600 dark:text-neutral-300">{t('kitabPdfFollowAlong')}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  setStackVertical(true);
                  setAudioShare(24);
                  setIsPdfExpanded(false);
                  setIsDualPaneMode(true);
                }}
                className="btn-red px-5 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md"
              >
                <Maximize2 className="w-4 h-4" />
                <span>{t('kitabDualPane')}</span>
              </button>
              <button
                onClick={() => openPdfOnly()}
                className="px-5 py-3 rounded-xl font-bold text-xs sm:text-sm bg-neutral-900 text-white dark:bg-neutral-800 hover:bg-neutral-800 transition flex items-center gap-2 shadow-md border border-neutral-700"
              >
                <Eye className="w-4 h-4 text-red-500" />
                <span>{t('kitabPdfOnly')}</span>
              </button>
              <a
                href={pdfSrc}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="px-5 py-3 rounded-xl font-bold text-xs sm:text-sm bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white hover:bg-neutral-200 transition flex items-center gap-2 shadow-md"
              >
                <Download className="w-4 h-4 text-red-500" />
                <span>{t('downloadPdf')}</span>
              </a>
            </div>
          </div>
        </section>
      )}

      {isDualPaneMode && (
        <div
          ref={workspaceRef}
          className={`fixed inset-x-0 bg-black flex flex-col overflow-hidden ${
            coversSiteChrome ? 'inset-0 z-[70] w-screen h-screen' : 'z-[45]'
          }`}
          style={
            coversSiteChrome
              ? undefined
              : {
                  top: 'var(--site-header-height)',
                  bottom: playerOffset,
                }
          }
        >
          <div className="relative z-20 bg-neutral-900 border-b border-neutral-800 px-3 sm:px-4 py-2 flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
              <h2 className="text-sm sm:text-base font-bold text-white truncate">{displayTitle}</h2>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => togglePdfExpanded()}
                className={`p-2 rounded-lg transition ${
                  isPdfExpanded ? 'bg-red-600 text-white' : 'bg-neutral-800 text-neutral-300 hover:text-white'
                }`}
                title={isPdfExpanded ? t('kitabCollapsePdf') : t('kitabExpandPdf')}
                aria-label={isPdfExpanded ? t('kitabCollapsePdf') : t('kitabExpandPdf')}
              >
                {isPdfExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              {!isPdfExpanded && (
                <>
                  <button
                    type="button"
                    onClick={() => setStackVertical(false)}
                    className={`p-2 rounded-lg transition ${
                      !isStacked ? 'bg-red-600 text-white' : 'bg-neutral-800 text-neutral-300 hover:text-white'
                    }`}
                    title={t('kitabSplitSide')}
                    aria-label={t('kitabSplitSide')}
                  >
                    <Columns2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setStackVertical(true)}
                    className={`p-2 rounded-lg transition ${
                      isStacked ? 'bg-red-600 text-white' : 'bg-neutral-800 text-neutral-300 hover:text-white'
                    }`}
                    title={t('kitabSplitStacked')}
                    aria-label={t('kitabSplitStacked')}
                  >
                    <Rows2 className="w-4 h-4" />
                  </button>
                </>
              )}
              {pdfSrc && (
                <a
                  href={pdfSrc}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="p-2 rounded-lg bg-neutral-800 text-neutral-200 hover:text-white transition"
                  title={t('downloadPdf')}
                  aria-label={t('downloadPdf')}
                >
                  <Download className="w-4 h-4" />
                </a>
              )}
              <button
                type="button"
                onClick={() => closeDualPane()}
                className="p-2 text-white bg-red-600 hover:bg-red-700 rounded-full transition shadow-lg"
                aria-label="Close dual pane view"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div
            ref={splitRef}
            className={`flex flex-1 min-h-0 overflow-hidden p-2 ${isStacked && !isPdfExpanded ? 'flex-col' : 'flex-row'}`}
          >
            <div
              className="flex flex-col bg-neutral-950 rounded-lg overflow-hidden min-w-0 min-h-0 border border-neutral-800"
              style={pdfPaneStyle}
            >
              {pdfEmbedSrc ? (
                <iframe src={pdfEmbedSrc} className="w-full flex-1 min-h-0 border-none bg-white" title="Kitab PDF Viewer" />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-neutral-400 p-6 text-center">
                  <FileText className="w-10 h-10 text-red-700" />
                  <p className="text-sm">{t('kitabPdfUnavailable')}</p>
                </div>
              )}
            </div>

            {!isPdfExpanded && (
              <button
                type="button"
                onPointerDown={onSplitPointerDown}
                onDoubleClick={() => {
                  setIsPdfExpanded(true);
                  queueMicrotask(() => enterBrowserFullscreen(workspaceRef.current));
                }}
                className={`flex items-center justify-center flex-shrink-0 bg-neutral-800 hover:bg-red-900/50 text-neutral-300 hover:text-red-400 transition select-none touch-none ${
                  isStacked ? 'h-4 w-full cursor-row-resize' : 'w-4 h-full cursor-col-resize'
                }`}
                title={t('kitabResizeHint')}
                aria-label={t('kitabResizeHint')}
              >
                {isStacked ? <GripHorizontal className="w-4 h-4" /> : <GripVertical className="w-4 h-4" />}
              </button>
            )}

            {!isPdfExpanded && (
              <div
                className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-800 flex flex-col overflow-hidden min-w-0 min-h-0"
                style={audioPaneStyle}
              >
                <div className="p-3 sm:p-4 border-b border-neutral-200 dark:border-neutral-800 flex-shrink-0">
                  <div className="flex items-center gap-2 text-xs font-bold text-red-600 dark:text-red-400 mb-1">
                    <Headphones className="w-4 h-4" />
                    <span>{t('kitabAudioLectures')}</span>
                  </div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                    {kitab.dersList.length} {t('kitabLessons')}
                  </h3>
                </div>
                {renderPlaylist(true)}
              </div>
            )}
          </div>
        </div>
      )}

      {isPdfModalOpen && pdfSrc && (
        <div
          ref={pdfModalRef}
          className="fixed inset-0 z-[70] w-screen h-screen bg-black flex flex-col"
        >
          <div className="bg-neutral-900 border-b border-neutral-800 px-3 sm:px-5 py-2.5 flex items-center justify-between gap-2 flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0 pe-4">
              <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
              <h3 className="text-sm sm:text-base font-bold text-white truncate">
                {displayTitle} — {t('kitabPdfDocument')}
              </h3>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => enterBrowserFullscreen(pdfModalRef.current)}
                className="p-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
                title={t('kitabExpandPdf')}
                aria-label={t('kitabExpandPdf')}
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <a
                href={pdfSrc}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="p-2 rounded-lg bg-neutral-800 text-neutral-200 hover:text-white transition"
                title={t('downloadPdf')}
                aria-label={t('downloadPdf')}
              >
                <Download className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={() => closePdfOnly()}
                className="p-2 text-white bg-red-600 hover:bg-red-700 rounded-full transition"
                aria-label="Close PDF"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-0 bg-neutral-950">
            <iframe src={pdfEmbedSrc} className="w-full h-full border-none bg-white" title="Kitab PDF Reader" />
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <Headphones className="w-6 h-6 text-red-600" />
            <span>{t('kitabRelatedLessons')}</span>
          </h2>
          <span className="text-xs font-mono text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-full">
            {kitab.dersList.length} {t('kitabTracks')}
          </span>
        </div>

        <div className="portfolio-card divide-y divide-neutral-100 dark:divide-neutral-800 overflow-hidden">
          {kitab.dersList.map((ders) => {
            const isPlayingThis = currentTrack?.id === ders.id && isPlaying;
            const handleTrackPlay = () => {
              if (currentTrack?.id === ders.id) {
                togglePlayPause();
              } else {
                playDers(ders);
              }
            };

            return (
              <div
                id={ders.id}
                key={ders.id}
                className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition duration-300 scroll-mt-36 ${
                  isPlayingThis
                    ? 'bg-red-50/70 dark:bg-red-950/30 border-s-4 border-red-600'
                    : 'hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleTrackPlay}
                    className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm transition transform hover:scale-105 ${
                      isPlayingThis ? 'bg-red-700 ring-4 ring-red-600/30 animate-pulse' : 'btn-red'
                    }`}
                  >
                    {isPlayingThis ? (
                      <Pause className="w-5 h-5 fill-white" />
                    ) : (
                      <Play className="w-5 h-5 fill-white ms-0.5" />
                    )}
                  </button>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                      {getLocalized(ders.title)}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{getLocalized(ders.speaker)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 justify-between sm:justify-end">
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
                    href={resolveMediaUrl(ders.audioUrl)}
                    download
                    className="p-2 rounded-lg text-neutral-400 hover:text-red-600 transition"
                    title={t('downloadAudio')}
                    aria-label={`Download ${getLocalized(ders.title)}`}
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
