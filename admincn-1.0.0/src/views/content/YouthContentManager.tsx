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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type Kind = 'marriage' | 'articles' | 'questions'

type Row = {
  id: string
  title_en: string
  title_am: string
  excerpt_en: string
  body_en: string
  status: string
  updated_at: string
}

const LABELS: Record<Kind, { title: string; desc: string }> = {
  marriage: {
    title: 'Marriage & Love',
    desc: 'Published topics shown on the website Marriage page.',
  },
  articles: {
    title: 'Articles',
    desc: 'Short heart-healing articles for the website Articles page.',
  },
  questions: {
    title: 'Q & A (published)',
    desc: 'Public answered questions for the website Q&A archive (not private inbox).',
  },
}

export default function YouthContentManager({ kind }: { kind: Kind }) {
  const meta = LABELS[kind]
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [titleEn, setTitleEn] = useState('')
  const [titleAm, setTitleAm] = useState('')
  const [excerptEn, setExcerptEn] = useState('')
  const [bodyEn, setBodyEn] = useState('')
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
    setBodyEn('')
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
          body_en: bodyEn,
          status: 'published',
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
    await fetch('/api/admin/youth-content', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, id }),
    })
    await load()
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
            <PlusIcon className="mr-2 size-4" />
            Add
          </Button>
        </CardHeader>
        <CardContent>
          {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(row => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.title_en || row.title_am}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{row.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(row.updated_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditId(row.id)
                          setTitleEn(row.title_en || '')
                          setTitleAm(row.title_am || '')
                          setExcerptEn(row.excerpt_en || '')
                          setBodyEn(row.body_en || '')
                          setOpen(true)
                        }}
                      >
                        <PencilIcon className="size-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => void remove(row.id)}>
                        <Trash2Icon className="size-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit' : 'Add'} {meta.title}</DialogTitle>
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
              <FieldLabel>Short excerpt</FieldLabel>
              <Textarea rows={2} value={excerptEn} onChange={e => setExcerptEn(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel>Body</FieldLabel>
              <Textarea rows={6} value={bodyEn} onChange={e => setBodyEn(e.target.value)} />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={busy} onClick={() => void save()}>
              {busy ? 'Saving…' : 'Publish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
