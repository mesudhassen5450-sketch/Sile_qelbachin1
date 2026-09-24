import { Suspense } from 'react'

import ChangePasswordForm from '@/views/account/ChangePasswordForm'

const Page = () => {
  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold tracking-tight'>Change Password</h1>
        <p className='text-muted-foreground mt-1 text-sm'>My Account → Change Password</p>
      </div>
      <Suspense fallback={<p className='text-muted-foreground text-sm'>Loading…</p>}>
        <ChangePasswordForm />
      </Suspense>
    </div>
  )
}

export default Page
