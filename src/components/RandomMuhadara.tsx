'use client';

import React, { useState, useEffect } from 'react';
import { muhadarasData, Muhadara } from '@/data/channelData';
import { useAudio } from '@/context/AudioContext';
import { useLanguage } from '@/context/LanguageContext';
import { Play, Pause, Shuffle, Headphones, Calendar } from 'lucide-react';

export default function RandomMuhadara() {
  const [currentMuhadara, setCurrentMuhadara] = useState<Muhadara | null>(null);
  const { currentTrack, isPlaying, playTrack, togglePlayPause } = useAudio();
  const { t, getLocalized } = useLanguage();

  const pickRandom = () => {
    if (muhadarasData.length === 0) return;
    let randomIndex = Math.floor(Math.random() * muhadarasData.length);
    if (currentMuhadara && muhadarasData.length > 1) {
      while (muhadarasData[randomIndex].id === currentMuhadara.id) {
        randomIndex = Math.floor(Math.random() * muhadarasData.length);
      }
    }
    setCurrentMuhadara(muhadarasData[randomIndex]);
  };

  useEffect(() => {
    pickRandom();
  }, []);

  if (!currentMuhadara) return null;

  const isCurrentPlaying = currentTrack?.id === currentMuhadara.id && isPlaying;

  const handlePlay = () => {
    if (currentTrack?.id === currentMuhadara.id) {
      togglePlayPause();
    } else {
      playTrack(
        {
          id: currentMuhadara.id,
          title: getLocalized(currentMuhadara.title),
          speaker: getLocalized(currentMuhadara.speaker),
          duration: currentMuhadara.duration,
          audioUrl: currentMuhadara.audioUrl,
        },
        muhadarasData.map((m) => ({
          id: m.id,
          title: getLocalized(m.title),
          speaker: getLocalized(m.speaker),
          duration: m.duration,
          audioUrl: m.audioUrl,
        }))
      );
    }
  };

  return (
    <div className="bg-gradient-to-br from-red-900/10 via-neutral-900 to-neutral-950 text-white rounded-2xl p-6 sm:p-8 border border-red-900/30 shadow-xl relative overflow-hidden">
      
      {/* Decorative Motif */}
      <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none text-6xl">
        ☪
      </div>

      <div className="relative z-10 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-600/20 text-red-400 text-xs font-semibold border border-red-500/30">
            <Shuffle className="w-3.5 h-3.5" />
            <span>{t('sections.randomMuhadara')}</span>
          </div>

          <button
            onClick={pickRandom}
            className="inline-flex items-center space-x-2 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-3.5 py-1.5 rounded-lg border border-neutral-700 transition"
          >
            <Shuffle className="w-3.5 h-3.5 text-red-400" />
            <span>{t('sections.listenAnother')}</span>
          </button>
        </div>

        <div className="space-y-3">
          <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {getLocalized(currentMuhadara.title)}
          </h3>

          <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-300 font-medium">
            <span className="flex items-center space-x-1">
              <span>🎙️</span>
              <span>{getLocalized(currentMuhadara.speaker)}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Headphones className="w-3.5 h-3.5 text-red-400" />
              <span>{currentMuhadara.duration}</span>
            </span>
            <span className="flex items-center space-x-1 text-neutral-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>{currentMuhadara.date}</span>
            </span>
          </div>

          <p className="text-sm text-neutral-300 leading-relaxed max-w-2xl">
            ርዕስ፡ <strong className="text-white">{getLocalized(currentMuhadara.topic)}</strong>
          </p>
        </div>

        <div className="pt-4 flex items-center space-x-4">
          <button
            onClick={handlePlay}
            className="btn-red inline-flex items-center space-x-3 px-6 py-3 rounded-xl font-bold text-sm sm:text-base shadow-lg hover:scale-105 transition"
          >
            {isCurrentPlaying ? (
              <>
                <Pause className="w-5 h-5 fill-white" />
                <span>{t('buttons.pause')}</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-white" />
                <span>{t('buttons.play')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
