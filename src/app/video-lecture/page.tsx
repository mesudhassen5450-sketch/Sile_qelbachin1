'use client';

import React, { useState } from 'react';
import { getVideos, getGroupedVideosByMonthYear, MediaItem } from '@/data/mediaStore';
import { useLanguage } from '@/context/LanguageContext';
import {
  Video,
  Play,
  Download,
  Search,
  Calendar,
  X,
  Sparkles,
  Film,
} from 'lucide-react';

export default function VideoLecturePage() {
  const { language, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeVideoModal, setActiveVideoModal] = useState<MediaItem | null>(null);

  const allVideos = getVideos();
  const videoGroups = getGroupedVideosByMonthYear();

  // Real-time Search Filtering
  const filteredVideos = searchQuery.trim()
    ? allVideos.filter((v) => {
        const titleStr = (v.title[language as 'am' | 'en' | 'ar'] || v.title['am'] || v.rawFilename || '').toLowerCase();
        const descStr = (v.description[language as 'am' | 'en' | 'ar'] || v.description['am'] || '').toLowerCase();
        const monthStr = (v.monthYear || '').toLowerCase();
        const q = searchQuery.toLowerCase();
        return titleStr.includes(q) || descStr.includes(q) || monthStr.includes(q);
      })
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Header Banner */}
      <div className="portfolio-card p-6 sm:p-10 space-y-6 text-center sm:text-left">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 text-xs font-semibold border border-red-200 dark:border-red-900/40">
          <Film className="w-3.5 h-3.5" />
          <span>ዲጂታል የቪዲዮ ቤተ-መጽሐፍት (Telegram Video Archive)</span>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white">
            {t('nav.videos')} ({allVideos.length} Videos)
          </h1>
          <p className="text-base text-neutral-600 dark:text-neutral-300 max-w-3xl leading-relaxed">
            በቴሌግራም ቻናላችን ከተለቀቁ 2024 - 2026 ሙሉ አጫጭርና ረጅም ትምህርታዊ ቪዲዮዎች መሐከል የተመረጡትን እዚህ ይመልከቱ።
          </p>
        </div>

        {/* Real-time Search Bar */}
        <div className="relative max-w-xl">
          <Search className="w-5 h-5 text-neutral-400 absolute left-4 top-3.5" />
          <input
            type="text"
            placeholder="ቪዲዮዎችን በርዕስ፣ በወቅት ወይም በወር ይፈልጉ (Search videos...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-600 shadow-sm"
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
      </div>

      {/* Video Modal Player */}
      {activeVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 text-white rounded-3xl max-w-4xl w-full p-6 space-y-4 relative border border-neutral-800 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center space-x-2 truncate pr-4">
                <Video className="w-5 h-5 text-red-500 flex-shrink-0" />
                <h3 className="text-lg font-bold truncate">
                  {activeVideoModal.title[language as 'am' | 'en' | 'ar'] || activeVideoModal.rawFilename || 'ቪዲዮ ትምህርት'}
                </h3>
              </div>
              <button
                onClick={() => setActiveVideoModal(null)}
                className="p-2 text-neutral-400 hover:text-white rounded-full bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl relative">
              <video
                src={activeVideoModal.fileUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between pt-2 text-xs">
              <span className="text-neutral-400 font-mono">
                {activeVideoModal.fileSize ? `📦 Size: ${activeVideoModal.fileSize}` : ''}
              </span>
              <a
                href={activeVideoModal.fileUrl}
                download
                className="btn-red px-5 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>ቪዲዮ አውርድ (Download Video)</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Search Result View OR Chronological Month/Year View */}
      {filteredVideos ? (
        <section className="space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
              የፍለጋ ውጤቶች (Search Results: {filteredVideos.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                language={language}
                onWatch={() => setActiveVideoModal(video)}
              />
            ))}
          </div>
        </section>
      ) : (
        <div className="space-y-12">
          {videoGroups.map((group) => (
            <section key={group.monthYear} className="space-y-6">
              <div className="sticky top-20 z-10 bg-neutral-50/90 dark:bg-neutral-950/90 backdrop-blur-md py-3 px-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-red-600" />
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                    {group.monthYear}
                  </h2>
                </div>
                <span className="text-xs font-mono text-neutral-500 bg-neutral-200 dark:bg-neutral-800 px-3 py-1 rounded-full">
                  {group.items.length} Videos
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {group.items.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    language={language}
                    onWatch={() => setActiveVideoModal(video)}
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

interface VideoCardProps {
  video: MediaItem;
  language: string;
  onWatch: () => void;
}

function VideoCard({ video, language, onWatch }: VideoCardProps) {
  const displayTitle =
    video.title[language as 'am' | 'en' | 'ar'] || video.title['am'] || video.rawFilename || 'ቪዲዮ';
  const displayDesc =
    video.description[language as 'am' | 'en' | 'ar'] || video.description['am'] || '';

  return (
    <div className="portfolio-card overflow-hidden flex flex-col justify-between hover:border-red-600/40 transition duration-300">
      
      {/* HTML5 Video Player / Thumbnail Preview */}
      <div className="relative aspect-video bg-black overflow-hidden group">
        <video
          src={video.fileUrl}
          preload="metadata"
          className="w-full h-full object-cover"
        />

        <div
          onClick={onWatch}
          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full btn-red flex items-center justify-center shadow-xl transform group-hover:scale-110 transition">
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </div>
        </div>

        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-white text-2xs font-mono">
          {video.fileSize || 'MP4'}
        </div>
      </div>

      {/* Details */}
      <div className="p-5 space-y-3 flex-grow flex flex-col justify-between">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center space-x-1 text-2xs uppercase tracking-wider text-red-600 font-bold">
              <Sparkles className="w-3 h-3" />
              <span>{video.category}</span>
            </span>
            {video.date && (
              <span className="text-2xs font-mono text-neutral-400">
                {video.date}
              </span>
            )}
          </div>

          <h3 className="text-base font-bold text-neutral-900 dark:text-white line-clamp-2 leading-snug">
            {displayTitle}
          </h3>

          {displayDesc && displayDesc !== displayTitle && (
            <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2 leading-relaxed">
              {displayDesc}
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <button
            onClick={onWatch}
            className="btn-red px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>ተመልከት (Watch)</span>
          </button>

          <a
            href={video.fileUrl}
            download
            className="p-2 text-neutral-400 hover:text-red-600 transition"
            title="Download Video"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>

    </div>
  );
}
