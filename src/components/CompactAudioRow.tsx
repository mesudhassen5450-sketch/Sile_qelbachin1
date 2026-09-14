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

  return (
    <div className="group bg-neutral-900 dark:bg-neutral-950 rounded-2xl border border-neutral-800 hover:border-red-900/50 transition-all duration-300 shadow-md hover:shadow-lg overflow-hidden">
      
      {/* Main Row */}
      <div className="flex items-center space-x-4 p-4">
        
        {/* Play Button */}
        <button
          onClick={toggleThisTrack}
          className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-red-900/50 hover:scale-105 active:scale-95"
        >
          {isThisPlaying ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current ml-0.5" />
          )}
        </button>

        {/* Metadata */}
        <div className="flex-1 min-w-0 space-y-1">
          <h4 className="text-base font-bold text-white truncate">
            {getLocalized(title)}
          </h4>
          <div className="flex items-center space-x-2 text-xs text-neutral-400">
            <span className="truncate">{speaker}</span>
            {kitabTitle && (
              <>
                <span>•</span>
                <span className="truncate">{kitabTitle}</span>
              </>
            )}
          </div>
        </div>

        {/* Duration */}
        {displayDuration > 0 && (
          <div className="flex-shrink-0 text-xs font-mono text-neutral-500">
            {formatTime(displayTime)} / {formatTime(displayDuration)}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {displayDuration > 0 && (
        <div className="h-1 bg-neutral-800">
          <div
            className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
