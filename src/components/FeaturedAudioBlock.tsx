'use client';

import React from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import type { LocalizedString } from '@/context/LanguageContext';
import { useAudio } from '@/context/AudioContext';

interface FeaturedAudioBlockProps {
  title: LocalizedString;
  speaker: string;
  duration?: string;
  description?: string;
  audioUrl: string;
  category?: string | LocalizedString;
}

export default function FeaturedAudioBlock({
  title,
  speaker,
  duration,
  description,
  audioUrl,
  category,
}: FeaturedAudioBlockProps) {
  const { getLocalized, t } = useLanguage();
  const { currentTrack, isPlaying, currentTime, duration: globalDuration, playTrack, togglePlayPause } = useAudio();

  const isThisTrack = currentTrack?.audioUrl === audioUrl;
  const isThisPlaying = isThisTrack && isPlaying;
  const displayTime = isThisTrack ? currentTime : 0;
  const displayDuration = isThisTrack && globalDuration ? globalDuration : 0;

  const toggleThisTrack = () => {
    if (isThisTrack) {
      togglePlayPause();
      return;
    }
    playTrack({
      id: audioUrl,
      title,
      speaker,
      duration: duration || '',
      audioUrl,
    });
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || time <= 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = displayDuration > 0 ? (displayTime / displayDuration) * 100 : 0;
  const categoryLabel = typeof category === 'string' ? category : category ? getLocalized(category) : '';

  return (
    <div className="relative group bg-gradient-to-br from-neutral-900 via-neutral-900 to-red-950/40 rounded-3xl overflow-hidden border border-neutral-800 hover:border-red-900/50 transition-all duration-300 shadow-xl hover:shadow-2xl">
      
      {/* Background Pattern Overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 20px)`
        }} />
      </div>

      <div className="relative z-10 p-8 space-y-6">
        
        {/* Top Badge */}
        {categoryLabel && (
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-red-950/60 text-red-400 border border-red-800/60 backdrop-blur-sm">
              <Volume2 className="w-3.5 h-3.5 mr-1.5" />
              {categoryLabel}
            </span>
            {duration && (
              <span className="text-xs font-mono text-neutral-500">
                {duration}
              </span>
            )}
          </div>
        )}

        {/* Title */}
        <div className="space-y-3">
          <h3 className="text-2xl sm:text-3xl font-bold text-white leading-tight tracking-tight">
            {getLocalized(title)}
          </h3>
          
          {/* Speaker Info */}
          <div className="flex items-start space-x-2 text-sm text-neutral-400">
            <span className="flex-shrink-0 mt-0.5">🎙</span>
            <p className="leading-relaxed">{speaker}</p>
          </div>

          {/* Description */}
          {description && (
            <p className="text-sm text-neutral-500 leading-relaxed pt-2">
              {description}
            </p>
          )}
        </div>

        {/* Player Controls */}
        <div className="space-y-4 pt-4 border-t border-neutral-800/50">
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="h-2 bg-neutral-800/60 rounded-full overflow-hidden backdrop-blur-sm">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-neutral-500">
              <span>{formatTime(displayTime)}</span>
              <span>{displayDuration > 0 ? formatTime(displayDuration) : duration || '0:00'}</span>
            </div>
          </div>

          {/* Play Button */}
          <button
            onClick={toggleThisTrack}
            className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-red-900/50 hover:scale-[1.02] active:scale-[0.98]"
          >
            {isThisPlaying ? (
              <>
                <Pause className="w-6 h-6 fill-current" />
                <span className="text-lg">{t('buttons.pauseAudio')}</span>
              </>
            ) : (
              <>
                <Play className="w-6 h-6 fill-current" />
                <span className="text-lg">{t('buttons.playAudio')}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
