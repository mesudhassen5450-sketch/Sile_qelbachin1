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
type ReminderRow = {
  id: string
  title_en: string | null
  title_am: string | null
  description_en: string | null
  description_am: string | null
  status: string
  priority?: number | null
  featured?: boolean | null
  scheduled_at?: string | null
  updated_at: string
}

type RemindersPageProps = {
  /** When used under Content → 1-Minute → Text */
  mode?: 'home' | 'one_minute'
  title?: string
  description?: string
}

function toLocalInputValue(iso: string | null | undefined): string {
  if (!iso) return ''
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return ''
  const d = new Date(t)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const RemindersPage = ({
  mode = 'home',
  title,
  description,
}: RemindersPageProps) => {
  const isOneMinute = mode === 'one_minute'
  const pageTitle = title || (isOneMinute ? '1-Minute Text' : 'Reminders')
  const pageDescription =
    description ||
    (isOneMinute
      ? 'Short text slides for the public 1-Minute feed. Priority, featured, publish, schedule, archive.'
      : 'Appears on Articles, Da’wah → Reminders, and Library → Reminders. Mark Featured for the compact home title list (top 4). Saves permanently to Supabase/R2 — run migration 006 once.')

  const [rows, setRows] = useState<ReminderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [titleEn, setTitleEn] = useState('')
  const [titleAm, setTitleAm] = useState('')
  const [descEn, setDescEn] = useState('')
  const [descAm, setDescAm] = useState('')
  const [priority, setPriority] = useState('1')
  const [featured, setFeatured] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')
  const [status, setStatus] = useState('published')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/reminders', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to load')
      const list = ((data.rows as ReminderRow[]) || []).slice()
      list.sort((a, b) => {
        const pa = a.priority ?? 9999
        const pb = b.priority ?? 9999
        if (pa !== pb) return pa - pb
        const fa = a.featured ? 1 : 0
        const fb = b.featured ? 1 : 0
        if (fa !== fb) return fb - fa
        return Date.parse(b.updated_at || '') - Date.parse(a.updated_at || '')
      })
      setRows(list)
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
    setPriority(String(rows.length + 1))
    setFeatured(false)
    setScheduledAt('')
    setStatus('published')
  }

  const openCreate = () => {
    resetForm()
    setPriority('1')
    setOpen(true)
  }

  const openEdit = (row: ReminderRow) => {
    setEditId(row.id)
    setTitleEn(row.title_en || '')
    setTitleAm(row.title_am || '')
    setDescEn(row.description_en || '')
    setDescAm(row.description_am || '')
    setPriority(String(row.priority ?? rows.length + 1))
    setFeatured(Boolean(row.featured))
    setScheduledAt(toLocalInputValue(row.scheduled_at))
    setStatus(row.status || 'published')
    setOpen(true)
  }

  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      const body: Record<string, unknown> = {
        id: editId || undefined,
        title_en: titleEn || null,
        title_am: titleAm || null,
        description_en: descEn || null,
        description_am: descAm || null,
        status: status || 'published',
        priority: Number(priority) || 1,
        featured,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
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

  const setRowStatus = async (row: ReminderRow, next: string) => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/reminders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, status: next })
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Status update failed')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  const remove = async (row: ReminderRow) => {
    const label = row.title_en || row.title_am || 'this item'
    if (
      !window.confirm(
        `Delete "${label}"?\n\nIt will disappear from Da’wah and Library reminders.`
      )
    )
      return
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
          <h1 className='text-xl font-semibold tracking-tight sm:text-2xl'>{pageTitle}</h1>
          <p className='text-muted-foreground mt-1 max-w-xl text-sm'>{pageDescription}</p>
        </div>
        <Button
          type='button'
          size='sm'
          className='bg-primary text-primary-foreground shrink-0'
          onClick={openCreate}
        >
          <PlusIcon className='size-4' />
          {isOneMinute ? 'Add text' : 'Add Reminder'}
        </Button>
      </div>

      {error ? (
        <Card>
          <CardContent className='text-destructive py-4 text-sm'>{error}</CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className='p-4 pb-2'>
          <CardTitle className='text-base'>
            {isOneMinute ? '1-Minute text slides' : 'Articles + Da’wah + Library'}
          </CardTitle>
          <CardDescription>
            {loading ? 'Loading…' : `${rows.length} item${rows.length === 1 ? '' : 's'}`}
          </CardDescription>
        </CardHeader>
        <CardContent className='p-3 sm:p-4'>
          <div className='grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
            {rows.map(row => (
              <Card key={row.id} className='overflow-hidden border-border/80 shadow-sm'>
                <CardHeader className='space-y-1 p-3 pb-1'>
                  <CardTitle className='line-clamp-2 text-sm leading-snug'>
                    {row.title_en || row.title_am || '—'}
                  </CardTitle>
                  <CardDescription className='line-clamp-2 text-xs'>
                    {row.description_en || row.description_am || '—'}
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-2 p-3 pt-1'>
                  <div className='flex flex-wrap gap-1'>
                    <Badge variant='outline' className='text-[10px]'>
                      {row.status}
                    </Badge>
                    <Badge variant='secondary' className='text-[10px]'>
                      P{row.priority ?? rows.length}
                    </Badge>
                    {row.featured ? (
                      <Badge className='bg-amber-600/90 text-[10px] text-white'>Featured</Badge>
                    ) : null}
                  </div>
                  {row.updated_at ? (
                    <p className='text-muted-foreground text-[10px]'>
                      {new Date(row.updated_at).toLocaleString()}
                    </p>
                  ) : null}
                  <div className='flex flex-wrap gap-1'>
                    <Button type='button' size='sm' variant='outline' onClick={() => openEdit(row)}>
                      <PencilIcon className='size-3.5' />
                      Edit
                    </Button>
                    {row.status !== 'published' ? (
                      <Button
                        type='button'
                        size='sm'
                        className='bg-primary text-primary-foreground'
                        disabled={busy}
                        onClick={() => void setRowStatus(row, 'published')}
                      >
                        Publish
                      </Button>
                    ) : (
                      <Button
                        type='button'
                        size='sm'
                        variant='ghost'
                        disabled={busy}
                        onClick={() => void setRowStatus(row, 'unpublished')}
                      >
                        Unpublish
                      </Button>
                    )}
                    {row.status !== 'archived' ? (
                      <Button
                        type='button'
                        size='sm'
                        variant='outline'
                        disabled={busy}
                        onClick={() => void setRowStatus(row, 'archived')}
                      >
                        Archive
                      </Button>
                    ) : null}
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
                </CardContent>
              </Card>
            ))}
            {!loading && rows.length === 0 ? (
              <Card className='sm:col-span-2 lg:col-span-3 xl:col-span-4'>
                <CardContent className='text-muted-foreground py-8 text-center text-sm'>
                  No items yet. Click <strong>{isOneMinute ? 'Add text' : 'Add Reminder'}</strong>{' '}
                  to create one.
                </CardContent>
              </Card>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={open}
        onOpenChange={o => {
          setOpen(o)
          if (!o) resetForm()
        }}
      >
        <DialogContent className='flex max-h-[92dvh] w-[calc(100%-1rem)] flex-col gap-4 overflow-hidden p-4 sm:max-w-lg sm:p-6'>
          <DialogHeader className='shrink-0 pr-8'>
            <DialogTitle>
              {editId
                ? isOneMinute
                  ? 'Edit text slide'
                  : 'Edit reminder'
                : isOneMinute
                  ? 'Add text slide'
                  : 'Add reminder'}
            </DialogTitle>
            <DialogDescription>
              {isOneMinute
                ? 'Appears as a text slide in the public 1-Minute Message feed.'
                : 'Shows on Articles, Da’wah → Reminders, and Library → Reminders. Featured items (top 4) show as titles only on the home page.'}
            </DialogDescription>
          </DialogHeader>
          <div className='min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pe-1'>
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
              <Textarea
                value={descEn}
                onChange={e => setDescEn(e.target.value)}
                rows={8}
                className='max-h-[40vh] min-h-[8rem] overflow-y-auto'
              />
            </Field>
            <Field>
              <FieldLabel>Description (AM)</FieldLabel>
              <Textarea
                value={descAm}
                onChange={e => setDescAm(e.target.value)}
                rows={8}
                className='max-h-[40vh] min-h-[8rem] overflow-y-auto'
              />
            </Field>
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
              <Field>
                <FieldLabel>Priority (1 = highest)</FieldLabel>
                <Input
                  type='number'
                  min={1}
                  max={9999}
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel>Status</FieldLabel>
                <select
                  className='border-input bg-background h-9 w-full rounded-md border px-3 text-sm'
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                >
                  <option value='published'>published</option>
                  <option value='draft'>draft</option>
                  <option value='unpublished'>unpublished</option>
                  <option value='archived'>archived</option>
                </select>
              </Field>
            </div>
            <Field>
              <FieldLabel>Schedule (optional)</FieldLabel>
              <Input
                type='datetime-local'
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
              />
            </Field>
            <label className='flex items-center gap-2 text-sm'>
              <input
                type='checkbox'
                checked={featured}
                onChange={e => setFeatured(e.target.checked)}
              />
              {isOneMinute
                ? 'Featured'
                : 'Featured on home (title only — up to 4)'}
            </label>
          </div>
          <DialogFooter className='shrink-0 gap-2 border-t border-border pt-3'>
            <Button type='button' variant='outline' onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type='button'
              className='bg-primary text-primary-foreground'
              disabled={busy}
              onClick={() => void save()}
            >
              {busy ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default RemindersPage
