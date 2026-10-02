/**
 * Offline ayah audio cache (IndexedDB).
 * Play prefers local blob when present — works offline after download.
 */

const DB_NAME = 'sile-quran-audio-v1'
const STORE = 'ayahs'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'))
      return
    }
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export function ayahCacheKey(qariId: string, surah: number, ayah: number): string {
  return `${qariId}:${surah}:${ayah}`
}

export function surahCacheKey(qariId: string, surah: number): string {
  return `${qariId}:surah:${surah}`
}

export async function getCachedBlob(id: string): Promise<Blob | null> {
  try {
    const db = await openDb()
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).get(id)
      req.onsuccess = () => {
        const row = req.result as { id: string; blob: Blob } | undefined
        resolve(row?.blob || null)
      }
      req.onerror = () => reject(req.error)
    })
  } catch {
    return null
  }
}

export async function putCachedBlob(id: string, blob: Blob): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put({ id, blob, savedAt: Date.now() })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function hasCached(id: string): Promise<boolean> {
  const b = await getCachedBlob(id)
  return !!b
}

export async function downloadAndCache(id: string, url: string): Promise<Blob> {
  const existing = await getCachedBlob(id)
  if (existing) return existing
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download failed ${res.status}`)
  const blob = await res.blob()
  await putCachedBlob(id, blob)
  return blob
}

export async function blobPlayUrl(id: string, remoteUrl: string): Promise<string> {
  const cached = await getCachedBlob(id)
  if (cached) return URL.createObjectURL(cached)
  return remoteUrl
}

/** List which ayahs of a surah are cached for a qari. */
export async function listCachedAyahs(
  qariId: string,
  surah: number,
  ayahCount: number
): Promise<Set<number>> {
  const set = new Set<number>()
  await Promise.all(
    Array.from({ length: ayahCount }, (_, i) => i + 1).map(async ayah => {
      if (await hasCached(ayahCacheKey(qariId, surah, ayah))) set.add(ayah)
    })
  )
  return set
}
