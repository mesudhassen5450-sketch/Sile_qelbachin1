'use client';

import Link from 'next/link';
import { ArrowLeft, Play, Pause, Share2, BookOpen } from 'lucide-react';
import { useAudio } from '@/context/AudioContext';
import { useLanguage } from '@/context/LanguageContext';
import type { DersRecord } from '@/lib/contentCatalog';
import { getAllDers } from '@/lib/contentCatalog';

export default function DersDetailClient({ record }: { record: DersRecord }) {
  const { currentTrack, isPlaying, playTrack, togglePlayPause } = useAudio();
  const { getLocalized } = useLanguage();

  const { ders, kitab, partNumber, href } = record;
  const title = getLocalized(ders.title);
  const speaker = getLocalized(ders.speaker);
  const kitabTitle = getLocalized(kitab.title);
  const isCurrent = currentTrack?.id === ders.id;
  const playlist = kitab.dersList;

  const related = getAllDers()
    .filter((d) => d.kitab.slug === kitab.slug && d.ders.id !== ders.id)
    .slice(0, 8);

  const share = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : href;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${kitabTitle} — ${title}`, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      // user cancelled
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Link
        href={`/kitab/${kitab.slug}`}
        className="inline-flex items-center gap-2 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-red-600"
      >
        <ArrowLeft className="w-4 h-4" />
        {kitabTitle}
      </Link>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          {partNumber != null && (
            <span className="px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400">
              Ders {partNumber}
            </span>
          )}
          <span className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 inline-flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            {kitabTitle}
          </span>
        </div>

        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">{title}</h1>
        <p className="text-neutral-600 dark:text-neutral-300">{speaker}</p>
        {ders.duration ? (
          <p className="text-sm text-neutral-500">Duration: {ders.duration}</p>
        ) : null}

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              if (isCurrent) togglePlayPause();
              else playTrack(ders, playlist);
            }}
            className="btn-red inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold"
          >
            {isCurrent && isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isCurrent && isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            type="button"
            onClick={share}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-neutral-200 dark:border-neutral-700 hover:border-red-600/40"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
      </div>

      {related.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Related Ders</h2>
          <ul className="space-y-2">
            {related.map((r) => (
              <li key={r.ders.id}>
                <Link
                  href={r.href}
                  className="block px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-red-600/40 text-sm"
                >
                  {getLocalized(r.ders.title)}
                  {r.partNumber != null ? ` · Ders ${r.partNumber}` : ''}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
