'use client'

import React from 'react'
import { Play, Pause, Volume2 } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import type { LocalizedString } from '@/context/LanguageContext'
import { useAudio } from '@/context/AudioContext'

interface FeaturedAudioBlockProps {
  title: LocalizedString
  speaker: string
  duration?: string
  description?: string
  audioUrl: string
  category?: string | LocalizedString
}

function cleanDisplayText(s: string): string {
  return s
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/t\.me\/\S+/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/** Light: premium daylight card. Dark: moderate neutral card (no heavy maroon). */
export default function FeaturedAudioBlock({
  title,
  speaker,
  duration,
  description,
  audioUrl,
  category,
}: FeaturedAudioBlockProps) {
  const { getLocalized, t } = useLanguage()
  const { currentTrack, isPlaying, currentTime, duration: globalDuration, playTrack, togglePlayPause } =
    useAudio()

  const isThisTrack = currentTrack?.audioUrl === audioUrl
  const isThisPlaying = isThisTrack && isPlaying
  const displayTime = isThisTrack ? currentTime : 0
  const displayDuration = isThisTrack && globalDuration ? globalDuration : 0

  const toggleThisTrack = () => {
    if (isThisTrack) {
      togglePlayPause()
      return
    }
    playTrack({
      id: audioUrl,
      title,
      speaker,
      duration: duration || '',
      audioUrl,
    })
  }

  const formatTime = (time: number) => {
    if (isNaN(time) || time <= 0) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const progress = displayDuration > 0 ? (displayTime / displayDuration) * 100 : 0
  const categoryLabel = typeof category === 'string' ? category : category ? getLocalized(category) : ''
  const titleText = cleanDisplayText(getLocalized(title))
  const descText = cleanDisplayText((description || '').trim())
  const speakerText = cleanDisplayText((speaker || '').trim())
  const fingerprint = (s: string) =>
    s
      .normalize('NFKC')
      .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '')
      .replace(/[^\p{L}\p{N}]+/gu, '')
      .toLowerCase()
  const nearlySame = (a: string, b: string) => {
    const fa = fingerprint(a)
    const fb = fingerprint(b)
    if (!fa || !fb) return false
    if (fa === fb) return true
    if (fa.startsWith(fb) || fb.startsWith(fa)) return true
    const shorter = fa.length <= fb.length ? fa : fb
    const longer = fa.length > fb.length ? fa : fb
    return shorter.length >= 10 && longer.includes(shorter)
  }
  const showSpeaker =
    Boolean(speakerText) &&
    !nearlySame(speakerText, titleText) &&
    !nearlySame(speakerText, descText) &&
    speakerText.toLowerCase() !== categoryLabel.toLowerCase()

  return (
    <div className="group portfolio-card p-5 sm:p-7 space-y-4 sm:space-y-5 overflow-hidden min-w-0">
      <div className="flex items-center justify-between gap-2 min-w-0">
        {categoryLabel ? (
          <span className="inline-flex items-center max-w-full truncate px-3 py-1 rounded-full text-[11px] font-semibold bg-[#efefed] dark:bg-neutral-800 text-[#A91F24] dark:text-red-400 border border-[#e3e2e0] dark:border-neutral-700 group-hover:bg-[#A91F24]/10 group-hover:border-[#A91F24]/30 transition-colors">
            <Volume2 className="w-3.5 h-3.5 mr-1.5 shrink-0" />
            <span className="truncate">{categoryLabel}</span>
          </span>
        ) : (
          <span />
        )}
        {duration ? (
          <span className="text-xs font-mono text-[#6b7280] dark:text-neutral-500 shrink-0">{duration}</span>
        ) : null}
      </div>

      <div className="space-y-2 min-w-0">
        <h3 className="text-base sm:text-xl font-bold text-[#111827] dark:text-white leading-snug tracking-tight break-words [overflow-wrap:anywhere] line-clamp-3">
          {titleText}
        </h3>
        {showSpeaker ? (
          <div className="flex items-start gap-2 text-sm font-medium text-[#5f5e5b] dark:text-neutral-400 min-w-0">
            <span className="shrink-0 mt-0.5">🎙</span>
            <p className="leading-relaxed break-words [overflow-wrap:anywhere] line-clamp-2 min-w-0">
              {speakerText}
            </p>
          </div>
        ) : null}
      </div>

      <div className="space-y-3 pt-3 border-t border-[#e3e2e0] dark:border-neutral-800">
        <div className="space-y-1.5">
          <div className="h-1.5 bg-[#efefed] dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#A91F24] dark:bg-red-600 transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-[#6b7280] dark:text-neutral-500">
            <span>{formatTime(displayTime)}</span>
            <span>{displayDuration > 0 ? formatTime(displayDuration) : duration || '0:00'}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleThisTrack}
          className="w-full flex items-center justify-center gap-2.5 bg-[#A91F24] hover:bg-[#8F171C] dark:bg-red-600 dark:hover:bg-red-700 text-white text-sm font-bold py-3.5 px-5 rounded-2xl transition shadow-sm active:scale-[0.98]"
        >
          {isThisPlaying ? (
            <>
              <Pause className="w-5 h-5 fill-current" />
              <span>{t('buttons.pauseAudio')}</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current" />
              <span>{t('buttons.playAudio')}</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
