/**
 * Single active media policy for the whole public site.
 * Any player that starts sound must call claimMediaSolo(ownerId).
 * Other players listen and stop themselves.
 */

export const MEDIA_SOLO_EVENT = 'sile:media-solo'

export type MediaSoloDetail = { owner: string }

/** Pause every DOM <audio>/<video> except the optional element that is starting. */
export function pauseDomMedia(except?: HTMLMediaElement | null) {
  if (typeof document === 'undefined') return
  document.querySelectorAll('audio, video').forEach(el => {
    const media = el as HTMLMediaElement
    if (media === except) return
    if (!media.paused) {
      try {
        media.pause()
      } catch {
        /* ignore */
      }
    }
  })
}

/** Claim exclusive playback. Other owners receive the event and must stop. */
export function claimMediaSolo(owner: string, except?: HTMLMediaElement | null) {
  if (typeof window === 'undefined') return
  pauseDomMedia(except)
  window.dispatchEvent(
    new CustomEvent<MediaSoloDetail>(MEDIA_SOLO_EVENT, { detail: { owner } })
  )
}

/** Subscribe: when another owner claims, run `onForeign`. Returns unsubscribe. */
export function onForeignMediaSolo(owner: string, onForeign: () => void) {
  if (typeof window === 'undefined') return () => {}
  const handler = (e: Event) => {
    const detail = (e as CustomEvent<MediaSoloDetail>).detail
    if (!detail || detail.owner === owner) return
    onForeign()
  }
  window.addEventListener(MEDIA_SOLO_EVENT, handler)
  return () => window.removeEventListener(MEDIA_SOLO_EVENT, handler)
}
