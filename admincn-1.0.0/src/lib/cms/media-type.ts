import type { DetectedContent, MediaType } from './types'

const AUDIO_EXT = new Set(['.mp3', '.m4a', '.ogg', '.wav', '.aac', '.flac', '.opus'])
const VIDEO_EXT = new Set(['.mp4', '.webm', '.mov', '.mkv', '.m4v'])
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif'])
const PDF_EXT = new Set(['.pdf'])

const MIME_TO_TYPE: Record<string, MediaType> = {
  'audio/mpeg': 'audio',
  'audio/mp4': 'audio',
  'audio/x-m4a': 'audio',
  'audio/aac': 'audio',
  'audio/ogg': 'audio',
  'audio/wav': 'audio',
  'audio/flac': 'audio',
  'video/mp4': 'video',
  'video/webm': 'video',
  'video/quicktime': 'video',
  'application/pdf': 'pdf',
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
  'image/gif': 'image',
  'image/svg+xml': 'image'
}

export function extensionOf(objectKey: string): string {
  const base = objectKey.split('/').pop() || objectKey
  const idx = base.lastIndexOf('.')
  if (idx < 0) return ''
  return base.slice(idx).toLowerCase()
}

export function detectMediaType(objectKey: string, mimeType?: string | null): MediaType {
  const mime = (mimeType || '').split(';')[0].trim().toLowerCase()
  if (mime && MIME_TO_TYPE[mime]) return MIME_TO_TYPE[mime]
  if (mime.startsWith('audio/')) return 'audio'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('image/')) return 'image'
  if (mime === 'application/pdf') return 'pdf'

  const ext = extensionOf(objectKey)
  if (AUDIO_EXT.has(ext)) return 'audio'
  if (VIDEO_EXT.has(ext)) return 'video'
  if (PDF_EXT.has(ext)) return 'pdf'
  if (IMAGE_EXT.has(ext)) return 'image'
  return 'other'
}

export function guessMimeFromExtension(objectKey: string): string | null {
  const ext = extensionOf(objectKey)
  const map: Record<string, string> = {
    '.mp3': 'audio/mpeg',
    '.m4a': 'audio/mp4',
    '.ogg': 'audio/ogg',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif'
  }
  return map[ext] || null
}

/** Strip R2 object prefix to catalog-relative path (files/..., video_files/...). */
export function catalogPathFromObjectKey(objectKey: string, objectPrefix: string): string {
  const prefix = objectPrefix.replace(/^\/+|\/+$/g, '')
  let key = objectKey.replace(/^\/+/, '')
  if (prefix && (key === prefix || key.startsWith(`${prefix}/`))) {
    key = key.slice(prefix.length).replace(/^\/+/, '')
  }
  return key
}

const KITAB_SLUG_PATTERNS: Array<{ slug: string; match: RegExp }> = [
  { slug: 'intebih-ante-murakeb', match: /intebih[_\s-]?ante[_\s-]?murakeb/i },
  { slug: 'adewae-kitab', match: /ad[-_]?da.|adewae|الداء|ደዋ/i },
  { slug: 'fatihu-awliya', match: /fatihu[_\s-]?awliya|fethu/i },
  { slug: 'teshilu-alimu-sheria', match: /teshilu[_\s-]?alimu|تسهيل/i },
  { slug: 'alwasail-almufida', match: /alwasail|الوساي|wasail/i },
  { slug: 'yekelb-medreq', match: /yekelb|medreq|የቀልብ/i },
  { slug: 'betewbet-menged', match: /ተውበት|betewbet/i }
]

function extractSlugFromFolder(folder: string): string | undefined {
  const paren = folder.match(/\(([^)]+)\)\s*$/)
  if (paren?.[1]) return paren[1].trim().toLowerCase()
  for (const row of KITAB_SLUG_PATTERNS) {
    if (row.match.test(folder)) return row.slug
  }
  return undefined
}

function dersHintFromFilename(filename: string): string | undefined {
  const m =
    filename.match(/(?:ders|part|ክፍል|الجزء)[_\s-]*0*(\d+)/i) ||
    filename.match(/^0*(\d+)[\s._-]/) ||
    filename.match(/(\d+)\.(?:mp3|m4a|ogg|wav)$/i)
  return m?.[1]
}

/**
 * Infer likely content links from R2 path conventions.
 * Ambiguous paths are marked needsReview — never invent metadata.
 */
export function detectContentFromPath(objectKey: string, objectPrefix: string): DetectedContent {
  const rel = catalogPathFromObjectKey(objectKey, objectPrefix)
  const parts = rel.split('/').filter(Boolean)
  const filename = parts[parts.length - 1] || ''
  const mediaType = detectMediaType(objectKey)

  if (parts[0] === 'files' && parts.length >= 2) {
    const folder = parts[1]
    const slug = extractSlugFromFolder(folder)

    if (mediaType === 'pdf') {
      return {
        kind: 'kitab_pdf',
        kitabSlug: slug,
        kitabFolder: folder,
        confidence: slug ? 'high' : 'medium',
        needsReview: !slug
      }
    }
    if (mediaType === 'image') {
      return {
        kind: 'kitab_cover',
        kitabSlug: slug,
        kitabFolder: folder,
        confidence: slug ? 'high' : 'medium',
        needsReview: !slug
      }
    }
    if (mediaType === 'audio') {
      const dersHint = dersHintFromFilename(filename)
      return {
        kind: 'kitab_audio',
        kitabSlug: slug,
        kitabFolder: folder,
        dersHint,
        confidence: slug && dersHint ? 'high' : slug ? 'medium' : 'low',
        needsReview: !slug || !dersHint
      }
    }
  }

  if (parts[0] === 'voice_messages' || (parts[0] === 'files' && parts[1] === 'home page audio')) {
    return {
      kind: 'archive_audio',
      confidence: 'medium',
      needsReview: true
    }
  }

  if (parts[0] === 'video_files') {
    return {
      kind: mediaType === 'image' ? 'unknown' : 'archive_video',
      confidence: mediaType === 'video' ? 'high' : 'low',
      needsReview: mediaType !== 'video'
    }
  }

  return { kind: 'unknown', confidence: 'low', needsReview: true }
}
