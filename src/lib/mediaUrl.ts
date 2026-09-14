const MEDIA_OWNER = 'mesudhassen5450-sketch';
const MEDIA_REPO = 'sileqelbachin-media';
const MEDIA_REF = 'main';

const JSDELIVR_PREFIX =
  /https?:\/\/cdn\.jsdelivr\.net\/gh\/mesudhassen5450-sketch\/sileqelbachin-media@[^/]+\//i;
const GITHUB_RAW_PREFIX =
  /https?:\/\/raw\.githubusercontent\.com\/mesudhassen5450-sketch\/sileqelbachin-media\/[^/]+\//i;
const GITHUB_MEDIA_PREFIX =
  /https?:\/\/media\.githubusercontent\.com\/media\/mesudhassen5450-sketch\/sileqelbachin-media\/[^/]+\//i;

function safeDecode(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function encodePath(path: string): string {
  return path
    .split('/')
    .map((segment) => (segment ? encodeURIComponent(safeDecode(segment)) : ''))
    .join('/');
}

function fixKnownFolderAliases(path: string): string {
  return path.replace(/Ad-Da['’]?\s+wa\s+Ad-Dawa['’]?/g, 'Ad-Da_ wa Ad-Dawa_');
}

/**
 * Encode local public paths and rewrite GitHub/jsDelivr media URLs.
 * jsDelivr rejects files over 20MB, so kitab audio is served from GitHub raw.
 */
export function resolveMediaUrl(url?: string | null): string {
  if (!url) return '';

  const trimmed = url.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    const hashIndex = trimmed.indexOf('#');
    const queryIndex = trimmed.indexOf('?');
    const cut =
      hashIndex === -1
        ? queryIndex
        : queryIndex === -1
          ? hashIndex
          : Math.min(hashIndex, queryIndex);
    const pathname = cut === -1 ? trimmed : trimmed.slice(0, cut);
    const suffix = cut === -1 ? '' : trimmed.slice(cut);
    return `${encodePath(pathname)}${suffix}`;
  }

  const prefixMatch =
    trimmed.match(JSDELIVR_PREFIX) ||
    trimmed.match(GITHUB_RAW_PREFIX) ||
    trimmed.match(GITHUB_MEDIA_PREFIX);

  if (!prefixMatch) return trimmed;

  const rest = fixKnownFolderAliases(safeDecode(trimmed.slice(prefixMatch[0].length)));
  return `https://raw.githubusercontent.com/${MEDIA_OWNER}/${MEDIA_REPO}/${MEDIA_REF}/${encodePath(rest)}`;
}

export function resolvePdfEmbedUrl(url?: string | null): string {
  const resolved = resolveMediaUrl(url);
  if (!resolved) return '';
  if (resolved.startsWith('/')) return resolved;
  return resolved.replace(
    `https://raw.githubusercontent.com/${MEDIA_OWNER}/${MEDIA_REPO}/${MEDIA_REF}/`,
    `https://cdn.jsdelivr.net/gh/${MEDIA_OWNER}/${MEDIA_REPO}@${MEDIA_REF}/`
  );
}

export function mediaFileUrl(relativePath: string): string {
  const normalized = relativePath.replace(/^(\.\/|\/)/, '').replace(/^telegram_media\//, '');
  return resolveMediaUrl(
    `https://raw.githubusercontent.com/${MEDIA_OWNER}/${MEDIA_REPO}/${MEDIA_REF}/${normalized}`
  );
}
