'use client'

import { useCallback, useEffect, useState } from 'react'
import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'

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
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

type ReminderRow = {
  id: string
  title_en: string | null
  title_am: string | null
  description_en: string | null
  description_am: string | null
  status: string
  updated_at: string
}

const RemindersPage = () => {
  const [rows, setRows] = useState<ReminderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [titleEn, setTitleEn] = useState('')
  const [titleAm, setTitleAm] = useState('')
  const [descEn, setDescEn] = useState('')
  const [descAm, setDescAm] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/reminders', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to load')
      setRows(data.rows || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const resetForm = () => {
    setEditId(null)
    setTitleEn('')
    setTitleAm('')
    setDescEn('')
    setDescAm('')
  }

  const openCreate = () => {
    resetForm()
    setOpen(true)
  }

  const openEdit = (row: ReminderRow) => {
    setEditId(row.id)
    setTitleEn(row.title_en || '')
    setTitleAm(row.title_am || '')
    setDescEn(row.description_en || '')
    setDescAm(row.description_am || '')
    setOpen(true)
  }

  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      const body = {
        id: editId || undefined,
        title_en: titleEn || null,
        title_am: titleAm || null,
        description_en: descEn || null,
        description_am: descAm || null,
        status: 'published'
      }
      const res = await fetch('/api/admin/reminders', {
        method: editId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Save failed')
      setOpen(false)
      resetForm()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  const remove = async (row: ReminderRow) => {
    const label = row.title_en || row.title_am || 'this reminder'
    if (!window.confirm(`Delete "${label}"?\n\nIt will also disappear from the home page.`)) return
    setBusy(true)
    try {
      const res = await fetch('/api/admin/reminders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id })
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Delete failed')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className='mx-auto w-full max-w-5xl space-y-5'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <h1 className='text-xl font-semibold tracking-tight sm:text-2xl'>Reminders</h1>
          <p className='text-muted-foreground mt-1 max-w-xl text-sm'>
            Add a title and description for the home page reminder section (under About Our Hearts).
          </p>
        </div>
        <Button
          type='button'
          size='sm'
          className='bg-primary text-primary-foreground shrink-0'
          onClick={openCreate}
        >
          <PlusIcon className='size-4' />
          Add Reminder
        </Button>
      </div>

      {error ? (
        <Card>
          <CardContent className='text-destructive py-4 text-sm'>{error}</CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className='p-4 pb-2'>
          <CardTitle className='text-base'>Home page reminders</CardTitle>
          <CardDescription>
            {loading ? 'Loading…' : `${rows.length} reminder${rows.length === 1 ? '' : 's'}`}
          </CardDescription>
        </CardHeader>
        <CardContent className='overflow-x-auto p-2 sm:p-4'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className='min-w-[160px]'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(row => (
                <TableRow key={row.id}>
                  <TableCell className='font-medium'>
                    {row.title_en || row.title_am || '—'}
                  </TableCell>
                  <TableCell className='text-muted-foreground max-w-[280px] truncate'>
                    {row.description_en || row.description_am || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant='outline'>{row.status}</Badge>
                  </TableCell>
                  <TableCell className='text-muted-foreground text-xs whitespace-nowrap'>
                    {row.updated_at ? new Date(row.updated_at).toLocaleString() : '—'}
                  </TableCell>
                  <TableCell>
                    <div className='flex flex-wrap gap-1'>
                      <Button type='button' size='sm' variant='outline' onClick={() => openEdit(row)}>
                        <PencilIcon className='size-3.5' />
                        Edit
                      </Button>
                      <Button
                        type='button'
                        size='sm'
                        variant='destructive'
                        disabled={busy}
                        onClick={() => void remove(row)}
                      >
                        <Trash2Icon className='size-3.5' />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className='text-muted-foreground py-8 text-center text-sm'>
                    No reminders yet. Click <strong>Add Reminder</strong> to show one on the home page.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={open}
        onOpenChange={o => {
          setOpen(o)
          if (!o) resetForm()
        }}
      >
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit reminder' : 'Add reminder'}</DialogTitle>
            <DialogDescription>
              Title and description appear on the website home page under About Our Hearts.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-3'>
            <Field>
              <FieldLabel>Title (EN)</FieldLabel>
              <Input value={titleEn} onChange={e => setTitleEn(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel>Title (AM)</FieldLabel>
              <Input value={titleAm} onChange={e => setTitleAm(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel>Description (EN)</FieldLabel>
              <Textarea value={descEn} onChange={e => setDescEn(e.target.value)} rows={3} />
            </Field>
            <Field>
              <FieldLabel>Description (AM)</FieldLabel>
              <Textarea value={descAm} onChange={e => setDescAm(e.target.value)} rows={3} />
            </Field>
          </div>
          <DialogFooter className='gap-2'>
            <Button type='button' variant='outline' onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type='button'
              className='bg-primary text-primary-foreground'
              disabled={busy}
              onClick={() => void save()}
            >
              {busy ? 'Saving…' : 'Save & publish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default RemindersPage
