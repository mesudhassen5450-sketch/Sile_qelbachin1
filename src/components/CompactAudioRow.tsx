'use client';

import React from 'react';
import { Play, Pause } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import type { LocalizedString } from '@/context/LanguageContext';
import { useAudio } from '@/context/AudioContext';

interface CompactAudioRowProps {
  title: LocalizedString;
  speaker: string;
  kitabTitle?: string;
  audioUrl: string;
}

export default function CompactAudioRow({
  title,
  speaker,
  kitabTitle,
  audioUrl,
}: CompactAudioRowProps) {
  const { getLocalized } = useLanguage();
  const { currentTrack, isPlaying, currentTime, duration, playTrack, togglePlayPause } = useAudio();

  const isThisTrack = currentTrack?.audioUrl === audioUrl;
  const isThisPlaying = isThisTrack && isPlaying;
  const displayTime = isThisTrack ? currentTime : 0;
  const displayDuration = isThisTrack ? duration : 0;
  const progress = displayDuration > 0 ? (displayTime / displayDuration) * 100 : 0;

  const toggleThisTrack = () => {
    if (!audioUrl) return
    if (isThisTrack) {
      togglePlayPause();
      return;
    }
    playTrack({
      id: audioUrl,
      title,
      speaker,
      duration: '',
      audioUrl,
    });
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || time <= 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const comingSoon = !audioUrl;

  return (
    <div
      className={`group rounded-2xl border transition-all duration-300 overflow-hidden ${
        comingSoon ? 'opacity-80' : ''
      } bg-white border-[#e3e2e0] shadow-[0_1px_2px_rgba(55,53,47,0.04)] hover:border-[#A91F24]/35 hover:bg-[rgba(169,31,36,0.06)] hover:shadow-[0_8px_20px_-10px_rgba(169,31,36,0.18)] dark:bg-neutral-950 dark:border-neutral-800 dark:shadow-md dark:hover:border-red-500/40 dark:hover:bg-red-600/10 dark:hover:shadow-lg`}
    >
      
      {/* Main Row */}
      <div className="flex items-center gap-3 sm:space-x-4 sm:gap-0 p-3 sm:p-4">
        
        {/* Play Button */}
        <button
          onClick={toggleThisTrack}
          disabled={comingSoon}
          aria-disabled={comingSoon}
          className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full text-white flex items-center justify-center transition-all duration-300 shadow-md ${
            comingSoon
              ? 'bg-neutral-400 dark:bg-neutral-700 cursor-not-allowed'
              : 'bg-[#a91f24] hover:bg-[#8f171c] dark:bg-gradient-to-br dark:from-red-600 dark:to-red-700 dark:hover:from-red-500 dark:hover:to-red-600 dark:hover:shadow-red-900/50 hover:scale-105 active:scale-95'
          }`}
        >
          {isThisPlaying ? (
            <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
          ) : (
            <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />
          )}
        </button>

        {/* Metadata */}
        <div className="flex-1 min-w-0 space-y-0.5 sm:space-y-1">
          <h4 className="text-sm sm:text-base font-bold text-[#111827] dark:text-white truncate">
            {getLocalized(title)}
          </h4>
          <div className="flex items-center space-x-2 text-[11px] sm:text-xs text-[#6b7280] dark:text-neutral-400">
            <span className="truncate">{speaker}</span>
            {kitabTitle && (
              <>
                <span className="hidden sm:inline">•</span>
                <span className="truncate hidden sm:inline">{kitabTitle}</span>
              </>
            )}
            {comingSoon ? (
              <>
                <span>•</span>
                <span className="truncate text-amber-700/80 dark:text-amber-500/90">
                  {getLocalized({ en: 'Coming soon', am: 'በቅርብ', ar: 'قريباً' })}
                </span>
              </>
            ) : null}
          </div>
        </div>

        {/* Duration */}
        {displayDuration > 0 && (
          <div className="flex-shrink-0 text-[10px] sm:text-xs font-mono text-[#9b9a97] dark:text-neutral-500">
            {formatTime(displayTime)}
            <span className="hidden sm:inline"> / {formatTime(displayDuration)}</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {displayDuration > 0 && (
        <div className="h-1 bg-[#efefed] dark:bg-neutral-800">
          <div
            className="h-full bg-[#a91f24] dark:bg-gradient-to-r dark:from-red-600 dark:to-red-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
