export const MIN_PASSWORD_LENGTH = 8

export type PasswordCheck = {
  ok: boolean
  message?: string
}

export function validatePasswordStrength(password: string): PasswordCheck {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` }
  }
  if (password.length > 72) {
    return { ok: false, message: 'Password is too long.' }
  }
  const weak = ['password', 'password123', '12345678', 'qwerty123', '11111111']
  if (weak.some(w => password.toLowerCase() === w || password.toLowerCase().includes(w))) {
    return { ok: false, message: 'Password is too common. Choose a stronger password.' }
  }
  return { ok: true }
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

/** Friendly auth messages — never leak raw Supabase internals. */
export function mapAuthError(message: string | undefined): string {
  const m = (message || '').toLowerCase()
  if (m.includes('invalid login') || m.includes('invalid credentials')) {
    return 'Incorrect email or password.'
  }
  if (m.includes('email not confirmed')) {
    return 'Please verify your email before continuing.'
  }
  if (m.includes('user already registered') || m.includes('already been registered')) {
    return 'An account with this email already exists. Sign in or reset your password.'
  }
  if (m.includes('user not found')) {
    return 'Incorrect email or password.'
  }
  if (m.includes('password') && (m.includes('weak') || m.includes('short') || m.includes('least'))) {
    return 'Password does not meet the security requirements.'
  }
  if (m.includes('network') || m.includes('fetch')) {
    return 'Network error. Please try again.'
  }
  if (m.includes('rate') || m.includes('too many')) {
    return 'Too many attempts. Please wait and try again.'
  }
  if (m.includes('expired') || m.includes('otp')) {
    return 'This link has expired. Request a new one.'
  }
  return 'Unable to complete authentication. Please try again.'
}
