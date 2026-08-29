'use client';

import React, { useState } from 'react';
import { getMuhaderas, getGroupedAudiosByMonthYear, MediaItem } from '@/data/mediaStore';
import { useAudio } from '@/context/AudioContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  Headphones,
  Play,
  Pause,
  Download,
  Search,
  Calendar,
  Filter,
  X,
  Radio,
} from 'lucide-react';

export default function MuhaderaPage() {
  const { currentTrack, isPlaying, playTrack, togglePlayPause } = useAudio();
  const { language, t } = useLanguage();
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Hadith', 'Aqeedah', 'Tafseer', 'General'];

  const allAudios = getMuhaderas();
  const audioGroups = getGroupedAudiosByMonthYear();

  // Search and Category Filtering
  const filteredAudios = (searchQuery.trim() || selectedCategory !== 'All')
    ? allAudios.filter((audio) => {
        const matchesCategory =
          selectedCategory === 'All' ||
          (audio.category && audio.category.toLowerCase() === selectedCategory.toLowerCase());

        if (!matchesCategory) return false;

        if (!searchQuery.trim()) return true;

        const titleStr = (audio.title[language as 'am' | 'en' | 'ar'] || audio.title['am'] || audio.rawFilename || '').toLowerCase();
        const descStr = (audio.description[language as 'am' | 'en' | 'ar'] || audio.description['am'] || '').toLowerCase();
        const monthStr = (audio.monthYear || '').toLowerCase();
        const q = searchQuery.toLowerCase();

        return titleStr.includes(q) || descStr.includes(q) || monthStr.includes(q);
      })
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Header Banner */}
      <div className="portfolio-card p-6 sm:p-10 space-y-6 text-center sm:text-left">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 text-xs font-semibold border border-red-200 dark:border-red-900/40">
          <Radio className="w-3.5 h-3.5" />
          <span>ዲጂታል የድምፅ ትምህርቶች (Telegram Voice Messages Archive)</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white">
            {t('nav.muhadara')} ({allAudios.length} Voice Lectures)
          </h1>
          <p className="text-base text-neutral-600 dark:text-neutral-300 max-w-3xl leading-relaxed">
            በቴሌግራም ቻናላችን ከተለቀቁ 2024 - 2026 ሙሉ የድምፅ ድርሶችና የቀልብ ማስታወሻዎች መሐከል የተመረጡትን እዚህ ያዳምጡ።
          </p>
        </div>

        {/* Real-time Search & Category Filters */}
        <div className="space-y-4 pt-2">
          <div className="relative max-w-xl">
            <Search className="w-5 h-5 text-neutral-400 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="ድምፅ ድርሶችን በርዕስ፣ በወቅት ወይም በወር ይፈልጉ (Search audio lectures...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-10 py-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-600 shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-3.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center space-x-1.5 mr-2">
              <Filter className="w-3.5 h-3.5 text-red-500" />
              <span>ምድቦች:</span>
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
        </div>
      </div>

      {/* Render Search/Filter Results OR Chronological Month/Year View */}
      {filteredAudios ? (
        <section className="space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
              የፍለጋና ምድብ ውጤቶች (Filtered Audio Lectures: {filteredAudios.length})
            </h2>
          </div>

          <div className="portfolio-card divide-y divide-neutral-100 dark:divide-neutral-800 overflow-hidden">
            {filteredAudios.map((audio) => (
              <AudioTrackRow
                key={audio.id}
                audio={audio}
                language={language}
                t={t}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                playTrack={playTrack}
                togglePlayPause={togglePlayPause}
              />
            ))}
          </div>
        </section>
      ) : (
        <div className="space-y-12">
          {audioGroups.map((group) => (
            <section key={group.monthYear} className="space-y-4">
              <div className="sticky top-20 z-10 bg-neutral-50/90 dark:bg-neutral-950/90 backdrop-blur-md py-3 px-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-red-600" />
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                    {group.monthYear}
                  </h2>
                </div>
                <span className="text-xs font-mono text-neutral-500 bg-neutral-200 dark:bg-neutral-800 px-3 py-1 rounded-full">
                  {group.items.length} Audio Lessons
                </span>
              </div>

              <div className="portfolio-card divide-y divide-neutral-100 dark:divide-neutral-800 overflow-hidden">
                {group.items.map((audio) => (
                  <AudioTrackRow
                    key={audio.id}
                    audio={audio}
                    language={language}
                    t={t}
                    currentTrack={currentTrack}
                    isPlaying={isPlaying}
                    playTrack={playTrack}
                    togglePlayPause={togglePlayPause}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

    </div>
  );
}

interface AudioTrackRowProps {
  audio: MediaItem;
  language: string;
  t: (key: string) => string;
  currentTrack: any;
  isPlaying: boolean;
  playTrack: any;
  togglePlayPause: any;
}

function AudioTrackRow({
  audio,
  language,
  t,
  currentTrack,
  isPlaying,
  playTrack,
  togglePlayPause,
}: AudioTrackRowProps) {
  const isPlayingThis = currentTrack?.id === audio.id && isPlaying;

  const displayTitle =
    audio.title[language as 'am' | 'en' | 'ar'] || audio.title['am'] || audio.rawFilename || 'የድምፅ ድርስ';
  const displayDesc =
    audio.description[language as 'am' | 'en' | 'ar'] || audio.description['am'] || '';

  const handlePlayClick = () => {
    if (currentTrack?.id === audio.id) {
      togglePlayPause();
    } else {
      playTrack({
        id: audio.id,
        title: displayTitle,
        speaker: 'እስታዝ አቡ ዐብደላህ',
        duration: audio.fileSize || '35:00',
        audioUrl: audio.fileUrl,
      });
    }
  };

  return (
    <div
      className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition duration-300 ${
        isPlayingThis
          ? 'bg-red-50/70 dark:bg-red-950/30 border-l-4 border-red-600'
          : 'hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50'
      }`}
    >
      <div className="flex items-center space-x-4 min-w-0">
        <button
          onClick={handlePlayClick}
          className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-md transition transform hover:scale-105 ${
            isPlayingThis ? 'bg-red-700 ring-4 ring-red-600/30 animate-pulse' : 'btn-red'
          }`}
        >
          {isPlayingThis ? (
            <Pause className="w-5 h-5 fill-white" />
          ) : (
            <Play className="w-5 h-5 fill-white ml-0.5" />
          )}
        </button>

        <div className="space-y-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="text-2xs font-extrabold uppercase text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950 px-2 py-0.5 rounded">
              {audio.category}
            </span>
            {audio.date && (
              <span className="text-2xs font-mono text-neutral-400">
                {audio.date}
              </span>
            )}
          </div>

          <h3 className="text-base font-bold text-neutral-900 dark:text-white truncate">
            {displayTitle}
          </h3>

          {displayDesc && displayDesc !== displayTitle && (
            <p className="text-xs text-neutral-600 dark:text-neutral-300 truncate max-w-2xl">
              🎙️ እስታዝ አቡ ዐብደላህ • {displayDesc}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-3 justify-between sm:justify-end">
        {audio.fileSize && (
          <span className="text-2xs font-mono text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700">
            📦 {audio.fileSize}
          </span>
        )}

        <button
          onClick={handlePlayClick}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
            isPlayingThis
              ? 'bg-red-600 text-white'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200'
          }`}
        >
          {isPlayingThis ? t('buttons.pause') : t('buttons.play')}
        </button>

        <a
          href={audio.fileUrl}
          download
          className="p-2.5 rounded-xl text-neutral-400 hover:text-red-600 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
          title="Download Audio (.ogg/.mp3)"
        >
          <Download className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
