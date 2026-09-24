'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { EyeIcon, EyeOffIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { isValidEmail, mapAuthError } from '@/lib/auth/password'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseAuthConfigured } from '@/lib/supabase/env'

type LoginState =
  | 'idle'
  | 'loading'
  | 'success'
  | 'invalid'
  | 'unverified'
  | 'disabled'
  | 'unauthorized'
  | 'network'
  | 'not_configured'

const LoginForm = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isVisible, setIsVisible] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [state, setState] = useState<LoginState>('idle')
  const [message, setMessage] = useState<string | null>(
    searchParams.get('error') === 'auth_not_configured'
      ? 'Supabase Auth is not configured on this server.'
      : searchParams.get('message')
  )

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (!isSupabaseAuthConfigured()) {
      setState('not_configured')
      setMessage('Supabase Auth is not configured. Set NEXT_PUBLIC_SUPABASE_URL and publishable key.')
      return
    }

    if (!isValidEmail(email)) {
      setState('invalid')
      setMessage('Enter a valid email address.')
      return
    }
    if (!password) {
      setState('invalid')
      setMessage('Password is required.')
      return
    }

    setState('loading')
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      })

      if (error) {
        const friendly = mapAuthError(error.message)
        if (error.message.toLowerCase().includes('email not confirmed')) {
          setState('unverified')
          setMessage('Please verify your email before continuing.')
        } else {
          setState('invalid')
          setMessage(friendly)
        }
        return
      }

      if (!data.user?.email_confirmed_at) {
        await supabase.auth.signOut()
        setState('unverified')
        setMessage('Please verify your email before continuing.')
        return
      }

      // Server-side staff authorization check
      const res = await fetch('/api/auth/session', { cache: 'no-store' })
      const body = await res.json()

      if (!res.ok || !body.ok) {
        await supabase.auth.signOut()
        if (body.code === 'unverified') {
          setState('unverified')
          setMessage(body.error || 'Please verify your email before continuing.')
        } else if (body.code === 'disabled') {
          setState('disabled')
          setMessage(body.error || 'This account is disabled.')
        } else if (body.code === 'no_profile' || body.code === 'forbidden') {
          setState('unauthorized')
          setMessage(body.error || 'Access denied. You are not authorized for Admin.')
        } else {
          setState('unauthorized')
          setMessage(body.error || 'Access denied.')
        }
        return
      }

      setState('success')
      if (body.profile?.must_change_password) {
        router.replace('/account/change-password?forced=1')
      } else {
        const next = searchParams.get('next') || '/dashboard'
        router.replace(next.startsWith('/') ? next : '/dashboard')
      }
      router.refresh()
    } catch {
      setState('network')
      setMessage('Network error. Please try again.')
    }
  }

  return (
    <form onSubmit={e => void onSubmit(e)}>
      <FieldGroup className='gap-4'>
        <Field className='gap-2'>
          <FieldLabel htmlFor='userEmail' className='leading-5'>
            Email address*
          </FieldLabel>
          <Input
            type='email'
            id='userEmail'
            autoComplete='email'
            placeholder='Enter your email address'
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </Field>
        <Field className='w-full gap-2'>
          <FieldLabel htmlFor='password' className='leading-5'>
            Password*
          </FieldLabel>
          <InputGroup>
            <InputGroupInput
              id='password'
              autoComplete='current-password'
              type={isVisible ? 'text' : 'password'}
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
                onClick={() => setIsVisible(prev => !prev)}
                className='text-muted-foreground rounded-l-none hover:bg-transparent'
              >
                {isVisible ? <EyeOffIcon /> : <EyeIcon />}
                <span className='sr-only'>{isVisible ? 'Hide password' : 'Show password'}</span>
              </Button>
            </InputGroupAddon>
          </InputGroup>
        </Field>
        <div className='flex items-center justify-between gap-y-2'>
          <Field orientation='horizontal' className='flex items-center gap-2'>
            <Checkbox id='rememberMe' />
            <FieldLabel htmlFor='rememberMe' className='text-muted-foreground'>
              Remember Me
            </FieldLabel>
          </Field>
          <Link href='/pages/auth/forgot-password' className='text-base text-nowrap hover:underline'>
            Forgot Password?
          </Link>
        </div>
        {message ? (
          <p
            className={
              state === 'success' ? 'text-sm text-green-600' : 'text-destructive text-sm'
            }
            role='alert'
          >
            {message}
          </p>
        ) : null}
        <Field>
          <Button className='w-full' type='submit' disabled={state === 'loading'}>
            {state === 'loading' ? 'Signing in…' : 'Sign In'}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}

export default LoginForm
