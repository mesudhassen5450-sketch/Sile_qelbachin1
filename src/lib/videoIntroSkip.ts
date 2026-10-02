/**
 * Many Telegram-sourced clips start with a static sticker / logo (often 0.5–3s).
 * Seek past that so thumbnails and autoplay show real content.
 */
export function telegramIntroSkipSeconds(duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0) return 0
  if (duration <= 8) return Math.min(0.55, duration * 0.1)
  if (duration <= 20) return Math.min(1.5, Math.max(0.9, duration * 0.1))
  if (duration <= 60) return Math.min(2.4, Math.max(1.2, duration * 0.09))
  return Math.min(3, Math.max(1.5, duration * 0.07))
}

/** Apply skip when metadata is ready. Returns the seek time used. */
export function skipTelegramVideoIntro(el: HTMLMediaElement): number {
  const d = el.duration
  const skip = telegramIntroSkipSeconds(d)
  if (skip <= 0) return 0
  try {
    if (el.currentTime < skip - 0.05) {
      el.currentTime = skip
    }
  } catch {
    /* ignore seek errors (not seekable yet) */
  }
  return skip
}

/** Wait briefly for duration, then skip intro. */
export async function prepareVideoPastIntro(el: HTMLMediaElement): Promise<number> {
  if (!Number.isFinite(el.duration) || el.duration === 0) {
    await new Promise<void>(resolve => {
      const done = () => resolve()
      el.addEventListener('loadedmetadata', done, { once: true })
      window.setTimeout(done, 1800)
    })
  }
  return skipTelegramVideoIntro(el)
}
