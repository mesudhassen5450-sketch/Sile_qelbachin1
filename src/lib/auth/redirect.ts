/** Post-login path on the public website only (never Admin). */
export function safePublicNextPath(
  next: string | null | undefined,
  fallback = '/'
): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return fallback
  const lower = next.toLowerCase()
  if (
    lower.includes('onrender.com') ||
    lower.includes('/pages/auth/login') ||
    lower.includes('admin.') ||
    lower.includes(':3001')
  ) {
    return fallback
  }
  return next
}
