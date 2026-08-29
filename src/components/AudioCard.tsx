'use client';

import React from 'react';
import Link from 'next/link';
import { Ders } from '@/data/channelData';
import { useAudio } from '@/context/AudioContext';
import { useLanguage } from '@/context/LanguageContext';
import { Play, Pause } from 'lucide-react';

interface AudioCardProps {
  track: Ders;
  playlist?: Ders[];
}

export default function AudioCard({ track, playlist }: AudioCardProps) {
  const { currentTrack, isPlaying, playTrack, togglePlayPause } = useAudio();
  const { t, getLocalized } = useLanguage();

  const isPlayingThis = currentTrack?.id === track.id && isPlaying;

  return (
    <div className="portfolio-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50 transition">
      <div className="flex items-center space-x-4 min-w-0">
        <button
          onClick={() => {
            if (currentTrack?.id === track.id) {
              togglePlayPause();
            } else {
              playTrack(
                {
                  id: track.id,
                  title: getLocalized(track.title),
                  speaker: getLocalized(track.speaker),
                  duration: track.duration,
                  audioUrl: track.audioUrl,
                  kitabId: track.kitabId,
                  kitabTitle: getLocalized(track.kitabTitle),
                },
                playlist?.map((p) => ({
                  id: p.id,
                  title: getLocalized(p.title),
                  speaker: getLocalized(p.speaker),
                  duration: p.duration,
                  audioUrl: p.audioUrl,
                  kitabId: p.kitabId,
                  kitabTitle: getLocalized(p.kitabTitle),
                }))
              );
            }
          }}
          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm transition ${
            isPlayingThis ? 'bg-red-700 text-white animate-pulse' : 'btn-red'
          }`}
          aria-label={isPlayingThis ? t('buttons.pause') : t('buttons.play')}
        >
          {isPlayingThis ? (
            <Pause className="w-4 h-4 fill-white" />
          ) : (
            <Play className="w-4 h-4 fill-white ml-0.5" />
          )}
        </button>

        <div className="min-w-0 space-y-0.5">
          <h4 className="text-base font-semibold text-neutral-900 dark:text-white truncate">
            {getLocalized(track.title)}
          </h4>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            🎙️ {getLocalized(track.speaker)} {track.kitabTitle ? `• ${getLocalized(track.kitabTitle)}` : ''}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-4 justify-between sm:justify-end">
        <span className="text-xs font-mono text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-md">
          ⏱️ {track.duration}
        </span>
        {track.kitabId && (
          <Link
            href={`/kitab/${track.kitabId}`}
            className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline"
          >
            {t('buttons.openKitab')}
          </Link>
        )}
      </div>
    </div>
  );
}
