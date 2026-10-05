/** Same-origin download URL — forces attachment (mobile ignores cross-origin `download`). */
export function mediaDownloadHref(fileUrl: string, title: string): string {
  const params = new URLSearchParams({
    url: fileUrl,
    name: title.replace(/\.[Pp][Dd][Ff]$/, '').trim() || 'document',
  })
  return `/api/download?${params.toString()}`
}

function safeDownloadName(title: string): string {
  const cleaned = title
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180)
  const base = cleaned || 'document'
  return /\.pdf$/i.test(base) ? base : `${base}.pdf`
}

/**
 * Trigger a real file download. Tries browser fetch→blob first (best on mobile when
 * CORS allows), then falls back to the same-origin `/api/download` proxy.
 */
export async function triggerMediaDownload(fileUrl: string, title: string): Promise<void> {
  const filename = safeDownloadName(title)

  try {
    const res = await fetch(fileUrl, { mode: 'cors', credentials: 'omit' })
    if (!res.ok) throw new Error(`direct ${res.status}`)
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = filename
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(objectUrl)
    return
  } catch {
    // Cross-origin without CORS, or network error → proxy forces Content-Disposition.
    window.location.assign(mediaDownloadHref(fileUrl, filename))
  }
}
