import type { CmsOneMinute } from '@/lib/cmsClient'
import catalog from '@/data/oneMinuteCatalog.json'

export type OneMinuteCatalogItem = CmsOneMinute & {
  durationSeconds?: number
  sourceId?: string
  category?: string
  rawFilename?: string
}

type CatalogFile = {
  items?: OneMinuteCatalogItem[]
}

/** Local <1-minute video/audio extracted by scripts/extract_short_media.py */
export function getLocalOneMinuteSlides(): OneMinuteCatalogItem[] {
  const items = (catalog as CatalogFile).items || []
  return items.map(item => ({
    ...item,
    title: item.title || { am: '', en: '', ar: '' },
    body: item.body || { am: '', en: '', ar: '' },
  }))
}
