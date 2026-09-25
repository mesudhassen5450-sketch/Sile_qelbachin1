/**
 * Optional published CMS client.
 * When NEXT_PUBLIC_CMS_API_BASE is set (Admin public API), consumers can load
 * database-published content. Legacy static JSON remains the default until verified.
 *
 * Example:
 *   NEXT_PUBLIC_CMS_API_BASE=http://localhost:3001/api/public/v1
 */
const CMS_BASE = (process.env.NEXT_PUBLIC_CMS_API_BASE || '').replace(/\/+$/, '');

export function isCmsApiEnabled(): boolean {
  return Boolean(CMS_BASE);
}

async function getJson<T>(resource: string): Promise<T | null> {
  if (!CMS_BASE) return null
  try {
    const res = await fetch(`${CMS_BASE}/${resource}`, {
      cache: 'no-store',
      next: { revalidate: 0 }
    })
    if (!res.ok) return null
    const body = await res.json()
    if (!body?.ok) return null
    return body.data as T
  } catch {
    return null
  }
}

export async function fetchPublishedKitabs<T = unknown>(): Promise<T[] | null> {
  return getJson<T[]>('kitabs');
}

export async function fetchPublishedAudio<T = unknown>(): Promise<T[] | null> {
  return getJson<T[]>('audio');
}

export async function fetchPublishedVideos<T = unknown>(): Promise<T[] | null> {
  return getJson<T[]>('video');
}

export async function fetchPublishedPdfs<T = unknown>(): Promise<T[] | null> {
  return getJson<T[]>('pdfs');
}
