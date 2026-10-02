'use client'

import { useEffect, useState } from 'react'

/** Format seconds as m:ss or h:mm:ss */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return ''
  const s = Math.floor(seconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }
  return `${m}:${sec.toString().padStart(2, '0')}`
}

/**
 * Legacy catalog wrongly stored publish clock time (HH:MM from date) in `fileSize`.
 * Real sizes look like "12.4 MB"; clock times look like "11:19".
 */
export function isFakeDurationLabel(value?: string | null): boolean {
  if (!value) return true
  const v = value.trim()
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(v)) return true
  return false
}

export function isShortMedia(seconds: number, maxSeconds = 90): boolean {
  return Number.isFinite(seconds) && seconds > 0 && seconds <= maxSeconds
}

/** Load real duration from a media URL via metadata. */
export function useMediaDuration(src?: string | null, type: 'video' | 'audio' = 'video') {
  const [duration, setDuration] = useState<number | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!src) {
      setDuration(null)
      return
    }
    let cancelled = false
    const el =
      type === 'audio'
        ? document.createElement('audio')
        : document.createElement('video')
    el.preload = 'metadata'
    el.muted = true
    const onMeta = () => {
      if (cancelled) return
      if (Number.isFinite(el.duration) && el.duration > 0) {
        setDuration(el.duration)
        setError(false)
      }
    }
    const onErr = () => {
      if (!cancelled) {
        setError(true)
        setDuration(null)
      }
    }
    el.addEventListener('loadedmetadata', onMeta)
    el.addEventListener('error', onErr)
    el.src = src
    return () => {
      cancelled = true
      el.removeEventListener('loadedmetadata', onMeta)
      el.removeEventListener('error', onErr)
      el.removeAttribute('src')
      el.load()
    }
  }, [src, type])

  return { duration, error, label: duration ? formatDuration(duration) : '' }
}
