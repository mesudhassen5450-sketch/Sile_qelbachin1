'use client'

import { useCallback, useEffect, useState } from 'react'
import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { YouthKind } from '@/lib/cms/youth-content'

type Row = {
  id: string
  title_en: string
  title_am: string
  excerpt_en: string
  excerpt_am: string
  body_en: string
  body_am: string
  status: string
  featured?: boolean
  priority?: number
  scheduled_at?: string | null
  updated_at: string
}

const LABELS: Record<YouthKind, { title: string; desc: string }> = {
  marriage: {
    title: 'Marriage & Love',
    desc: 'Existing records on /marriage — priority, featured, publish, archive.',
  },
  articles: {
    title: 'Articles',
    desc: 'Existing articles on /articles — priority, featured, publish, archive.',
  },
  questions: {
    title: 'Q & A (published)',
    desc: 'Public Q&A on /questions. Private Ask-an-Ustaz stays under Community.',
  },
}

export default function YouthContentPage({ kind }: { kind: YouthKind }) {
  const meta = LABELS[kind]
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [titleEn, setTitleEn] = useState('')
  const [titleAm, setTitleAm] = useState('')
  const [excerptEn, setExcerptEn] = useState('')
  const [excerptAm, setExcerptAm] = useState('')
  const [bodyEn, setBodyEn] = useState('')
  const [bodyAm, setBodyAm] = useState('')
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('published')
  const [featured, setFeatured] = useState(false)
  const [priority, setPriority] = useState('1')
  const [scheduledAt, setScheduledAt] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/youth-content?kind=${kind}`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed')
      setRows(data.rows || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [kind])

  useEffect(() => {
    void load()
  }, [load])

  const reset = () => {
    setEditId(null)
    setTitleEn('')
    setTitleAm('')
    setExcerptEn('')
    setExcerptAm('')
    setBodyEn('')
    setBodyAm('')
    setStatus('published')
    setFeatured(false)
    setPriority('1')
    setScheduledAt('')
  }

  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/youth-content', {
        method: editId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          id: editId || undefined,
          title_en: titleEn,
          title_am: titleAm,
          excerpt_en: excerptEn,
          excerpt_am: excerptAm,
          body_en: bodyEn,
          body_am: bodyAm,
          status,
          featured,
          priority: Number(priority) || 1,
          scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Save failed')
      setOpen(false)
      reset()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this item?')) return
    const res = await fetch('/api/admin/youth-content', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, id }),
    })
    if (res.ok) await load()
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>{meta.title}</CardTitle>
            <CardDescription>{meta.desc}</CardDescription>
          </div>
          <Button
            onClick={() => {
              reset()
              setOpen(true)
            }}
          >
            <PlusIcon className="size-4" />
            Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items yet.</p>
          ) : (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map(row => (
                <Card key={row.id} className="overflow-hidden border-border/80 shadow-sm">
                  <CardHeader className="space-y-1 p-3 pb-1">
                    <CardTitle className="line-clamp-2 text-sm leading-snug">
                      {row.title_en || row.title_am}
                    </CardTitle>
                    <CardDescription className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-[10px]">
                        {row.status}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        P{row.priority ?? 100}
                      </Badge>
                      {row.featured ? (
                        <Badge className="bg-amber-600/90 text-[10px] text-white">Featured</Badge>
                      ) : null}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 p-3 pt-1">
                    <p className="text-muted-foreground text-[10px]">
                      {new Date(row.updated_at).toLocaleString()}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditId(row.id)
                          setTitleEn(row.title_en || '')
                          setTitleAm(row.title_am || '')
                          setExcerptEn(row.excerpt_en || '')
                          setExcerptAm(row.excerpt_am || '')
                          setBodyEn(row.body_en || '')
                          setBodyAm(row.body_am || '')
                          setStatus(
                            row.status === 'draft' || row.status === 'archived'
                              ? row.status
                              : 'published'
                          )
                          setFeatured(Boolean(row.featured))
                          setPriority(String(row.priority ?? 100))
                          setScheduledAt(
                            row.scheduled_at
                              ? new Date(row.scheduled_at).toISOString().slice(0, 16)
                              : ''
                          )
                          setOpen(true)
                        }}
                      >
                        <PencilIcon className="size-4" />
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => void remove(row.id)}>
                        <Trash2Icon className="size-4" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[min(94dvh,900px)] w-[calc(100%-0.75rem)] max-w-[min(100vw-1.5rem,48rem)] overflow-y-auto sm:max-w-2xl md:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editId ? 'Edit' : 'Add'} {meta.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Field>
              <FieldLabel>Title (EN)</FieldLabel>
              <Input value={titleEn} onChange={e => setTitleEn(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel>Title (AM)</FieldLabel>
              <Input value={titleAm} onChange={e => setTitleAm(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel>Short summary (EN)</FieldLabel>
              <Textarea rows={2} value={excerptEn} onChange={e => setExcerptEn(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel>Short summary (AM)</FieldLabel>
              <Textarea rows={2} value={excerptAm} onChange={e => setExcerptAm(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel>Body (EN)</FieldLabel>
              <Textarea rows={5} value={bodyEn} onChange={e => setBodyEn(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel>Body (AM)</FieldLabel>
              <Textarea rows={5} value={bodyAm} onChange={e => setBodyAm(e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel>Status</FieldLabel>
                <select
                  className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                  value={status}
                  onChange={e =>
                    setStatus(e.target.value as 'draft' | 'published' | 'archived')
                  }
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </Field>
              <Field>
                <FieldLabel>Priority (1 = highest)</FieldLabel>
                <Input
                  type="number"
                  min={1}
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                />
              </Field>
            </div>
            <Field>
              <FieldLabel>Schedule (optional)</FieldLabel>
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={featured}
                onChange={e => setFeatured(e.target.checked)}
                className="size-4 rounded border"
              />
              {kind === 'questions'
                ? 'Featured on home (Guidance — top 4 by priority)'
                : 'Featured on public lists'}
            </label>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={busy} onClick={() => void save()}>
              {busy ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
