'use client'

import { useEffect, useState } from 'react'

import { useAuth } from '@/components/auth/AuthProvider'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

type StaffRow = {
  user_id: string
  display_name: string | null
  email: string
  role: string
  status: string
  created_at: string
  last_activity_at: string | null
  must_change_password: boolean
}

const AdminsPage = () => {
  const { can } = useAuth()
  const [rows, setRows] = useState<StaffRow[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!can('admins.view')) {
      setError('Access denied.')
      return
    }
    void (async () => {
      const res = await fetch('/api/admin/staff')
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setError(data.error || 'Unable to load admins.')
        return
      }
      setRows(data.rows || [])
    })()
  }, [can])

  if (error) {
    return (
      <Card>
        <CardContent className='text-destructive py-6 text-sm'>{error}</CardContent>
      </Card>
    )
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold tracking-tight'>Admins</h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          Staff profiles linked to Supabase Auth. Role changes are server-enforced — users cannot
          escalate themselves from the browser.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Staff</CardTitle>
          <CardDescription>{rows.length} profiles</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(row => (
                <TableRow key={row.user_id}>
                  <TableCell className='font-medium'>{row.display_name || '—'}</TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>
                    <Badge variant='outline'>{row.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant='outline'>{row.status}</Badge>
                  </TableCell>
                  <TableCell className='text-muted-foreground'>
                    {new Date(row.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className='text-muted-foreground'>
                    {row.last_activity_at
                      ? new Date(row.last_activity_at).toLocaleString()
                      : '—'}
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='text-muted-foreground'>
                    No staff profiles yet. Run the bootstrap script after configuring Supabase.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminsPage
