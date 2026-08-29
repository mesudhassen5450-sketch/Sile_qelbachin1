'use client';

import React, { useState } from 'react';
import { useAudio } from '@/context/AudioContext';
import { useLanguage } from '@/context/LanguageContext';
import TranslatedText from '@/components/TranslatedText';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Gauge, X } from 'lucide-react';

export default function AudioPlayerBar() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    playbackRate,
    playlist,
    togglePlayPause,
    seek,
    setVolume,
    setPlaybackSpeed,
    playNext,
    playPrev,
  } = useAudio();

  const { language } = useLanguage();

  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(0.8);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (!currentTrack || isDismissed) {
    return null;
  }

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds) || timeInSeconds < 0) return '00:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const handleMuteToggle = () => {
    if (isMuted) {
      setVolume(prevVolume);
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  };

  const speeds = [0.75, 1, 1.25, 1.5, 2];

  const hasNext = playlist.length > 0 && playlist.findIndex(t => t.id === currentTrack.id) < playlist.length - 1;
  const hasPrev = playlist.length > 0 && playlist.findIndex(t => t.id === currentTrack.id) > 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-2 sm:p-4 bg-white/95 dark:bg-neutral-900/95 border-t border-neutral-200 dark:border-neutral-800 shadow-2xl backdrop-blur-md transition-all duration-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 md:gap-4">
        
        {/* Track Metadata */}
        <div className="flex items-center justify-between w-full md:w-1/4 min-w-0 pr-2">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-red-700/10 dark:bg-red-600/20 text-red-600 dark:text-red-500 flex items-center justify-center font-bold text-lg flex-shrink-0 border border-red-600/20">
              🎧
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                <TranslatedText text={currentTrack.title} targetLang={language} />
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                <TranslatedText text={currentTrack.speaker} targetLang={language} /> {currentTrack.kitabTitle ? `• ${currentTrack.kitabTitle}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsDismissed(true)}
            className="md:hidden text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1"
            aria-label="Close Player"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Controls & Progress */}
        <div className="flex flex-col items-center w-full md:w-2/4">
          <div className="flex items-center justify-center space-x-4 mb-1">
            <button
              onClick={playPrev}
              disabled={!hasPrev}
              className={`p-1.5 rounded-full transition ${
                hasPrev
                  ? 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  : 'text-neutral-300 dark:text-neutral-700 cursor-not-allowed'
              }`}
              aria-label="Previous Track"
            >
              <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              onClick={togglePlayPause}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full btn-red flex items-center justify-center shadow-md focus:outline-none"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-white" />
              ) : (
                <Play className="w-5 h-5 fill-white ml-0.5" />
              )}
            </button>

            <button
              onClick={playNext}
              disabled={!hasNext}
              className={`p-1.5 rounded-full transition ${
                hasNext
                  ? 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  : 'text-neutral-300 dark:text-neutral-700 cursor-not-allowed'
              }`}
              aria-label="Next Track"
            >
              <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          <div className="flex items-center space-x-2 w-full text-xs text-neutral-500 dark:text-neutral-400 font-mono">
            <span>{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => seek(Number(e.target.value))}
              className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-red-600 dark:accent-red-500"
            />
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right Tools (Speed & Volume & Dismiss) */}
        <div className="hidden md:flex items-center justify-end space-x-3 w-1/4">
          
          {/* Speed Selector */}
          <div className="relative">
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
              title="Playback Speed"
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>{playbackRate}x</span>
            </button>

            {showSpeedMenu && (
              <div className="absolute bottom-full right-0 mb-2 w-24 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg py-1 z-50">
                {speeds.map((speed) => (
                  <button
                    key={speed}
                    onClick={() => {
                      setPlaybackSpeed(speed);
                      setShowSpeedMenu(false);
                    }}
                    className={`block w-full text-left px-3 py-1.5 text-xs ${
                      playbackRate === speed
                        ? 'font-bold text-red-600 dark:text-red-400 bg-neutral-50 dark:bg-neutral-700'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Volume Control */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleMuteToggle}
              className="p-1 text-neutral-600 dark:text-neutral-300 hover:text-red-600 transition"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-red-500" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => {
                setVolume(Number(e.target.value));
                if (isMuted) setIsMuted(false);
              }}
              className="w-16 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-red-600 dark:accent-red-500"
            />
          </div>

          {/* Dismiss Player */}
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition ml-1"
            title="Hide Player"
          >
            <X className="w-4 h-4" />
          </button>

        </div>
      </div>
    </div>
  );
}
