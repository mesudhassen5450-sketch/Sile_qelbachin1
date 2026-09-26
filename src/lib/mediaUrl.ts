const DEFAULT_R2_PUBLIC_BASE =
  'https://pub-03bea4f667534df5ab6c67f073c73d1e.r2.dev';
const DEFAULT_R2_OBJECT_PREFIX = 'sileqelbachin-meadia';

const PUBLIC_BASE = (
  process.env.NEXT_PUBLIC_R2_PUBLIC_BASE || DEFAULT_R2_PUBLIC_BASE
).replace(/\/+$/, '');

const OBJECT_PREFIX = (
  process.env.NEXT_PUBLIC_R2_OBJECT_PREFIX || DEFAULT_R2_OBJECT_PREFIX
).replace(/^\/+|\/+$/g, '');

/** Legacy GitHub / jsDelivr hosts — rewrite by extracting the path after the media repo prefix. */
const JSDELIVR_PREFIX =
  /https?:\/\/cdn\.jsdelivr\.net\/gh\/mesudhassen5450-sketch\/sileqelbachin-media@[^/]+\//i;
const GITHUB_RAW_PREFIX =
  /https?:\/\/raw\.githubusercontent\.com\/mesudhassen5450-sketch\/sileqelbachin-media\/[^/]+\//i;
const GITHUB_MEDIA_PREFIX =
  /https?:\/\/media\.githubusercontent\.com\/media\/mesudhassen5450-sketch\/sileqelbachin-media\/[^/]+\//i;

const R2_PREFIX = new RegExp(
  `^${escapeRegExp(PUBLIC_BASE)}/${escapeRegExp(OBJECT_PREFIX)}/`,
  'i'
);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function safeDecode(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/** Encode each path segment for safe remote URLs (spaces, Amharic, Arabic, etc.). */
export function encodePathSegments(path: string): string {
  return path
    .split('/')
    .map((segment) => (segment ? encodeURIComponent(safeDecode(segment)) : ''))
    .join('/');
}

function fixKnownFolderAliases(path: string): string {
  return path.replace(/Ad-Da['’]?\s+wa\s+Ad-Dawa['’]?/g, 'Ad-Da_ wa Ad-Dawa_');
}

function stripTelegramMediaPrefix(path: string): string {
  return path.replace(/^telegram_media\//i, '');
}

function normalizeRelativeMediaPath(path: string): string {
  let cleaned = path.replace(/^(\.\/|\/)/, '');
  cleaned = stripTelegramMediaPrefix(cleaned);
  return fixKnownFolderAliases(safeDecode(cleaned));
}

/** Build a public R2 URL for a media-catalog relative path. */
export function buildR2MediaUrl(relativePath: string): string {
  const normalized = normalizeRelativeMediaPath(relativePath);
  if (!normalized) return '';
  return `${PUBLIC_BASE}/${OBJECT_PREFIX}/${encodePathSegments(normalized)}`;
}

/** Only keep small site assets on this host — everything else under / goes to R2. */
function isLocalPublicPath(pathname: string): boolean {
  const lower = pathname.toLowerCase();
  return (
    lower.startsWith('/covers/') ||
    lower === '/covers' ||
    lower.startsWith('/logo') ||
    lower.startsWith('/screenshoot/') ||
    lower.startsWith('/screenshot') ||
    lower.startsWith('/favicon') ||
    lower.startsWith('/icons/') ||
    lower.startsWith('/_next/') ||
    lower.startsWith('/assets/') ||
    lower.startsWith('/css/')
  );
}

function splitPathAndSuffix(url: string): { pathname: string; suffix: string } {
  const hashIndex = url.indexOf('#');
  const queryIndex = url.indexOf('?');
  const cut =
    hashIndex === -1
      ? queryIndex
      : queryIndex === -1
        ? hashIndex
        : Math.min(hashIndex, queryIndex);
  if (cut === -1) return { pathname: url, suffix: '' };
  return { pathname: url.slice(0, cut), suffix: url.slice(cut) };
}

/**
 * Resolve any media URL to online R2 storage (production playback source).
 * Rewrites legacy GitHub raw / media.githubusercontent / jsDelivr URLs.
 * Keeps local public paths (/covers/, /logo, etc.) on this site.
 */
export function resolveMediaUrl(url?: string | null): string {
  if (!url) return '';

  const trimmed = url.trim();
  if (!trimmed) return '';

  // Relative site assets such as covers/... → /covers/...
  if (
    !trimmed.includes('://') &&
    !trimmed.startsWith('//') &&
    (trimmed.startsWith('covers/') ||
      trimmed.startsWith('logo') ||
      trimmed.startsWith('screenshoot/') ||
      trimmed.startsWith('favicon'))
  ) {
    const { pathname, suffix } = splitPathAndSuffix(trimmed);
    return `/${encodePathSegments(pathname)}${suffix}`;
  }

  // Absolute paths: local site assets stay; telegram_media + other /files → R2
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    const { pathname, suffix } = splitPathAndSuffix(trimmed);

    if (isLocalPublicPath(pathname)) {
      return `${encodePathSegments(pathname)}${suffix}`;
    }

    // /telegram_media/files/... or /files/... or leftover /intebih5.m4a style
    return `${buildR2MediaUrl(pathname.slice(1))}${suffix}`;
  }

  const prefixMatch =
    trimmed.match(JSDELIVR_PREFIX) ||
    trimmed.match(GITHUB_RAW_PREFIX) ||
    trimmed.match(GITHUB_MEDIA_PREFIX) ||
    trimmed.match(R2_PREFIX);

  if (prefixMatch) {
    const { pathname, suffix } = splitPathAndSuffix(
      trimmed.slice(prefixMatch[0].length)
    );
    return `${buildR2MediaUrl(pathname)}${suffix}`;
  }

  // Bare relative catalog paths (files/..., voice_messages/..., etc.)
  if (
    !trimmed.includes('://') &&
    !trimmed.startsWith('//') &&
    !trimmed.startsWith('/')
  ) {
    return buildR2MediaUrl(trimmed);
  }

  return trimmed;
}

/** PDF embed uses the same R2 public URL as download/playback. */
export function resolvePdfEmbedUrl(url?: string | null): string {
  return resolveMediaUrl(url);
}

/** Build an R2 URL from a relative media-catalog path (strips telegram_media/). */
export function mediaFileUrl(relativePath: string): string {
  return buildR2MediaUrl(relativePath);
}
