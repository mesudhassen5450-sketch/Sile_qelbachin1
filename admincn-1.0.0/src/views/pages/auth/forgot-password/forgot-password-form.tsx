'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { isValidEmail } from '@/lib/auth/password'
import { createClient } from '@/lib/supabase/client'
import { getPasswordResetRedirectUrl, isSupabaseAuthConfigured } from '@/lib/supabase/env'

/**
 * Forgot password: asks for email. If the address exists in Supabase Auth,
 * Supabase emails a reset link. We always show the same success message so we
 * never reveal whether an email is registered.
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
      // Always treat as success for the user (anti-enumeration).
      await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: getPasswordResetRedirectUrl()
      })
      setDone(true)
    } catch {
      // Still show generic success to avoid enumeration via network errors timing —
      // but network failures should be visible.
      setError('Unable to send reset email right now. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className='space-y-3 text-sm'>
        <p className='text-foreground'>
          If an Admin account exists for that email, a password reset link has been sent. Check your
          inbox (and spam folder), open the link, then choose a new password.
        </p>
        <p className='text-muted-foreground'>
          The email never contains your password — only a secure reset link from Supabase.
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
