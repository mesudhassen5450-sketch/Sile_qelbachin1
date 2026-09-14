'use client';

import { Play, Pause, Share2 } from 'lucide-react';
import type { Muhadara } from '@/data/channelData';
import { useAudio } from '@/context/AudioContext';
import { useLanguage } from '@/context/LanguageContext';

export default function MuhadaraDetailClient({ item }: { item: Muhadara }) {
  const { currentTrack, isPlaying, playTrack, togglePlayPause } = useAudio();
  const { getLocalized } = useLanguage();
  const title = getLocalized(item.title);
  const speaker = getLocalized(item.speaker);
  const topic = getLocalized(item.topic);
  const isCurrent = currentTrack?.id === item.id;

  const track = {
    id: item.id,
    title: item.title,
    speaker: item.speaker,
    duration: item.duration,
    audioUrl: item.audioUrl,
  };

  return (
    <article className="space-y-5">
      <p className="text-xs font-semibold text-red-700 dark:text-red-400">{topic}</p>
      <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">{title}</h1>
      <p className="text-neutral-600 dark:text-neutral-300">{speaker}</p>
      <p className="text-sm text-neutral-500">
        {item.duration} · {item.date}
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => (isCurrent ? togglePlayPause() : playTrack(track))}
          className="btn-red inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold"
        >
          {isCurrent && isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isCurrent && isPlaying ? 'Pause' : 'Play'}
        </button>
        <button
          type="button"
          onClick={async () => {
            try {
              if (navigator.share) await navigator.share({ title, url: window.location.href });
              else await navigator.clipboard.writeText(window.location.href);
            } catch {
              /* cancelled */
            }
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-neutral-200 dark:border-neutral-700"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
      </div>
    </article>
  );
}
