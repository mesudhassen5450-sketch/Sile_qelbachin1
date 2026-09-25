'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

const CMS_BASE = (process.env.NEXT_PUBLIC_CMS_API_BASE || '').replace(/\/+$/, '')

function visitorId(): string {
  try {
    const key = 'sq_vid'
    let id = localStorage.getItem(key)
    if (!id) {
      id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
      localStorage.setItem(key, id)
    }
    return id
  } catch {
    return 'anon'
  }
}

function sessionFlag(): boolean {
  try {
    const key = 'sq_session_sent'
    if (sessionStorage.getItem(key)) return false
    sessionStorage.setItem(key, '1')
    return true
  } catch {
    return true
  }
}

async function sendEvent(event: string, path: string, meta?: Record<string, unknown>) {
  if (!CMS_BASE) return
  try {
    await fetch(`${CMS_BASE}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        path,
        platform: 'website',
        meta: { visitor_id: visitorId(), ...meta }
      }),
      keepalive: true
    })
  } catch {
    // ignore
  }
}

/** Sends real page views / sessions to Admin (no fake numbers). */
export default function AnalyticsBeacon() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname) return
    void sendEvent('page_view', pathname)
    if (sessionFlag()) void sendEvent('session_start', pathname)
  }, [pathname])

  return null
}

export function trackMediaPlay(kind: 'audio' | 'video' | 'pdf', path?: string) {
  const event = kind === 'audio' ? 'audio_play' : kind === 'video' ? 'video_play' : 'pdf_open'
  void sendEvent(event, path || (typeof window !== 'undefined' ? window.location.pathname : '/'))
}
