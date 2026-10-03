/**
 * Many Telegram-sourced clips start with a static sticker / logo (often 0.5–3s).
 * Seek past that so thumbnails and autoplay show real content.
 */
export function telegramIntroSkipSeconds(duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0) return 0
  // Stickers / logos are often longer on short Telegram clips — skip a bit more.
  if (duration <= 8) return Math.min(1.1, duration * 0.18)
  if (duration <= 20) return Math.min(2.2, Math.max(1.2, duration * 0.14))
  if (duration <= 60) return Math.min(3.2, Math.max(1.8, duration * 0.11))
  return Math.min(4, Math.max(2.2, duration * 0.08))
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
