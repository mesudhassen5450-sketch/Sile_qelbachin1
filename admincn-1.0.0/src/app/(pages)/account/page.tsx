'use client'

import Link from 'next/link'

import { useAuth } from '@/components/auth/AuthProvider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const AccountPage = () => {
  const { profile, email, loading, signOut } = useAuth()

  if (loading) {
    return <p className='text-muted-foreground text-sm'>Loading account…</p>
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold tracking-tight'>My Account</h1>
        <p className='text-muted-foreground mt-1 text-sm'>Profile, role, and security settings.</p>
      </div>

      <Card className='max-w-lg'>
        <CardHeader>
          <CardTitle>{profile?.display_name || email || 'Admin'}</CardTitle>
          <CardDescription>{email}</CardDescription>
        </CardHeader>
        <CardContent className='space-y-3 text-sm'>
          <p>
            Role: <Badge variant='outline'>{profile?.role || '—'}</Badge>
          </p>
          <p>
            Status: <Badge variant='outline'>{profile?.status || '—'}</Badge>
          </p>
          <p>Email verified: yes (required for Admin access)</p>
          <div className='flex flex-wrap gap-2 pt-2'>
            <Button render={<Link href='/account/change-password' />} nativeButton={false}>
              Change Password
            </Button>
            <Button type='button' variant='outline' onClick={() => void signOut()}>
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AccountPage
