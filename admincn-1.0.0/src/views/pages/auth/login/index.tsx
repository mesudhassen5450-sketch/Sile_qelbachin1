import { Suspense } from 'react'
import Link from 'next/link'

import Logo from '@/components/shared/Logo'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import LoginForm from '@/views/pages/auth/login/login-form'
import AuthBackgroundShape from '@/assets/svg/auth-background-shape'

const Login = () => {
  return (
    <div className='relative flex h-auto min-h-screen items-center justify-center overflow-x-hidden px-4 py-10 sm:px-6 lg:px-8'>
      <div className='absolute'>
        <AuthBackgroundShape />
      </div>

      <Card className='z-1 w-full gap-6 py-6 sm:max-w-lg'>
        <CardHeader className='gap-6 px-6'>
          <Link href='/pages/auth/login'>
            <Logo className='gap-3' />
          </Link>

          <div>
            <CardTitle className='mb-2 text-2xl font-semibold'>Sign in to Sile Qelbachin Admin</CardTitle>
            <CardDescription className='text-base'>
              Use your verified staff email and password. Forgot your password? Request a secure reset
              link by email.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className='px-6'>
          <Suspense fallback={<p className='text-muted-foreground text-sm'>Loading…</p>}>
            <LoginForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}

export default Login
