export const MIN_PASSWORD_LENGTH = 10

export type PasswordCheck = {
  ok: boolean
  message?: string
}

export function validatePasswordStrength(password: string): PasswordCheck {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` }
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
    return { ok: false, message: 'Password must include upper and lower case letters.' }
  }
  if (!/[0-9]/.test(password)) {
    return { ok: false, message: 'Password must include at least one number.' }
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { ok: false, message: 'Password must include at least one special character.' }
  }
  const weak = ['password', 'password123', 'admin123', '12345678', 'qwerty123', 'changeme']
  if (weak.some(w => password.toLowerCase().includes(w))) {
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
    return 'Invalid email or password.'
  }
  if (m.includes('email not confirmed')) {
    return 'Please verify your email before continuing.'
  }
  if (m.includes('user not found')) {
    return 'Invalid email or password.'
  }
  if (m.includes('network') || m.includes('fetch')) {
    return 'Network error. Please try again.'
  }
  if (m.includes('rate') || m.includes('too many')) {
    return 'Too many attempts. Please wait and try again.'
  }
  return 'Unable to complete authentication. Please try again.'
}
