'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { isValidEmail } from '@/lib/auth/password'
import { createClient } from '@/lib/supabase/client'
import { getPasswordResetRedirectUrl, isSupabaseAuthConfigured } from '@/lib/supabase/env'

function clientResetRedirectUrl(): string {
  // Prefer the live browser origin so Render / localhost always match this page.
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/pages/auth/reset-password`
  }
  return getPasswordResetRedirectUrl()
}

function describeResetError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('redirect') || m.includes('url not allowed') || m.includes('not allowed')) {
    return 'Reset link URL is not allowed in Supabase. Add this site’s /pages/auth/reset-password to Authentication → URL Configuration → Redirect URLs.'
  }
  if (m.includes('smtp') || m.includes('error sending') || m.includes('mail') || m.includes('email')) {
    return 'Supabase could not send email. Check Authentication → Emails → SMTP settings (and spam folder). Default Supabase mail is limited.'
  }
  if (m.includes('rate') || m.includes('security') || m.includes('seconds')) {
    return 'Too many reset requests. Wait a few minutes, then try again.'
  }
  return `Unable to send reset email: ${message}`
}

/**
 * Forgot password: asks for email. If the address exists in Supabase Auth,
 * Supabase emails a reset link. Unknown emails still show generic success
 * (anti-enumeration). Real SMTP / redirect failures are shown.
 */
const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!isSupabaseAuthConfigured()) {
      setError('Password reset is unavailable until Supabase Auth is configured.')
      return
    }

    if (!isValidEmail(email)) {
      setError('Enter a valid email address.')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const redirectTo = clientResetRedirectUrl()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo
      })

      if (resetError) {
        setError(describeResetError(resetError.message))
        return
      }

      // Success from Auth API ≠ inbox delivery. SMTP must be working in Supabase.
      setDone(true)
    } catch {
      setError('Unable to send reset email right now. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className='space-y-3 text-sm'>
        <p className='text-foreground'>
          If an Admin account exists for that email, a password reset link has been requested. Check
          your inbox and spam folder, open the link, then choose a new password.
        </p>
        <p className='text-muted-foreground'>
          The email never contains your password — only a secure reset link from Supabase. Logging
          in and changing password on My Account is separate from this email flow.
        </p>
        <p className='text-muted-foreground'>
          Still no email? In Supabase: Authentication → Logs (look for recovery), and confirm custom
          SMTP is enabled. Also add{' '}
          <code className='text-xs'>…/pages/auth/reset-password</code> under Redirect URLs.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={e => void onSubmit(e)}>
      <FieldGroup className='gap-4'>
        <Field>
          <FieldLabel className='leading-5' htmlFor='userEmail'>
            Email address*
          </FieldLabel>
          <Input
            type='email'
            id='userEmail'
            autoComplete='email'
            placeholder='Enter your admin email'
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </Field>
        {error ? (
          <p className='text-destructive text-sm' role='alert'>
            {error}
          </p>
        ) : null}
        <Field>
          <Button className='w-full' type='submit' disabled={loading}>
            {loading ? 'Sending…' : 'Send Reset Link'}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}

export default ForgotPasswordForm
