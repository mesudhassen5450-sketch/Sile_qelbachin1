'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Download,
  Maximize,
  Minimize,
  Pause,
  Play,
  Share2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import ShareSheet from '@/components/ShareSheet'
import { formatDuration } from '@/lib/mediaDuration'
import { useLanguage } from '@/context/LanguageContext'

const MEDIUM_VOLUME = 0.55

type VideoPlayerModalProps = {
  open: boolean
  src: string
  title: string
  dateLabel?: string
  onClose: () => void
  onPlayStart?: () => void
}

export default function VideoPlayerModal({
  open,
  src,
  title,
  dateLabel,
  onClose,
  onPlayStart,
}: VideoPlayerModalProps) {
  const { getLocalized } = useLanguage()
  const videoRef = useRef<HTMLVideoElement>(null)
  const shellRef = useRef<HTMLDivElement>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(MEDIUM_VOLUME)
  const [current, setCurrent] = useState(0)
  const [total, setTotal] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const bumpControls = useCallback(() => {
    setShowControls(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => {
      if (playing) setShowControls(false)
    }, 2800)
  }, [playing])

  useEffect(() => {
    if (!open) return
    const el = videoRef.current
    if (!el) return
    el.volume = MEDIUM_VOLUME
    el.muted = false
    setVolume(MEDIUM_VOLUME)
    setMuted(false)
    setCurrent(0)
    onPlayStart?.()
    void el.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
    bumpControls()
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [open, src, onPlayStart, bumpControls])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === 'Escape') onClose()
      if (e.key === ' ' || e.key === 'k') {
        e.preventDefault()
        togglePlay()
      }
      if (e.key === 'm') toggleMute()
      if (e.key === 'f') void toggleFullscreen()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, playing, muted])

  if (!open) return null

  const togglePlay = () => {
    const el = videoRef.current
    if (!el) return
    if (el.paused) {
      el.muted = muted
      el.volume = volume
      void el.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
    } else {
      el.pause()
      setPlaying(false)
    }
    bumpControls()
  }

  const toggleMute = () => {
    const el = videoRef.current
    const next = !muted
    setMuted(next)
    if (el) el.muted = next
    bumpControls()
  }

  const onSeek = (pct: number) => {
    const el = videoRef.current
    if (!el || !total) return
    el.currentTime = (pct / 100) * total
    setCurrent(el.currentTime)
    bumpControls()
  }

  const onVolume = (v: number) => {
    setVolume(v)
    setMuted(v === 0)
    const el = videoRef.current
    if (el) {
      el.volume = v
      el.muted = v === 0
    }
    bumpControls()
  }

  const toggleFullscreen = async () => {
    const shell = shellRef.current
    if (!shell) return
    try {
      if (!document.fullscreenElement) {
        await shell.requestFullscreen()
        setFullscreen(true)
      } else {
        await document.exitFullscreen()
        setFullscreen(false)
      }
    } catch {
      /* ignore */
    }
    bumpControls()
  }

  const progress = total > 0 ? (current / total) * 100 : 0

  return (
    <>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6">
        <button
          type="button"
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
          aria-label="Close"
          onClick={onClose}
        />

        <div
          ref={shellRef}
          className="relative w-full max-w-5xl rounded-3xl overflow-hidden border border-[#D4AF37]/45 bg-neutral-950 shadow-2xl shadow-black/60"
          onMouseMove={bumpControls}
          onTouchStart={bumpControls}
        >
          {/* Title bar */}
          <div
            className={`absolute top-0 inset-x-0 z-20 flex items-start justify-between gap-3 p-4 sm:p-5 bg-gradient-to-b from-black/90 to-transparent transition-opacity duration-300 ${
              showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
                {getLocalized({ en: 'Now playing', am: 'በመጫወት ላይ', ar: 'يُشغَّل الآن' })}
              </p>
              <h3 className="text-base sm:text-lg font-bold text-white line-clamp-2 mt-0.5">
                {title}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="btn-interactive shrink-0 p-2.5 rounded-full bg-white/10 border border-white/15 text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Video */}
          <div className="relative aspect-video bg-black">
            <video
              ref={videoRef}
              src={src}
              playsInline
              className="w-full h-full object-contain"
              onClick={togglePlay}
              onTimeUpdate={() => {
                const el = videoRef.current
                if (!el) return
                setCurrent(el.currentTime)
                if (el.duration) setTotal(el.duration)
              }}
              onLoadedMetadata={() => {
                const el = videoRef.current
                if (el?.duration) setTotal(el.duration)
              }}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => setPlaying(false)}
            />

            {!playing ? (
              <button
                type="button"
                onClick={togglePlay}
                className="btn-interactive absolute inset-0 m-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#D4AF37] text-neutral-950 flex items-center justify-center shadow-2xl border-2 border-white/30"
                aria-label="Play"
              >
                <Play className="w-8 h-8 fill-current ml-1" />
              </button>
            ) : null}

            {/* Bottom controls */}
            <div
              className={`absolute bottom-0 inset-x-0 z-20 p-3 sm:p-4 bg-gradient-to-t from-black via-black/80 to-transparent transition-opacity duration-300 ${
                showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              {/* Seek */}
              <input
                type="range"
                min={0}
                max={100}
                step={0.1}
                value={progress}
                onChange={e => onSeek(Number(e.target.value))}
                className="w-full h-1.5 mb-3 accent-[#D4AF37] cursor-pointer"
                aria-label="Seek"
              />

              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="btn-interactive p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20"
                >
                  {playing ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={toggleMute}
                  className="btn-interactive p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20"
                >
                  {muted || volume === 0 ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>

                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={muted ? 0 : volume}
                  onChange={e => onVolume(Number(e.target.value))}
                  className="w-16 sm:w-24 h-1 accent-[#D4AF37] hidden sm:block"
                  aria-label="Volume"
                />

                <span className="text-[11px] font-mono text-white/80 tabular-nums">
                  {formatDuration(current) || '0:00'} / {formatDuration(total) || '0:00'}
                </span>

                <div className="flex-1" />

                {dateLabel ? (
                  <span className="hidden md:inline text-[10px] font-mono text-white/50">
                    {dateLabel}
                  </span>
                ) : null}

                <button
                  type="button"
                  onClick={() => setShareOpen(true)}
                  className="btn-interactive p-2.5 rounded-xl bg-white/10 text-white hover:bg-[#D4AF37]/30 hover:text-[#F0D77B]"
                  aria-label="Share"
                >
                  <Share2 className="w-4 h-4" />
                </button>

                <a
                  href={src}
                  download
                  className="btn-interactive inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">
                    {getLocalized({ en: 'Download', am: 'አውርድ', ar: 'تحميل' })}
                  </span>
                </a>

                <button
                  type="button"
                  onClick={() => void toggleFullscreen()}
                  className="btn-interactive p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20"
                  aria-label="Fullscreen"
                >
                  {fullscreen ? (
                    <Minimize className="w-4 h-4" />
                  ) : (
                    <Maximize className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={title}
        url={typeof window !== 'undefined' ? window.location.href : undefined}
      />
    </>
  )
}
