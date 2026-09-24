'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { EyeIcon, EyeOffIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { mapAuthError, validatePasswordStrength } from '@/lib/auth/password'
import { createClient } from '@/lib/supabase/client'

const ResetPasswordForm = () => {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [sessionOk, setSessionOk] = useState(false)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      try {
        const supabase = createClient()
        // Recovery links may include hash tokens; getSession picks them up after detectSessionInUrl
        const { data } = await supabase.auth.getSession()
        if (data.session) {
          setSessionOk(true)
        } else {
          // Listen for PASSWORD_RECOVERY event
          const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY' || session) {
              setSessionOk(true)
            }
          })
          setTimeout(() => sub.subscription.unsubscribe(), 15000)
        }
      } catch {
        setError('Unable to start password reset. Open the link from your email again.')
      } finally {
        setReady(true)
      }
    }
    void init()
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (!sessionOk) {
      setError('This reset link is invalid or expired. Request a new one from Forgot Password.')
      return
    }

    const strength = validatePasswordStrength(password)
    if (!strength.ok) {
      setError(strength.message || 'Password is too weak.')
      return
    }
    if (password !== confirm) {
      setError('New password and confirmation do not match.')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        setError(mapAuthError(updateError.message))
        return
      }

      // Clear must_change_password via API if profile exists
      await fetch('/api/auth/password-changed', { method: 'POST' }).catch(() => null)

      setMessage('Password updated successfully. Redirecting to login…')
      await supabase.auth.signOut()
      setTimeout(() => router.replace('/pages/auth/login?message=Password%20updated.%20Please%20sign%20in.'), 1200)
    } catch {
      setError('Unable to update password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!ready) {
    return <p className='text-muted-foreground text-sm'>Checking reset link…</p>
  }

  return (
    <form onSubmit={e => void onSubmit(e)}>
      <FieldGroup className='gap-4'>
        {!sessionOk ? (
          <p className='text-destructive text-sm'>
            No valid recovery session. Use Forgot Password to request a new email link.
          </p>
        ) : null}

        <Field>
          <FieldLabel className='leading-5' htmlFor='password'>
            New Password*
          </FieldLabel>
          <InputGroup>
            <InputGroupInput
              id='password'
              autoComplete='new-password'
              type={isPasswordVisible ? 'text' : 'password'}
              placeholder='••••••••••••••••'
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <InputGroupAddon align='inline-end' className='pr-1.5'>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                onClick={() => setIsPasswordVisible(p => !p)}
                className='text-muted-foreground rounded-l-none hover:bg-transparent'
              >
                {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
              </Button>
            </InputGroupAddon>
          </InputGroup>
        </Field>

        <Field>
          <FieldLabel className='leading-5' htmlFor='confirmPassword'>
            Confirm New Password*
          </FieldLabel>
          <InputGroup>
            <InputGroupInput
              id='confirmPassword'
              autoComplete='new-password'
              type={isConfirmPasswordVisible ? 'text' : 'password'}
              placeholder='••••••••••••••••'
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
            />
            <InputGroupAddon align='inline-end' className='pr-1.5'>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                onClick={() => setIsConfirmPasswordVisible(p => !p)}
                className='text-muted-foreground rounded-l-none hover:bg-transparent'
              >
                {isConfirmPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
              </Button>
            </InputGroupAddon>
          </InputGroup>
        </Field>

        {error ? (
          <p className='text-destructive text-sm' role='alert'>
            {error}
          </p>
        ) : null}
        {message ? <p className='text-sm text-green-600'>{message}</p> : null}

        <Field>
          <Button className='w-full' type='submit' disabled={loading || !sessionOk}>
            {loading ? 'Updating…' : 'Set New Password'}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}

export default ResetPasswordForm
