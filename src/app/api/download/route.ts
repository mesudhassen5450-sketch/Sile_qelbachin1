import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function isAllowedDownloadUrl(raw: string): boolean {
  try {
    const u = new URL(raw)
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false
    const host = u.hostname.toLowerCase()
    return (
      host.endsWith('.r2.dev') ||
      host === 'cdn.jsdelivr.net' ||
      host === 'raw.githubusercontent.com' ||
      host === 'media.githubusercontent.com' ||
      host.endsWith('sileqelbachin1.com') ||
      host === 'localhost' ||
      host === '127.0.0.1'
    )
  } catch {
    return false
  }
}

function safeFilename(name: string): string {
  const cleaned = name
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180)
  const base = cleaned || 'document'
  return /\.pdf$/i.test(base) ? base : `${base}.pdf`
}

/** ASCII-only fallback for legacy `filename=` — Unicode must use filename*= only. */
function asciiFilenameFallback(filename: string): string {
  const ascii = filename
    .replace(/[^\x20-\x7E]+/g, '_')
    .replace(/["\\]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^[\s._]+|[\s._]+$/g, '')
  // If almost nothing left (Amharic/Arabic titles), use a stable English name
  const letters = ascii.replace(/[^A-Za-z0-9]+/g, '')
  const base = letters.length >= 2 ? ascii : 'document'
  return /\.pdf$/i.test(base) ? base : `${base.replace(/\.+$/, '')}.pdf`
}

/** RFC 5987 Content-Disposition — never put raw Amharic/Arabic in header values. */
function contentDispositionAttachment(filename: string): string {
  const ascii = asciiFilenameFallback(filename)
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`
}

/**
 * Same-origin PDF (and media) download proxy.
 * Cross-origin R2 links ignore the HTML `download` attribute in mobile browsers;
 * streaming through this route forces Content-Disposition: attachment.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')
  const name = searchParams.get('name') || 'document.pdf'

  if (!url || !isAllowedDownloadUrl(url)) {
    return NextResponse.json({ ok: false, error: 'Invalid or disallowed url' }, { status: 400 })
  }

  try {
    const upstream = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(90_000),
      headers: {
        Accept: '*/*',
        // R2/Cloudflare often returns 1010 for bare bot UAs; mimic a normal browser.
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Referer: 'https://sileqelbachin1.com/',
      },
    })

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { ok: false, error: `Upstream failed (${upstream.status})` },
        { status: upstream.status === 404 ? 404 : 502 }
      )
    }

    const filename = safeFilename(name)
    const headers = new Headers()
    headers.set(
      'Content-Type',
      upstream.headers.get('Content-Type') || 'application/pdf'
    )
    headers.set('Content-Disposition', contentDispositionAttachment(filename))
    headers.set('Cache-Control', 'private, max-age=3600')
    const len = upstream.headers.get('Content-Length')
    if (len) headers.set('Content-Length', len)

    return new NextResponse(upstream.body, { status: 200, headers })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: msg }, { status: 502 })
  }
}
