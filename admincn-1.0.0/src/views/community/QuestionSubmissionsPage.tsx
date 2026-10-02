'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArchiveIcon,
  EyeIcon,
  InboxIcon,
  MoreHorizontalIcon,
  SendIcon,
  Trash2Icon,
  UserPlusIcon,
  XCircleIcon,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAdminLocale } from '@/context/AdminLocaleContext'
import { R2FileField, type UploadedAsset } from '@/views/content/R2FileField'

type QuestionStatus =
  | 'new'
  | 'assigned'
  | 'in_review'
  | 'answered'
  | 'user_replied'
  | 'closed'
  | 'archived'

type Row = {
  id: string
  auth_email: string
  name: string | null
  category: string
  question: string
  status: QuestionStatus | string
  assigned_to: string | null
  greeting: string | null
  answer: string | null
  description: string | null
  cover_url: string | null
  audio_url: string | null
  video_url: string | null
  published_public: boolean
  email_sent: boolean
  email_error: string | null
  created_at: string
  answered_at: string | null
}

const STATUS_FILTERS: Array<{ id: string; en: string; am: string }> = [
  { id: 'all', en: 'All', am: 'ሁሉም' },
  { id: 'new', en: 'New', am: 'አዲስ' },
  { id: 'assigned', en: 'Assigned', am: 'ተመድቧል' },
  { id: 'in_review', en: 'In Review', am: 'በግምገማ' },
  { id: 'answered', en: 'Answered', am: 'ተመልሷል' },
  { id: 'user_replied', en: 'User Replied', am: 'ተጠቃሚ መልሷል' },
  { id: 'closed', en: 'Closed', am: 'ተዘግቷል' },
  { id: 'archived', en: 'Archived', am: 'ተቀምጧል' },
]

const OPEN = new Set(['new', 'assigned', 'in_review', 'user_replied'])

function statusLabel(status: string, t: (v: { en: string; am: string }) => string) {
  const hit = STATUS_FILTERS.find(s => s.id === status)
  return hit ? t({ en: hit.en, am: hit.am }) : status
}

export default function QuestionSubmissionsPage() {
  const { t } = useAdminLocale()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [viewRow, setViewRow] = useState<Row | null>(null)
  const [active, setActive] = useState<Row | null>(null)
  const [assignRow, setAssignRow] = useState<Row | null>(null)
  const [assignTo, setAssignTo] = useState('')
  const [greeting, setGreeting] = useState('')
  const [answer, setAnswer] = useState('')
  const [description, setDescription] = useState('')
  const [cover, setCover] = useState<UploadedAsset | null>(null)
  const [audio, setAudio] = useState<UploadedAsset | null>(null)
  const [video, setVideo] = useState<UploadedAsset | null>(null)
  const [publishPublic, setPublishPublic] = useState(false)
  const [busy, setBusy] = useState(false)
  const [info, setInfo] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/questions', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to load')
      const list = (data.rows || []) as Row[]
      list.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
      setRows(list)
      void fetch('/api/admin/questions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_seen_all' }),
      }).catch(() => {})
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
    const timer = window.setInterval(() => void load(), 30000)
    return () => window.clearInterval(timer)
  }, [load])

  const markSeen = async (id: string) => {
    try {
      await fetch('/api/admin/questions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_seen', id }),
      })
    } catch {
      /* ignore */
    }
  }

  const patchAction = async (payload: Record<string, unknown>) => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/questions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Action failed')
      await load()
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      return null
    } finally {
      setBusy(false)
    }
  }

  const openCount = rows.filter(r => OPEN.has(r.status)).length
  const isOpen = (row: Row) => OPEN.has(row.status)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter(row => {
      if (filter !== 'all' && row.status !== filter) return false
      if (!q) return true
      return (
        row.auth_email.toLowerCase().includes(q) ||
        (row.name || '').toLowerCase().includes(q) ||
        row.question.toLowerCase().includes(q) ||
        row.category.toLowerCase().includes(q) ||
        (row.assigned_to || '').toLowerCase().includes(q)
      )
    })
  }, [rows, filter, search])

  const openView = (row: Row) => {
    setViewRow(row)
    if (isOpen(row)) void markSeen(row.id)
  }

  const openAnswer = (row: Row) => {
    setActive(row)
    if (isOpen(row)) void markSeen(row.id)
    setGreeting(row.greeting || '')
    setAnswer(row.answer || '')
    setDescription(row.description || '')
    setCover(row.cover_url ? { id: 'existing', public_url: row.cover_url, object_key: 'cover' } : null)
    setAudio(row.audio_url ? { id: 'existing', public_url: row.audio_url, object_key: 'audio' } : null)
    setVideo(row.video_url ? { id: 'existing', public_url: row.video_url, object_key: 'video' } : null)
    setPublishPublic(Boolean(row.published_public))
    setInfo(null)
  }

  const submitAnswer = async () => {
    if (!active) return
    setBusy(true)
    setInfo(null)
    setError(null)
    try {
      const res = await fetch('/api/admin/questions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: active.id,
          greeting,
          answer,
          description,
          cover_url: cover?.public_url || null,
          audio_url: audio?.public_url || null,
          video_url: video?.public_url || null,
          publish_public: publishPublic,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed')
      setInfo(data.message || t({ en: 'Saved.', am: 'ተቀምጧል።' }))
      setActive(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  const removeRow = async (row: Row) => {
    if (
      !window.confirm(
        t({
          en: `Delete question from ${row.auth_email}?`,
          am: `የ ${row.auth_email} ጥያቄ ይሰረዝ?`,
        })
      )
    ) {
      return
    }
    await patchAction({ id: row.id, action: 'delete' })
  }

  const submitAssign = async () => {
    if (!assignRow) return
    const data = await patchAction({
      id: assignRow.id,
      action: 'assign',
      assigned_to: assignTo.trim() || null,
    })
    if (data) setAssignRow(null)
  }

  const friendlyInfo = (msg: string | null) => {
    if (!msg) return null
    if (
      msg.toLowerCase().includes('email_user') ||
      msg.toLowerCase().includes('email_pass') ||
      msg.toLowerCase().includes('email not configured')
    ) {
      return t({
        en: 'Answer saved. Email is not set up — set RESEND_API_KEY (and EMAIL_FROM) on Admin Render env, then redeploy.',
        am: 'መልሱ ተቀምጧል። ኢሜይል ገና አልተዘጋጀም — በ Render Admin env ውስጥ RESEND_API_KEY (እና EMAIL_FROM) ያስገቡና እንደገና ያሰማሩ።',
      })
    }
    return msg
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 px-3 py-4 sm:px-4 md:px-6">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <InboxIcon className="size-5 shrink-0 text-primary" />
          <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
            {t({ en: 'Question inbox', am: 'የጥያቄ ማስገቢያ' })}
          </h1>
          {openCount > 0 ? (
            <Badge className="bg-red-600 text-white hover:bg-red-600">
              {openCount} {t({ en: 'OPEN', am: 'ክፍት' })}
            </Badge>
          ) : null}
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {t({
            en: 'Private submissions only. Search, filter, assign, reply, close — never public by default.',
            am: 'የግል ጥያቄዎች ብቻ። ፈልጉ፣ ያጣሩ፣ ይመድቡ፣ ይመልሱ፣ ይዝጉ — በነባሪ አይታተሙም።',
          })}
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t({ en: 'Search email, name, question…', am: 'ኢሜይል፣ ስም፣ ጥያቄ ፈልግ…' })}
          className="sm:flex-1"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map(s => (
          <Button
            key={s.id}
            type="button"
            size="sm"
            variant={filter === s.id ? 'default' : 'outline'}
            onClick={() => setFilter(s.id)}
          >
            {t({ en: s.en, am: s.am })}
          </Button>
        ))}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {info ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          {friendlyInfo(info)}
        </p>
      ) : null}

      {loading ? (
        <p className="text-muted-foreground text-sm">{t({ en: 'Loading…', am: 'በመጫን…' })}</p>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t({ en: 'No questions match.', am: 'ምንም ጥያቄ አልተገኘም።' })}
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {filtered.map(row => (
            <li key={row.id}>
              <Card
                className={`overflow-hidden ${
                  row.status === 'new' ? 'border-red-600/50 bg-red-950/20' : ''
                }`}
              >
                <CardHeader className="space-y-2 p-4 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {row.status === 'new' ? (
                          <Badge className="bg-red-600 text-white hover:bg-red-600">NEW</Badge>
                        ) : (
                          <Badge variant="secondary">{statusLabel(row.status, t)}</Badge>
                        )}
                        <span className="text-muted-foreground text-xs">
                          {new Date(row.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="truncate font-mono text-xs">{row.auth_email}</p>
                      <p className="text-muted-foreground text-xs">
                        {row.category}
                        {row.assigned_to ? ` · ${row.assigned_to}` : ''}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background hover:bg-accent"
                        aria-label={t({ en: 'Actions', am: 'እርምጃዎች' })}
                      >
                        <MoreHorizontalIcon className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => openView(row)}>
                          <EyeIcon className="size-4" />
                          {t({ en: 'View', am: 'ይመልከቱ' })}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openAnswer(row)}>
                          <SendIcon className="size-4" />
                          {row.status === 'answered'
                            ? t({ en: 'Edit answer', am: 'መልስ አርትዕ' })
                            : t({ en: 'Answer', am: 'መልስ ይስጡ' })}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setAssignRow(row)
                            setAssignTo(row.assigned_to || '')
                          }}
                        >
                          <UserPlusIcon className="size-4" />
                          {t({ en: 'Assign', am: 'መድብ' })}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={busy}
                          onClick={() =>
                            void patchAction({
                              id: row.id,
                              action: 'set_status',
                              status: 'in_review',
                            })
                          }
                        >
                          {t({ en: 'Mark In Review', am: 'በግምገማ ምልክት' })}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={busy}
                          onClick={() => void patchAction({ id: row.id, action: 'close' })}
                        >
                          <XCircleIcon className="size-4" />
                          {t({ en: 'Close', am: 'ዝጋ' })}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={busy}
                          onClick={() => void patchAction({ id: row.id, action: 'archive' })}
                        >
                          <ArchiveIcon className="size-4" />
                          {t({ en: 'Archive', am: 'አስቀምጥ' })}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          disabled={busy}
                          onClick={() => void removeRow(row)}
                        >
                          <Trash2Icon className="size-4" />
                          {t({ en: 'Delete', am: 'ሰርዝ' })}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 p-4 pt-0">
                  <p className="line-clamp-3 text-sm font-semibold leading-snug">{row.question}</p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="flex-1"
                      onClick={() => openAnswer(row)}
                    >
                      {row.status === 'answered'
                        ? t({ en: 'Edit answer', am: 'መልስ አርትዕ' })
                        : t({ en: 'Answer', am: 'መልስ ይስጡ' })}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => openView(row)}
                    >
                      {t({ en: 'View', am: 'ይመልከቱ' })}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={Boolean(viewRow)} onOpenChange={open => !open && setViewRow(null)}>
        <DialogContent className="max-h-[90vh] w-[calc(100%-1.5rem)] max-w-lg overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t({ en: 'Full question', am: 'ሙሉ ጥያቄ' })}</DialogTitle>
            <DialogDescription>
              {viewRow?.name ? `${viewRow.name} · ` : ''}
              <span className="font-mono">{viewRow?.auth_email}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-wide">
              {viewRow ? statusLabel(viewRow.status, t) : ''} · {viewRow?.category}
            </p>
            <p className="rounded-xl border bg-muted/40 p-4 text-base font-semibold leading-relaxed whitespace-pre-wrap">
              {viewRow?.question}
            </p>
            {viewRow?.answer ? (
              <div className="rounded-xl border p-4 space-y-1">
                <p className="text-muted-foreground text-xs font-bold uppercase">
                  {t({ en: 'Answer on file', am: 'የተቀመጠ መልስ' })}
                </p>
                <p className="whitespace-pre-wrap">{viewRow.answer}</p>
              </div>
            ) : null}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setViewRow(null)}>
              {t({ en: 'Close', am: 'ዝጋ' })}
            </Button>
            <Button
              onClick={() => {
                if (!viewRow) return
                setViewRow(null)
                openAnswer(viewRow)
              }}
            >
              {t({ en: 'Answer', am: 'መልስ ይስጡ' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(assignRow)} onOpenChange={open => !open && setAssignRow(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t({ en: 'Assign question', am: 'ጥያቄ መድብ' })}</DialogTitle>
            <DialogDescription>
              {t({
                en: 'Assign to an Ustaz or admin (email or name). Status becomes Assigned.',
                am: 'ለኡስታዝ ወይም አስተዳዳሪ ይመድቡ። ሁኔታው Assigned ይሆናል።',
              })}
            </DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel>{t({ en: 'Assignee', am: 'ተመዳጅ' })}</FieldLabel>
            <Input
              value={assignTo}
              onChange={e => setAssignTo(e.target.value)}
              placeholder="ustaz@example.com"
            />
          </Field>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAssignRow(null)}>
              {t({ en: 'Cancel', am: 'ሰርዝ' })}
            </Button>
            <Button disabled={busy} onClick={() => void submitAssign()}>
              {t({ en: 'Save', am: 'አስቀምጥ' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(active)} onOpenChange={open => !open && setActive(null)}>
        <DialogContent className="max-h-[92vh] w-[calc(100%-1.5rem)] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t({ en: 'Answer question', am: 'መልስ ይስጡ' })}</DialogTitle>
            <DialogDescription>
              {t({ en: 'Reply goes to', am: 'መልሱ ይላካል ወደ' })}{' '}
              <span className="font-mono">{active?.auth_email}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-wide">
                {t({ en: 'Visitor question', am: 'የጎብኚ ጥያቄ' })}
              </p>
              <p className="font-semibold whitespace-pre-wrap leading-relaxed">{active?.question}</p>
            </div>

            <Field>
              <FieldLabel>{t({ en: 'Greeting (optional)', am: 'ሰላምታ (አማራጭ)' })}</FieldLabel>
              <Input
                value={greeting}
                onChange={e => setGreeting(e.target.value)}
                placeholder={t({
                  en: 'e.g. Assalamu alaikum',
                  am: 'ምሳሌ፦ አሰላሙ አለይኩም',
                })}
              />
            </Field>

            <Field>
              <FieldLabel>{t({ en: 'Your answer *', am: 'መልስዎ *' })}</FieldLabel>
              <Textarea
                rows={6}
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                placeholder={t({
                  en: 'Write a clear, respectful answer…',
                  am: 'ግልጽና አክባሪ መልስ ይጻፉ…',
                })}
              />
            </Field>

            <Field>
              <FieldLabel>{t({ en: 'Description (optional)', am: 'መግለጫ (አማራጭ)' })}</FieldLabel>
              <Textarea
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={t({ en: 'Short note…', am: 'አጭር ማስታወሻ…' })}
              />
            </Field>

            <R2FileField
              label={t({ en: 'Cover image', am: 'ሽፋን ምስል' })}
              accept="image/*"
              folder="staff-uploads/questions/covers"
              value={cover}
              onChange={setCover}
            />
            <R2FileField
              label={t({ en: 'Audio', am: 'ድምጽ' })}
              accept="audio/*"
              folder="staff-uploads/questions/audio"
              value={audio}
              onChange={setAudio}
            />
            <R2FileField
              label={t({ en: 'Video', am: 'ቪዲዮ' })}
              accept="video/*"
              folder="staff-uploads/questions/video"
              value={video}
              onChange={setVideo}
            />

            <label className="flex cursor-pointer items-start gap-2 rounded-lg border p-3">
              <input
                type="checkbox"
                className="mt-1"
                checked={publishPublic}
                onChange={e => setPublishPublic(e.target.checked)}
              />
              <span className="text-sm">
                <span className="block font-semibold">
                  {t({
                    en: 'Also publish anonymized copy on public Q&A (explicit only)',
                    am: 'በግልጽ ብቻ — በድረ-ገጽ ታትም',
                  })}
                </span>
              </span>
            </label>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="ghost" className="w-full sm:w-auto" onClick={() => setActive(null)}>
              {t({ en: 'Cancel', am: 'ሰርዝ' })}
            </Button>
            <Button
              className="w-full sm:w-auto"
              disabled={busy || !answer.trim()}
              onClick={() => void submitAnswer()}
            >
              <SendIcon className="size-4" />
              {busy
                ? t({ en: 'Sending…', am: 'በመላክ…' })
                : t({ en: 'Save & email', am: 'አስቀምጥና ላክ' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
