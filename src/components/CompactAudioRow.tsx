'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import type { LocalizedString } from '@/context/LanguageContext';

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setAudioDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  return (
    <div className="group bg-neutral-900 dark:bg-neutral-950 rounded-2xl border border-neutral-800 hover:border-red-900/50 transition-all duration-300 shadow-md hover:shadow-lg overflow-hidden">
      
      {/* Main Row */}
      <div className="flex items-center space-x-4 p-4">
        
        {/* Play Button */}
        <button
          onClick={togglePlayPause}
          className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-red-900/50 hover:scale-105 active:scale-95"
        >
          {isPlaying ? (
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
        {audioDuration > 0 && (
          <div className="flex-shrink-0 text-xs font-mono text-neutral-500">
            {formatTime(currentTime)} / {formatTime(audioDuration)}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {audioDuration > 0 && (
        <div className="h-1 bg-neutral-800">
          <div
            className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Hidden Audio Element */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
    </div>
  );
}
