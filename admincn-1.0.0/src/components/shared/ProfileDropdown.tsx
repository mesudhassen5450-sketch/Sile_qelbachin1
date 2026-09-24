'use client'

import Link from 'next/link'
import { LogOutIcon, KeyRoundIcon, UserIcon } from 'lucide-react'

import { useAuth } from '@/components/auth/AuthProvider'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

const ProfileDropdown = () => {
  const { profile, email, signOut } = useAuth()
  const name = profile?.display_name || email || 'Admin'
  const initials = name
    .split(/\s+/)
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant='ghost' size='icon' className='relative rounded-full hover:bg-transparent' />}
      >
        <Avatar>
          <AvatarFallback>{initials || 'AD'}</AvatarFallback>
        </Avatar>
        <span className='ring-card absolute right-0 bottom-0 block size-2 rounded-full bg-green-600 ring-2' />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-60'>
        <DropdownMenuGroup>
          <DropdownMenuLabel className='flex items-center gap-4 px-2 py-2.5 font-normal'>
            <div className='relative'>
              <Avatar className='size-10'>
                <AvatarFallback>{initials || 'AD'}</AvatarFallback>
              </Avatar>
            </div>
            <div className='flex flex-1 flex-col items-start'>
              <span className='text-foreground text-base font-semibold'>{name}</span>
              <span className='text-muted-foreground text-sm'>{email}</span>
              <span className='text-muted-foreground text-xs'>{profile?.role}</span>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link href='/account' />}>
            <UserIcon />
            <span>My Account</span>
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href='/account/change-password' />}>
            <KeyRoundIcon />
            <span>Change Password</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem variant='destructive' onClick={() => void signOut()}>
            <LogOutIcon />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ProfileDropdown
