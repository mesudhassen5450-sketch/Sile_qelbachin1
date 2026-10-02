import catalog from '@/data/mediaDurations.json'

type DurationCatalog = {
  durations?: Record<string, number>
}

const durations = (catalog as DurationCatalog).durations || {}

/** Real media duration in seconds from ffprobe catalog (scripts/extract_short_media.py). */
export function getMediaDurationSeconds(id: string): number | null {
  const v = durations[id]
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null
}

export function getAllMediaDurations(): Record<string, number> {
  return durations
}
