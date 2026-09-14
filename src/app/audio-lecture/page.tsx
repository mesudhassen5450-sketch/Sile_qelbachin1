'use client';

import React, { useState } from 'react';
import { getAudios, getContentByCategory } from '@/data/mediaStore';
import { useAudio } from '@/context/AudioContext';
import { useLanguage } from '@/context/LanguageContext';
import { siteMetadata } from '@/data/channelData';
import {
  Radio,
  Headphones,
  Play,
  Pause,
  Filter,
  Send,
  Sparkles,
} from 'lucide-react';

export default function AudioLecturePage() {
  const { currentTrack, isPlaying, playTrack, togglePlayPause } = useAudio();
  const { language, t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Hadith', 'Aqeedah', 'Tafseer', 'General'];
  const mediaAudios = getAudios();
  const filteredMediaAudios =
    selectedCategory === 'All'
      ? mediaAudios
      : getContentByCategory(selectedCategory).filter((i) => i.type === 'audio');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      <div className="portfolio-card p-6 sm:p-10 space-y-4 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 text-xs font-semibold border border-red-200 dark:border-red-900/40">
          <Headphones className="w-3.5 h-3.5" />
          <span>{t('nav.audioLecture')}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white">
          {t('nav.audioLecture')}
        </h1>
        <p className="text-base text-neutral-600 dark:text-neutral-300 max-w-3xl leading-relaxed">
          {t('liveFeatureBody')}
        </p>
      </div>

      {/* Honest coming-soon — no fake LIVE */}
      <section className="rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/60 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
            <Radio className="w-6 h-6 text-neutral-500" />
          </div>
          <div className="flex-1 space-y-1.5 min-w-0">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('liveStayTunedBadge')}</span>
            </div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
              {t('liveFeatureTitle')}
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {t('liveStayTunedBody')} {t('liveNotActiveYet')}
            </p>
          </div>
          <a
            href={siteMetadata.telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold flex-shrink-0 transition"
          >
            <Send className="w-3.5 h-3.5" />
            {siteMetadata.telegramHandle}
          </a>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5 me-2">
          <Filter className="w-3.5 h-3.5 text-red-500" />
          <span>Category</span>
        </span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              selectedCategory === cat
                ? 'btn-red shadow-sm'
                : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Headphones className="w-5 h-5 text-red-600" />
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
              {t('audioLecture.previous')}
            </h2>
          </div>
          <span className="text-xs font-mono text-neutral-400">
            {filteredMediaAudios.length} tracks
          </span>
        </div>

        <div className="portfolio-card divide-y divide-neutral-100 dark:divide-neutral-800 overflow-hidden">
          {filteredMediaAudios.map((item) => {
            const isPlayingThis = currentTrack?.id === item.id && isPlaying;
            const itemTitle =
              item.title[language as 'am' | 'en' | 'ar'] || item.title.am || 'ድምፅ ትምህርት';
            const itemDesc =
              item.description[language as 'am' | 'en' | 'ar'] ||
              item.description.am ||
              '';

            return (
              <div
                key={item.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50 transition"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <button
                    onClick={() => {
                      if (currentTrack?.id === item.id) {
                        togglePlayPause();
                      } else {
                        playTrack({
                          id: item.id,
                          title: itemTitle,
                          speaker: siteMetadata.channelName,
                          duration: '',
                          audioUrl: item.fileUrl,
                        });
                      }
                    }}
                    className="w-11 h-11 rounded-full btn-red flex items-center justify-center flex-shrink-0 shadow-sm"
                  >
                    {isPlayingThis ? (
                      <Pause className="w-5 h-5 fill-white" />
                    ) : (
                      <Play className="w-5 h-5 fill-white ms-0.5" />
                    )}
                  </button>
                  <div className="space-y-1 min-w-0">
                    <h3 className="text-base font-bold text-neutral-900 dark:text-white truncate">
                      {itemTitle}
                    </h3>
                    {itemDesc && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                        {itemDesc}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-2xs font-extrabold px-2.5 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                    {item.category}
                  </span>
                  <button
                    onClick={() => {
                      if (currentTrack?.id === item.id) {
                        togglePlayPause();
                      } else {
                        playTrack({
                          id: item.id,
                          title: itemTitle,
                          speaker: siteMetadata.channelName,
                          duration: '',
                          audioUrl: item.fileUrl,
                        });
                      }
                    }}
                    className="px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200"
                  >
                    {isPlayingThis ? t('buttons.pause') : t('buttons.play')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
