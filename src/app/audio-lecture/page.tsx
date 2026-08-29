'use client';

import React, { useState } from 'react';
import { liveLecturesData } from '@/data/channelData';
import { getAudios, getContentByCategory } from '@/data/mediaStore';
import { useAudio } from '@/context/AudioContext';
import { useLanguage } from '@/context/LanguageContext';
import LiveAudioRoom from '@/components/LiveAudioRoom';
import { Radio, Calendar, Headphones, Play, Pause, Clock, Filter } from 'lucide-react';

export default function AudioLecturePage() {
  const { currentTrack, isPlaying, playTrack, togglePlayPause } = useAudio();
  const { language, t, getLocalized } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Hadith', 'Aqeedah', 'Tafseer', 'General'];

  const upcoming = liveLecturesData.filter((l) => l.status === 'upcoming');
  const previousStatic = liveLecturesData.filter((l) => l.status === 'ended');

  // Pull dynamically from mediaStore.ts
  const mediaAudios = getAudios();

  const filteredMediaAudios = selectedCategory === 'All'
    ? mediaAudios
    : getContentByCategory(selectedCategory).filter(i => i.type === 'audio');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* Header Banner */}
      <div className="portfolio-card p-6 sm:p-10 space-y-4 text-center sm:text-left">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 text-xs font-semibold border border-red-200 dark:border-red-900/40">
          <Radio className="w-3.5 h-3.5" />
          <span>የቀጥታና የተቀረፁ ድምፅ ትምህርቶች (Audio Lecture Platform)</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white">
          {t('nav.audioLecture')}
        </h1>
        <p className="text-base text-neutral-600 dark:text-neutral-300 max-w-3xl leading-relaxed">
          በTelegram ቻናላችን በቀጥታ የሚተላለፉ ትምህርቶችን፣ የሚመጡ መርሃ-ግብሮችንና ያለፉ የቀጥታ ስርጭት የተቀረፁ ትምህርቶችን እዚህ ያዳምጡ።
        </p>
      </div>

      {/* 🔴 1. INTERACTIVE TELEGRAM / TIKTOK VOICE ROOM COMPONENT */}
      <section className="space-y-4">
        <LiveAudioRoom />
      </section>

      {/* Dynamic Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center space-x-1.5 mr-2">
          <Filter className="w-3.5 h-3.5 text-red-500" />
          <span>ምድቦች (Category Filter):</span>
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

      {/* 🕐 2. UPCOMING LECTURES SECTION */}
      <section className="space-y-4">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-red-600" />
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
            {t('audioLecture.upcoming')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {upcoming.map((lecture) => (
            <div
              key={lecture.id}
              className="portfolio-card p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs font-semibold border border-amber-200 dark:border-amber-900/40">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {getLocalized(lecture.scheduledTime)}
                  </span>
                </span>
                <span className="text-2xs uppercase font-extrabold text-amber-600 tracking-wider">
                  Upcoming
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                  {getLocalized(lecture.title)}
                </h3>
                <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                  🎙️ መምህር፡ {getLocalized(lecture.speaker)}
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-300">
                  {getLocalized(lecture.description)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 🎧 3. PREVIOUS LECTURES & TELEGRAM AUDIO ARCHIVE SECTION */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Headphones className="w-5 h-5 text-red-600" />
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
              {t('audioLecture.previous')}
            </h2>
          </div>
          <span className="text-xs font-mono text-neutral-400">
            {filteredMediaAudios.length + previousStatic.length} Tracks Available
          </span>
        </div>

        <div className="portfolio-card divide-y divide-neutral-100 dark:divide-neutral-800 overflow-hidden">
          {/* Static Lectures */}
          {previousStatic.map((lecture) => {
            const isPlayingThis = currentTrack?.id === lecture.id && isPlaying;
            return (
              <div
                key={lecture.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50 transition"
              >
                <div className="flex items-center space-x-4 min-w-0">
                  <button
                    onClick={() => {
                      if (currentTrack?.id === lecture.id) {
                        togglePlayPause();
                      } else {
                        playTrack({
                          id: lecture.id,
                          title: getLocalized(lecture.title),
                          speaker: getLocalized(lecture.speaker),
                          duration: '45:00',
                          audioUrl: lecture.audioUrl || '/audio/muhadara/muhadara-01.mp3'
                        });
                      }
                    }}
                    className="w-11 h-11 rounded-full btn-red flex items-center justify-center flex-shrink-0 shadow-sm"
                  >
                    {isPlayingThis ? (
                      <Pause className="w-5 h-5 fill-white" />
                    ) : (
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    )}
                  </button>
                  <div className="space-y-1 min-w-0">
                    <h3 className="text-base font-bold text-neutral-900 dark:text-white truncate">
                      {getLocalized(lecture.title)}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      🎙️ {getLocalized(lecture.speaker)} • {getLocalized(lecture.description)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (currentTrack?.id === lecture.id) {
                      togglePlayPause();
                    } else {
                      playTrack({
                        id: lecture.id,
                        title: getLocalized(lecture.title),
                        speaker: getLocalized(lecture.speaker),
                        duration: '45:00',
                        audioUrl: lecture.audioUrl || '/audio/muhadara/muhadara-01.mp3'
                      });
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200"
                >
                  {isPlayingThis ? t('buttons.pause') : t('buttons.play')}
                </button>
              </div>
            );
          })}

          {/* Dynamic MediaStore Audios */}
          {filteredMediaAudios.map((item) => {
            const isPlayingThis = currentTrack?.id === item.id && isPlaying;
            const itemTitle = item.title[language as 'am' | 'en' | 'ar'] || item.title['am'] || 'ድምፅ ትምህርት';
            const itemDesc = item.description[language as 'am' | 'en' | 'ar'] || item.description['am'] || 'በቴሌግራም የተጋራ የድምፅ ትምህርት';

            return (
              <div
                key={item.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50 transition"
              >
                <div className="flex items-center space-x-4 min-w-0">
                  <button
                    onClick={() => {
                      if (currentTrack?.id === item.id) {
                        togglePlayPause();
                      } else {
                        playTrack({
                          id: item.id,
                          title: itemTitle,
                          speaker: 'እስታዝ አቡ ዐብደላህ',
                          duration: '35:00',
                          audioUrl: item.fileUrl,
                        });
                      }
                    }}
                    className="w-11 h-11 rounded-full btn-red flex items-center justify-center flex-shrink-0 shadow-sm"
                  >
                    {isPlayingThis ? (
                      <Pause className="w-5 h-5 fill-white" />
                    ) : (
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    )}
                  </button>
                  <div className="space-y-1 min-w-0">
                    <h3 className="text-base font-bold text-neutral-900 dark:text-white truncate">
                      {itemTitle}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      🎙️ እስታዝ አቡ ዐብደላህ • {itemDesc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
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
                          speaker: 'እስታዝ አቡ ዐብደላህ',
                          duration: '35:00',
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
