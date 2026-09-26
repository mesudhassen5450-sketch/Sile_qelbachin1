'use client'

import { useCallback, useEffect, useState } from 'react'
import { CheckIcon, CopyIcon, MoreHorizontalIcon, PlusIcon, RefreshCwIcon } from 'lucide-react'

import { useAuth } from '@/components/auth/AuthProvider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  STAFF_ROLE_META,
  STAFF_ROLES,
  STAFF_STATUSES,
  type StaffRole,
  type StaffStatus
} from '@/lib/auth/permissions'
import { MIN_PASSWORD_LENGTH } from '@/lib/auth/password'

type StaffRow = {
  user_id: string
  display_name: string | null
  email: string
  role: StaffRole
  status: StaffStatus
  created_at: string
  last_activity_at: string | null
  must_change_password: boolean
}

function statusVariant(status: StaffStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'active') return 'default'
  if (status === 'pending') return 'secondary'
  if (status === 'disabled' || status === 'suspended') return 'destructive'
  return 'outline'
}

const AdminsPage = () => {
  const { can, loading: authLoading, profile } = useAuth()
  const [rows, setRows] = useState<StaffRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<StaffRow | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState<StaffRole>('content_admin')
  const [status, setStatus] = useState<StaffStatus>('active')
  const [tempPassword, setTempPassword] = useState('')
  const [autoPassword, setAutoPassword] = useState(true)

  const [revealPassword, setRevealPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    if (authLoading) {
      setLoading(true)
      return
    }
    if (!can('admins.view')) {
      setError(
        'Access denied. Only Super Admin can manage staff. Sign out and sign in again after bootstrap.'
      )
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/staff', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setError(data.error || 'Unable to load admins.')
        return
      }
      setRows(data.rows || [])
    } catch {
      setError('Unable to load admins.')
    } finally {
      setLoading(false)
    }
  }, [authLoading, can])

  useEffect(() => {
    void load()
  }, [load])

  const resetAddForm = () => {
    setEmail('')
    setDisplayName('')
    setRole('content_admin')
    setStatus('active')
    setTempPassword('')
    setAutoPassword(true)
    setFormError(null)
  }

  const openEdit = (row: StaffRow) => {
    setEditing(row)
    setDisplayName(row.display_name || '')
    setRole(row.role)
    setStatus(row.status)
    setFormError(null)
    setEditOpen(true)
  }

  const copyPassword = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!can('admins.manage')) return
    setSaving(true)
    setFormError(null)
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          display_name: displayName,
          role,
          status,
          temporary_password: autoPassword ? undefined : tempPassword
        })
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setFormError(data.error || 'Create failed.')
        return
      }
      setAddOpen(false)
      resetAddForm()
      if (data.temporary_password) setRevealPassword(data.temporary_password)
      await load()
    } catch {
      setFormError('Create failed.')
    } finally {
      setSaving(false)
    }
  }

  const onUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing || !can('admins.manage')) return
    setSaving(true)
    setFormError(null)
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: editing.user_id,
          display_name: displayName,
          role,
          status
        })
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setFormError(data.error || 'Update failed.')
        return
      }
      setEditOpen(false)
      setEditing(null)
      await load()
    } catch {
      setFormError('Update failed.')
    } finally {
      setSaving(false)
    }
  }

  const setRowStatus = async (row: StaffRow, next: StaffStatus) => {
    if (!can('admins.manage')) return
    const res = await fetch('/api/admin/staff', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: row.user_id, status: next })
    })
    const data = await res.json()
    if (!res.ok || !data.ok) {
      setError(data.error || 'Status update failed.')
      return
    }
    await load()
  }

  const resetPassword = async (row: StaffRow) => {
    if (!can('admins.manage')) return
    if (!window.confirm(`Generate a new temporary password for ${row.email}?`)) return
    const res = await fetch('/api/admin/staff', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: row.user_id, reset_temporary_password: true })
    })
    const data = await res.json()
    if (!res.ok || !data.ok) {
      setError(data.error || 'Password reset failed.')
      return
    }
    if (data.temporary_password) setRevealPassword(data.temporary_password)
    await load()
  }

  const removeStaff = async (row: StaffRow) => {
    if (!can('admins.manage')) return
    if (
      !window.confirm(
        `Permanently remove ${row.email} from Admin and Auth? This cannot be undone.`
      )
    ) {
      return
    }
    const res = await fetch('/api/admin/staff', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: row.user_id })
    })
    const data = await res.json()
    if (!res.ok || !data.ok) {
      setError(data.error || 'Delete failed.')
      return
    }
    await load()
  }

  if (authLoading || loading) {
    return (
      <Card>
        <CardContent className='text-muted-foreground py-6 text-sm'>Loading…</CardContent>
      </Card>
    )
  }

  if (error && rows.length === 0) {
    return (
      <Card>
        <CardContent className='text-destructive py-6 text-sm'>{error}</CardContent>
      </Card>
    )
  }

  const canManage = can('admins.manage')
  const roleHelp = STAFF_ROLE_META[role]

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight'>Admins</h1>
          <p className='text-muted-foreground mt-1 max-w-2xl text-sm'>
            Create staff with roles. Content and media roles publish through this Admin CMS; the
            website and mobile apps read published content from the public API (they do not use
            staff login).
          </p>
        </div>
        <div className='flex gap-2'>
          <Button type='button' variant='outline' size='sm' onClick={() => void load()} disabled={loading}>
            <RefreshCwIcon className='size-4' />
            Refresh
          </Button>
          {canManage ? (
            <Button
              type='button'
              size='sm'
              onClick={() => {
                resetAddForm()
                setAddOpen(true)
              }}
            >
              <PlusIcon className='size-4' />
              Add staff
            </Button>
          ) : null}
        </div>
      </div>

      {error ? <p className='text-destructive text-sm'>{error}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Staff</CardTitle>
          <CardDescription>
            {loading ? 'Loading…' : `${rows.length} profile${rows.length === 1 ? '' : 's'}`}
          </CardDescription>
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
                {canManage ? <TableHead className='w-12' /> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(row => (
                <TableRow key={row.user_id}>
                  <TableCell className='font-medium'>
                    {row.display_name || '—'}
                    {row.must_change_password ? (
                      <span className='text-muted-foreground ml-2 text-xs'>must change password</span>
                    ) : null}
                  </TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>
                    <Badge variant='outline'>{STAFF_ROLE_META[row.role]?.label || row.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
                  </TableCell>
                  <TableCell className='text-muted-foreground'>
                    {new Date(row.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className='text-muted-foreground'>
                    {row.last_activity_at ? new Date(row.last_activity_at).toLocaleString() : '—'}
                  </TableCell>
                  {canManage ? (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={<Button variant='ghost' size='icon-sm' aria-label='Staff actions' />}
                        >
                          <MoreHorizontalIcon className='size-4' />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem onClick={() => openEdit(row)}>Edit role & status</DropdownMenuItem>
                          {row.status !== 'active' ? (
                            <DropdownMenuItem onClick={() => void setRowStatus(row, 'active')}>
                              Activate
                            </DropdownMenuItem>
                          ) : null}
                          {row.status === 'active' && row.user_id !== profile?.user_id ? (
                            <DropdownMenuItem onClick={() => void setRowStatus(row, 'disabled')}>
                              Disable
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuItem onClick={() => void resetPassword(row)}>
                            Reset temporary password
                          </DropdownMenuItem>
                          {row.user_id !== profile?.user_id ? (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant='destructive'
                                onClick={() => void removeStaff(row)}
                              >
                                Delete staff
                              </DropdownMenuItem>
                            </>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
              {!loading && rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canManage ? 7 : 6} className='text-muted-foreground'>
                    No staff yet. Add your first content or media admin so they can publish for the
                    website and mobile apps.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add staff */}
      <Dialog
        open={addOpen}
        onOpenChange={open => {
          setAddOpen(open)
          if (!open) resetAddForm()
        }}
      >
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Add staff</DialogTitle>
            <DialogDescription>
              Creates a Supabase Auth user and staff profile. They sign in to Admin only — website
              and mobile stay public.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={e => void onCreate(e)} className='space-y-4'>
            <FieldGroup className='gap-4'>
              <Field>
                <FieldLabel htmlFor='staff-email'>Email*</FieldLabel>
                <Input
                  id='staff-email'
                  type='email'
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder='staff@example.com'
                  autoComplete='off'
                />
              </Field>
              <Field>
                <FieldLabel htmlFor='staff-name'>Display name</FieldLabel>
                <Input
                  id='staff-name'
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder='Optional'
                />
              </Field>
              <Field>
                <FieldLabel>Role*</FieldLabel>
                <Select value={role} onValueChange={v => setRole(v as StaffRole)}>
                  <SelectTrigger className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAFF_ROLES.map(r => (
                      <SelectItem key={r} value={r}>
                        {STAFF_ROLE_META[r].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className='text-muted-foreground mt-1.5 text-xs'>{roleHelp.summary}</p>
                <p className='text-muted-foreground text-xs'>
                  Surfaces: {roleHelp.surfaces.join(' · ')}
                </p>
              </Field>
              <Field>
                <FieldLabel>Status*</FieldLabel>
                <Select value={status} onValueChange={v => setStatus(v as StaffStatus)}>
                  <SelectTrigger className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAFF_STATUSES.map(s => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <label className='flex items-center gap-2 text-sm'>
                  <input
                    type='checkbox'
                    checked={autoPassword}
                    onChange={e => setAutoPassword(e.target.checked)}
                  />
                  Auto-generate temporary password
                </label>
              </Field>
              {!autoPassword ? (
                <Field>
                  <FieldLabel htmlFor='staff-temp-pw'>Temporary password*</FieldLabel>
                  <Input
                    id='staff-temp-pw'
                    type='text'
                    required={!autoPassword}
                    value={tempPassword}
                    onChange={e => setTempPassword(e.target.value)}
                    placeholder={`Min ${MIN_PASSWORD_LENGTH} chars, mixed case, number, symbol`}
                    autoComplete='new-password'
                  />
                </Field>
              ) : null}
            </FieldGroup>
            {formError ? (
              <p className='text-destructive text-sm' role='alert'>
                {formError}
              </p>
            ) : null}
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button type='submit' disabled={saving}>
                {saving ? 'Creating…' : 'Create staff'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit staff */}
      <Dialog
        open={editOpen}
        onOpenChange={open => {
          setEditOpen(open)
          if (!open) setEditing(null)
        }}
      >
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Edit staff</DialogTitle>
            <DialogDescription>{editing?.email}</DialogDescription>
          </DialogHeader>
          <form onSubmit={e => void onUpdate(e)} className='space-y-4'>
            <FieldGroup className='gap-4'>
              <Field>
                <FieldLabel htmlFor='edit-name'>Display name</FieldLabel>
                <Input
                  id='edit-name'
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel>Role</FieldLabel>
                <Select
                  value={role}
                  onValueChange={v => setRole(v as StaffRole)}
                  disabled={editing?.user_id === profile?.user_id}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAFF_ROLES.map(r => (
                      <SelectItem key={r} value={r}>
                        {STAFF_ROLE_META[r].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editing?.user_id === profile?.user_id ? (
                  <p className='text-muted-foreground mt-1 text-xs'>You cannot change your own role.</p>
                ) : (
                  <p className='text-muted-foreground mt-1.5 text-xs'>{STAFF_ROLE_META[role].summary}</p>
                )}
              </Field>
              <Field>
                <FieldLabel>Status</FieldLabel>
                <Select
                  value={status}
                  onValueChange={v => setStatus(v as StaffStatus)}
                  disabled={editing?.user_id === profile?.user_id}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAFF_STATUSES.map(s => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
            {formError ? (
              <p className='text-destructive text-sm' role='alert'>
                {formError}
              </p>
            ) : null}
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type='submit' disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* One-time password reveal */}
      <Dialog open={Boolean(revealPassword)} onOpenChange={open => !open && setRevealPassword(null)}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Temporary password</DialogTitle>
            <DialogDescription>
              Copy this once and share it securely. It will not be shown again. The staff member must
              change it on first login.
            </DialogDescription>
          </DialogHeader>
          <div className='bg-muted flex items-center gap-2 rounded-md p-3 font-mono text-sm break-all'>
            <span className='flex-1'>{revealPassword}</span>
            <Button
              type='button'
              size='icon-sm'
              variant='outline'
              onClick={() => revealPassword && void copyPassword(revealPassword)}
            >
              {copied ? <CheckIcon className='size-4' /> : <CopyIcon className='size-4' />}
            </Button>
          </div>
          <DialogFooter>
            <Button type='button' onClick={() => setRevealPassword(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminsPage
