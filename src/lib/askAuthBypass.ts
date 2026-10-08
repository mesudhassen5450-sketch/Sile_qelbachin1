/**
 * Ask a Question is public by default (no login to open the form).
 *
 * Google sign-in is only required when the visitor chooses Email delivery.
 * Telegram uses guest email + bot Start (no Google).
 *
 * NEXT_PUBLIC_ASK_SKIP_AUTH is kept only as a legacy alias (always treated as public).
 */
export function isAskAuthBypassed(): boolean {
  // Ask page is always guest-accessible; email channel still requires Google at send time.
  return true
}
