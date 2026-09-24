'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { EyeIcon, EyeOffIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { mapAuthError, validatePasswordStrength } from '@/lib/auth/password'
import { createClient } from '@/lib/supabase/client'

const ChangePasswordForm = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const forced = searchParams.get('forced') === '1'

  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const strength = validatePasswordStrength(password)
    if (!strength.ok) {
      setError(strength.message || 'Password too weak.')
      return
    }
    if (password !== confirm) {
      setError('New password and confirmation do not match.')
      return
    }
    if (password === currentPassword) {
      setError('New password must be different from the current password.')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const {
        data: { user }
      } = await supabase.auth.getUser()
      if (!user?.email) {
        setError('Session expired. Please sign in again.')
        return
      }

      // Verify current password
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      })
      if (reauthError) {
        setError('Current password is incorrect.')
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        setError(mapAuthError(updateError.message))
        return
      }

      await fetch('/api/auth/password-changed', { method: 'POST' })
      setSuccess('Password updated successfully.')
      if (forced) {
        setTimeout(() => router.replace('/dashboard'), 800)
      }
    } catch {
      setError('Unable to change password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className='max-w-lg'>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>
          {forced
            ? 'You must set a new strong password before continuing.'
            : 'Update your Admin password. Passwords are managed by Supabase Auth — never stored in our CMS tables.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={e => void onSubmit(e)}>
          <FieldGroup className='gap-4'>
            <Field>
              <FieldLabel htmlFor='currentPassword'>Current Password*</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id='currentPassword'
                  autoComplete='current-password'
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  required
                />
                <InputGroupAddon align='inline-end' className='pr-1.5'>
                  <Button type='button' variant='ghost' size='icon' onClick={() => setShowCurrent(v => !v)}>
                    {showCurrent ? <EyeOffIcon /> : <EyeIcon />}
                  </Button>
                </InputGroupAddon>
              </InputGroup>
            </Field>
            <Field>
              <FieldLabel htmlFor='newPassword'>New Password*</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id='newPassword'
                  autoComplete='new-password'
                  type={showNew ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <InputGroupAddon align='inline-end' className='pr-1.5'>
                  <Button type='button' variant='ghost' size='icon' onClick={() => setShowNew(v => !v)}>
                    {showNew ? <EyeOffIcon /> : <EyeIcon />}
                  </Button>
                </InputGroupAddon>
              </InputGroup>
            </Field>
            <Field>
              <FieldLabel htmlFor='confirmPassword'>Confirm New Password*</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id='confirmPassword'
                  autoComplete='new-password'
                  type={showConfirm ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                />
                <InputGroupAddon align='inline-end' className='pr-1.5'>
                  <Button type='button' variant='ghost' size='icon' onClick={() => setShowConfirm(v => !v)}>
                    {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                  </Button>
                </InputGroupAddon>
              </InputGroup>
            </Field>
            {error ? <p className='text-destructive text-sm'>{error}</p> : null}
            {success ? <p className='text-sm text-green-600'>{success}</p> : null}
            <Button type='submit' disabled={loading}>
              {loading ? 'Updating…' : 'Update Password'}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}

export default ChangePasswordForm
