'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  CloudDownloadIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon
} from 'lucide-react'

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
import AddContentDialog from '@/views/content/AddContentDialog'
import { KitabChildAudioEditor } from '@/views/content/KitabChildAudioEditor'
import { R2FileField } from '@/views/content/R2FileField'

type ContentType = 'kitabs' | 'ders' | 'audio' | 'video' | 'pdfs' | 'library' | 'sahabah'

type ContentListPageProps = {
  title: string
  description: string
  type: ContentType
  columns?: Array<'title' | 'meta' | 'status' | 'media' | 'updated'>
  /** Show Add button + create dialog (kitabs/audio/video/pdfs/sahabah). */
  allowCreate?: boolean
}

type Row = Record<string, unknown>

type UploadedAsset = {
  id: string
  public_url: string
  object_key: string
}

/** Parse Admin API JSON; 502/HTML deploy pages must not crash the UI. */
async function readApiJson(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text()
  try {
    return JSON.parse(text) as Record<string, unknown>
  } catch {
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      throw new Error(
        'Admin server is restarting (temporary). Wait 1–2 minutes, then click Refresh.'
      )
    }
    throw new Error(`Server error (${res.status || 'unknown'}). Refresh and try again.`)
  }
}

type R2Status = {
  ok: boolean
  bucket?: string
  secret_key_len?: number
  issues?: string[]
  fix?: string
}

const createKind = (
  type: ContentType
): 'kitabs' | 'audio' | 'video' | 'pdfs' | 'sahabah' | null => {
  if (type === 'kitabs' || type === 'audio' || type === 'video' || type === 'pdfs' || type === 'sahabah') {
    return type
  }
  return null
}

const ContentListPage = ({
  title,
  description,
  type,
  columns = ['title', 'meta', 'status', 'updated'],
  allowCreate
}: ContentListPageProps) => {
  const [rows, setRows] = useState<Row[]>([])
  const [count, setCount] = useState(0)
  const [q, setQ] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [viewRow, setViewRow] = useState<Row | null>(null)
  const [editRow, setEditRow] = useState<Row | null>(null)
  const [editTitleEn, setEditTitleEn] = useState('')
  const [editTitleAm, setEditTitleAm] = useState('')
  const [editAuthor, setEditAuthor] = useState('')
  const [editAuthorAm, setEditAuthorAm] = useState('')
  const [editDescEn, setEditDescEn] = useState('')
  const [editDescAm, setEditDescAm] = useState('')
  const [editCover, setEditCover] = useState<UploadedAsset | null>(null)
  const [editPdf, setEditPdf] = useState<UploadedAsset | null>(null)
  const [editMedia, setEditMedia] = useState<UploadedAsset | null>(null)
  const [r2Status, setR2Status] = useState<R2Status | null>(null)
  const [syncBusy, setSyncBusy] = useState(false)
  const [syncMsg, setSyncMsg] = useState<string | null>(null)
  const [saveOk, setSaveOk] = useState<string | null>(null)
  const kind = allowCreate === false ? null : createKind(type)
  const canAdd = Boolean(kind)
  const canManage = type !== 'library'
  const canSyncR2 =
    type === 'kitabs' || type === 'audio' || type === 'video' || type === 'pdfs' || type === 'library'

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (q.trim()) params.set('q', q.trim())
      const res = await fetch(`/api/admin/content/${type}?${params.toString()}`, {
        cache: 'no-store'
      })
      const data = await readApiJson(res)
      if (!res.ok || !data.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Failed to load')
      }
      setRows((data.rows as Row[]) || [])
      setCount(typeof data.count === 'number' ? data.count : 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [q, type])

  const loadR2 = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/media/r2-status', { cache: 'no-store' })
      const data = await res.json()
      setR2Status(data)
    } catch {
      setR2Status(null)
    }
  }, [])

  useEffect(() => {
    void load()
    void loadR2()
  }, [load, loadR2])

  const setStatus = async (id: string, status: 'published' | 'draft' | 'unpublished') => {
    if (type === 'library') return
    setBusyId(id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/content/${type}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Status update failed')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusyId(null)
    }
  }

  const openEdit = (row: Row) => {
    setEditRow(row)
    setEditTitleEn(String(row.title_en || row.name_en || row.title || ''))
    setEditTitleAm(String(row.title_am || row.name_am || ''))
    setEditAuthor(String(row.author_en || ''))
    setEditAuthorAm(String(row.author_am || ''))
    setEditDescEn(String(row.description_en || ''))
    setEditDescAm(String(row.description_am || ''))
    const coverId = row.cover_asset_id || row.thumbnail_asset_id
    const coverUrlVal = row.cover_url || row.thumbnail_url
    setEditCover(
      typeof coverId === 'string' && coverId
        ? {
            id: coverId,
            public_url: String(coverUrlVal || ''),
            object_key: String(row.cover_key || row.object_key || 'cover')
          }
        : null
    )
    const pdfId = row.pdf_asset_id || (type === 'pdfs' ? row.media_asset_id : null)
    setEditPdf(
      typeof pdfId === 'string' && pdfId
        ? {
            id: pdfId,
            public_url: String(row.pdf_url || row.media_url || ''),
            object_key: String(row.pdf_key || row.object_key || 'file.pdf')
          }
        : null
    )
    const mediaId = row.media_asset_id || row.video_asset_id || row.audio_asset_id
    setEditMedia(
      typeof mediaId === 'string' && mediaId
        ? {
            id: mediaId,
            public_url: String(row.media_url || row.audio_url || row.file_url || ''),
            object_key: String(row.object_key || 'media')
          }
        : null
    )
  }

  const patchContent = async (body: Record<string, unknown>) => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), 25000)
    try {
      const res = await fetch(`/api/admin/content/${type}?t=${Date.now()}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        cache: 'no-store',
        signal: controller.signal
      })
      const data = await readApiJson(res)
      if (!res.ok || !data.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Save failed')
      }
      return data as { ok: true; message?: string; row?: Record<string, unknown> }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new Error('Save timed out. Refresh the page and try again.')
      }
      throw err
    } finally {
      window.clearTimeout(timer)
    }
  }

  const closeEditDialog = () => {
    setBusyId(null)
    setEditRow(null)
  }

  /** Link cover/PDF as soon as upload finishes (do not wait for Save). */
  const linkAssetNow = async (
    field: 'cover' | 'pdf' | 'media',
    asset: UploadedAsset | null
  ) => {
    if (!editRow?.id || !asset?.id) return
    setError(null)
    try {
      const body: Record<string, unknown> = { id: editRow.id }
      if (field === 'cover') {
        body.cover_asset_id = asset.id
        body.cover_url = asset.public_url
        if (type === 'video') body.thumbnail_asset_id = asset.id
      } else if (field === 'pdf') {
        body.pdf_asset_id = asset.id
        body.pdf_url = asset.public_url
      } else {
        body.media_asset_id = asset.id
        if (type === 'video') body.video_asset_id = asset.id
      }
      await patchContent(body)
      setSaveOk(
        field === 'cover'
          ? 'Cover saved to database. It will show on Admin and the website.'
          : field === 'pdf'
            ? 'PDF saved to database.'
            : 'Media file saved to database.'
      )
      // Refresh list in background — do not block the edit dialog
      void load()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'File uploaded, but linking to this item failed. Click Save changes.'
      )
    }
  }

  const saveEdit = async () => {
    // Snapshot — dialog close must not wipe values mid-request
    const row = editRow
    const cover = editCover
    const pdf = editPdf
    const media = editMedia
    const titleEn = editTitleEn
    const titleAm = editTitleAm
    const authorEn = editAuthor
    const authorAm = editAuthorAm
    const descEn = editDescEn
    const descAm = editDescAm

    if (!row || type === 'library') return
    setBusyId(String(row.id))
    setError(null)
    setSaveOk(null)
    try {
      const body: Record<string, unknown> = {
        id: row.id,
        title_en: titleEn || null,
        title_am: titleAm || null,
        description_en: descEn || null,
        description_am: descAm || null
      }
      if (type === 'kitabs') {
        body.author_en = authorEn || null
        body.author_am = authorAm || null
        if (cover?.id) {
          body.cover_asset_id = cover.id
          body.cover_url = cover.public_url || null
        }
        if (pdf?.id) {
          body.pdf_asset_id = pdf.id
          body.pdf_url = pdf.public_url || null
        }
      }
      if (type === 'audio') {
        if (cover?.id) {
          body.cover_asset_id = cover.id
          body.cover_url = cover.public_url || null
        }
        if (media?.id) body.media_asset_id = media.id
      }
      if (type === 'video') {
        if (cover?.id) {
          body.cover_asset_id = cover.id
          body.thumbnail_asset_id = cover.id
          body.cover_url = cover.public_url || null
        }
        if (media?.id) body.video_asset_id = media.id
      }
      if (type === 'pdfs') {
        if (cover?.id) {
          body.cover_asset_id = cover.id
          body.cover_url = cover.public_url || null
        }
        if (pdf?.id) {
          body.pdf_asset_id = pdf.id
          body.pdf_url = pdf.public_url || null
        }
      }
      if (type === 'sahabah' && cover?.id) {
        body.cover_asset_id = cover.id
        body.cover_url = cover.public_url || null
      }

      const data = await patchContent(body)
      const savedTitle =
        (typeof data.row?.title_en === 'string' && data.row.title_en) ||
        (typeof data.row?.title_am === 'string' && data.row.title_am) ||
        titleEn ||
        titleAm ||
        'item'
      const coverLinked = Boolean(
        cover?.id || (data.row && (data.row as { cover_asset_id?: string }).cover_asset_id)
      )
      setSaveOk(
        `✓ Changes saved successfully — “${savedTitle}”${
          type === 'kitabs' ? (coverLinked ? ' (cover linked)' : ' (no cover)') : ''
        }. Website / app will show the update.`
      )
      setSyncMsg(null)
      setEditRow(null)
      setBusyId(null)
      void load()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setSaveOk(null)
      setBusyId(null)
    }
  }

  const syncFromR2 = async () => {
    setSyncBusy(true)
    setSyncMsg(null)
    setError(null)
    try {
      const res = await fetch('/api/admin/media/sync-r2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publish: true })
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Could not refresh library')
      const m = data.match
      setSyncMsg(
        `Library updated: ${data.scan?.total_r2_objects ?? 0} files checked · kitabs ${m?.kitabs?.updated ?? 0} · audio ${(m?.audio?.updated ?? 0) + (data.orphans?.audio_created ?? 0)} · video ${(m?.video?.updated ?? 0) + (data.orphans?.video_created ?? 0)} · PDFs ${(m?.pdfs?.updated ?? 0) + (data.orphans?.pdf_created ?? 0)}`
      )
      await load()
      await loadR2()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSyncBusy(false)
    }
  }

  const deleteRow = async (row: Row) => {
    if (type === 'library') return
    const label = String(row.title || row.name_en || row.slug || row.id)
    if (
      !window.confirm(
        `Delete "${label}"?\n\nThis removes it from Admin and from the website / app. Linked media files will also be removed.`
      )
    ) {
      return
    }
    setBusyId(String(row.id))
    setError(null)
    try {
      const res = await fetch(`/api/admin/content/${type}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, delete_r2: true })
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Delete failed')
      if (Array.isArray(data.skipped_r2) && data.skipped_r2.length) {
        setError(`Deleted, but some media files could not be removed. You can try again later.`)
      }
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusyId(null)
    }
  }

  const metaFor = (row: Row): string => {
    if (type === 'kitabs') {
      return `${row.ders_count_live ?? row.ders_count ?? 0} ders · ${row.author_en || row.author_am || ''}`
    }
    if (type === 'ders') return `${row.kitab_slug || ''} · #${row.ders_number || row.sort_order || ''}`
    if (type === 'audio' || type === 'video' || type === 'pdfs') {
      return String(row.category || row.object_key || row.kitab_slug || '—')
    }
    if (type === 'sahabah') return String(row.slug || '—')
    if (type === 'library') return String(row.media_type || '—')
    return '—'
  }

  const mediaFor = (row: Row): string => {
    return String(
      row.media_url || row.audio_url || row.pdf_url || row.cover_url || row.public_url || '—'
    )
  }

  const coverUrl = (row: Row): string | null => {
    const u = row.cover_url || row.thumbnail_url
    return typeof u === 'string' && u ? u : null
  }

  const ActionButtons = ({ row }: { row: Row }) => (
    <div className='flex flex-wrap items-center gap-1'>
      <Button
        type='button'
        size='sm'
        variant='outline'
        className='h-8 px-2'
        disabled={busyId === String(row.id)}
        onClick={() => setViewRow(row)}
        title='View'
      >
        <EyeIcon className='size-3.5' />
        <span className='sr-only sm:not-sr-only sm:ml-1'>View</span>
      </Button>
      {canManage ? (
        <>
          <Button
            type='button'
            size='sm'
            variant='outline'
            className='h-8 px-2'
            disabled={busyId === String(row.id)}
            onClick={() => openEdit(row)}
            title='Edit'
          >
            <PencilIcon className='size-3.5' />
            <span className='sr-only sm:not-sr-only sm:ml-1'>Edit</span>
          </Button>
          <Button
            type='button'
            size='sm'
            variant='destructive'
            className='h-8 px-2'
            disabled={busyId === String(row.id)}
            onClick={() => void deleteRow(row)}
            title='Delete'
          >
            <Trash2Icon className='size-3.5' />
            <span className='sr-only sm:not-sr-only sm:ml-1'>Delete</span>
          </Button>
          {row.status !== 'published' ? (
            <Button
              type='button'
              size='sm'
              className='h-8 bg-primary text-primary-foreground'
              disabled={busyId === String(row.id)}
              onClick={() => void setStatus(String(row.id), 'published')}
            >
              Publish
            </Button>
          ) : (
            <Button
              type='button'
              size='sm'
              variant='ghost'
              className='h-8'
              disabled={busyId === String(row.id)}
              onClick={() => void setStatus(String(row.id), 'unpublished')}
            >
              Unpublish
            </Button>
          )}
        </>
      ) : null}
    </div>
  )

  return (
    <div className='mx-auto w-full max-w-6xl space-y-5 px-1 sm:px-0'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div className='min-w-0 flex-1'>
          <h1 className='text-xl font-semibold tracking-tight sm:text-2xl'>{title}</h1>
          <p className='text-muted-foreground mt-1 max-w-xl text-sm'>{description}</p>
        </div>
        <div className='flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end'>
          <Input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder='Search…'
            className='min-w-0 flex-1 sm:w-44 sm:flex-none'
          />
          <Button type='button' variant='outline' size='sm' onClick={() => void load()}>
            Refresh
          </Button>
          {canSyncR2 ? (
            <Button
              type='button'
              size='sm'
              variant='secondary'
              className='border border-border shrink-0 shadow-sm'
              disabled={syncBusy}
              onClick={() => void syncFromR2()}
              title='Refresh library from online storage'
            >
              <CloudDownloadIcon className='size-4' />
              {syncBusy ? 'Refreshing…' : 'Refresh library'}
            </Button>
          ) : null}
          {canAdd ? (
            <Button
              type='button'
              size='sm'
              className='bg-primary text-primary-foreground shrink-0 shadow-md'
              onClick={() => setAddOpen(true)}
            >
              <PlusIcon className='size-4' />
              Add
            </Button>
          ) : null}
        </div>
      </div>

      {r2Status && !r2Status.ok ? (
        <Card className='border-destructive/50 bg-destructive/5'>
          <CardContent className='space-y-2 py-4 text-sm'>
            <p className='text-destructive font-medium'>File uploads are unavailable</p>
            <p className='text-destructive/90'>
              Online file storage is not connected on this Admin server. Image / PDF /
              audio uploads will fail until credentials are fixed on Render.
            </p>
            {r2Status.issues && r2Status.issues.length > 0 ? (
              <ul className='text-destructive/90 list-disc space-y-1 pl-5'>
                {r2Status.issues.map(issue => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            ) : null}
            {r2Status.fix ? <p className='text-muted-foreground'>{r2Status.fix}</p> : null}
          </CardContent>
        </Card>
      ) : null}

      {saveOk ? (
        <Card className='border-emerald-500/50 bg-emerald-950/30'>
          <CardContent className='px-4 py-3 text-sm font-medium text-emerald-300 sm:px-6' role='status'>
            {saveOk}
          </CardContent>
        </Card>
      ) : null}

      {syncMsg ? (
        <Card className='border-primary/40 bg-primary/5'>
          <CardContent className='text-foreground py-3 text-sm'>{syncMsg}</CardContent>
        </Card>
      ) : null}

      {error ? (
        <Card className='border-destructive/40'>
          <CardContent className='text-destructive px-4 py-4 text-sm sm:px-6'>{error}</CardContent>
        </Card>
      ) : null}

      {type !== 'library' && type !== 'ders' ? (
        <div className='grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {rows.slice(0, 16).map(row => {
            const cover = coverUrl(row)
            return (
              <Card key={String(row.id)} className='overflow-hidden'>
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cover} alt='' className='h-24 w-full object-cover' />
                ) : (
                  <div className='bg-muted text-muted-foreground flex h-24 items-center justify-center text-xs'>
                    No cover
                  </div>
                )}
                <CardHeader className='space-y-1 p-3 pb-1'>
                  <CardTitle className='line-clamp-2 text-sm leading-snug'>
                    {String(row.title || row.name_en || row.slug || row.id)}
                  </CardTitle>
                  <CardDescription className='line-clamp-1 text-xs'>{metaFor(row)}</CardDescription>
                </CardHeader>
                <CardContent className='space-y-2 p-3 pt-1'>
                  <Badge variant='outline' className='text-[10px]'>
                    {String(row.status || '—')}
                  </Badge>
                  <ActionButtons row={row} />
                </CardContent>
              </Card>
            )
          })}
          {!loading && rows.length === 0 ? (
            <Card className='sm:col-span-2 lg:col-span-3 xl:col-span-4'>
              <CardContent className='text-muted-foreground py-8 text-center text-sm'>
                No items yet. Click <strong>Add</strong> to create content — it will appear here and
                on the website / app (newest first).
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}

      <Card>
        <CardHeader className='p-4 pb-2'>
          <CardTitle className='text-base'>All records</CardTitle>
          <CardDescription>
            {loading ? 'Loading…' : `${count} records · newest first`}
          </CardDescription>
        </CardHeader>
        <CardContent className='overflow-x-auto p-2 sm:p-4'>
          <Table>
            <TableHeader>
              <TableRow>
                {columns.includes('title') ? <TableHead>Title</TableHead> : null}
                {columns.includes('meta') ? <TableHead>Meta</TableHead> : null}
                {columns.includes('media') ? <TableHead>Media</TableHead> : null}
                {columns.includes('status') ? <TableHead>Status</TableHead> : null}
                {columns.includes('updated') ? <TableHead>Updated</TableHead> : null}
                {canManage ? <TableHead className='min-w-[220px]'>Actions</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(row => (
                <TableRow key={String(row.id)}>
                  {columns.includes('title') ? (
                    <TableCell className='max-w-[180px] truncate font-medium'>
                      {String(row.title || row.name_en || row.slug || row.object_key || row.id)}
                    </TableCell>
                  ) : null}
                  {columns.includes('meta') ? (
                    <TableCell className='text-muted-foreground max-w-[140px] truncate'>
                      {metaFor(row)}
                    </TableCell>
                  ) : null}
                  {columns.includes('media') ? (
                    <TableCell className='text-muted-foreground max-w-[160px] truncate'>
                      {mediaFor(row)}
                    </TableCell>
                  ) : null}
                  {columns.includes('status') ? (
                    <TableCell>
                      <Badge variant='outline'>{String(row.status || row.health_status || '—')}</Badge>
                    </TableCell>
                  ) : null}
                  {columns.includes('updated') ? (
                    <TableCell className='text-muted-foreground whitespace-nowrap text-xs'>
                      {row.updated_at || row.created_at
                        ? new Date(String(row.updated_at || row.created_at)).toLocaleString()
                        : '—'}
                    </TableCell>
                  ) : null}
                  {canManage ? (
                    <TableCell>
                      <ActionButtons row={row} />
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {kind ? (
        <AddContentDialog
          kind={kind}
          open={addOpen}
          onOpenChange={setAddOpen}
          onCreated={() => {
            void load()
            void loadR2()
          }}
        />
      ) : null}

      <Dialog open={Boolean(viewRow)} onOpenChange={o => !o && setViewRow(null)}>
        <DialogContent className='max-h-[min(85dvh,640px)] w-[calc(100%-1rem)] gap-4 overflow-y-auto p-4 sm:max-w-lg sm:p-6'>
          <DialogHeader className='pr-8'>
            <DialogTitle>View</DialogTitle>
            <DialogDescription>Details for this item.</DialogDescription>
          </DialogHeader>
          {viewRow ? (
            <div className='space-y-2 text-sm'>
              <p>
                <span className='text-muted-foreground'>Title:</span>{' '}
                {String(viewRow.title || viewRow.name_en || viewRow.slug)}
              </p>
              <p>
                <span className='text-muted-foreground'>Status:</span> {String(viewRow.status || '—')}
              </p>
              <p>
                <span className='text-muted-foreground'>Meta:</span> {metaFor(viewRow)}
              </p>
              {coverUrl(viewRow) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverUrl(viewRow)!} alt='' className='max-h-40 rounded-md object-contain' />
              ) : null}
              <p className='break-all text-xs text-muted-foreground'>
                {typeof viewRow.media_url === 'string' && viewRow.media_url
                  ? 'Media file is ready'
                  : typeof viewRow.cover_url === 'string' && viewRow.cover_url
                    ? 'Cover image is ready'
                    : mediaFor(viewRow) !== '—'
                      ? 'File attached'
                      : 'No file attached'}
              </p>
              {typeof viewRow.media_url === 'string' && viewRow.media_url ? (
                <a className='text-primary underline' href={String(viewRow.media_url)} target='_blank' rel='noreferrer'>
                  Open media
                </a>
              ) : null}
              {typeof viewRow.cover_url === 'string' && viewRow.cover_url ? (
                <a className='text-primary ml-3 underline' href={String(viewRow.cover_url)} target='_blank' rel='noreferrer'>
                  Open cover
                </a>
              ) : null}
            </div>
          ) : null}
          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => setViewRow(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editRow)}
        onOpenChange={o => {
          if (!o) closeEditDialog()
        }}
      >
        <DialogContent className='max-h-[min(92dvh,820px)] w-[calc(100%-1rem)] gap-4 overflow-y-auto p-4 sm:max-w-lg sm:gap-6 sm:p-6'>
          <DialogHeader className='pr-8'>
            <DialogTitle>Edit content</DialogTitle>
            <DialogDescription>
              Upload files first, then click Save changes. After a successful save you will see a
              green success message. You can Cancel / close anytime.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-3 pb-1'>
            <Field>
              <FieldLabel>Title (English)</FieldLabel>
              <Input value={editTitleEn} onChange={e => setEditTitleEn(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel>Title (Amharic)</FieldLabel>
              <Input value={editTitleAm} onChange={e => setEditTitleAm(e.target.value)} />
            </Field>
            {type === 'kitabs' ? (
              <>
                <Field>
                  <FieldLabel>Sheikh / author (EN)</FieldLabel>
                  <Input value={editAuthor} onChange={e => setEditAuthor(e.target.value)} />
                </Field>
                <Field>
                  <FieldLabel>Sheikh / author (AM)</FieldLabel>
                  <Input value={editAuthorAm} onChange={e => setEditAuthorAm(e.target.value)} />
                </Field>
              </>
            ) : null}
            <Field>
              <FieldLabel>Description (English)</FieldLabel>
              <Textarea value={editDescEn} onChange={e => setEditDescEn(e.target.value)} rows={3} />
            </Field>
            <Field>
              <FieldLabel>Description (Amharic)</FieldLabel>
              <Textarea value={editDescAm} onChange={e => setEditDescAm(e.target.value)} rows={3} />
            </Field>
            {type === 'kitabs' || type === 'audio' || type === 'video' || type === 'pdfs' || type === 'sahabah' ? (
              <R2FileField
                label='Cover image (replace)'
                accept='image/*'
                folder={`staff-uploads/${type}/covers`}
                value={editCover}
                onChange={asset => {
                  setEditCover(asset)
                  if (asset) void linkAssetNow('cover', asset)
                }}
                hint='Upload a new cover — it is linked to this kitab immediately.'
              />
            ) : null}
            {type === 'kitabs' || type === 'pdfs' ? (
              <R2FileField
                label='PDF file (replace)'
                accept='application/pdf,.pdf'
                folder={`staff-uploads/${type}/pdf`}
                value={editPdf}
                onChange={asset => {
                  setEditPdf(asset)
                  if (asset) void linkAssetNow('pdf', asset)
                }}
                hint='Upload a new PDF — it is linked immediately.'
              />
            ) : null}
            {type === 'kitabs' && editRow?.id ? (
              <KitabChildAudioEditor
                kitabId={String(editRow.id)}
                onChanged={() => {
                  setSaveOk('Child ders audio updated. Website / app will show the change.')
                  void load()
                }}
              />
            ) : null}
            {type === 'audio' ? (
              <R2FileField
                label='Audio file (replace)'
                accept='audio/*,.mp3,.m4a,.ogg,.wav'
                folder='staff-uploads/audio'
                value={editMedia}
                onChange={asset => {
                  setEditMedia(asset)
                  if (asset) void linkAssetNow('media', asset)
                }}
                hint='Upload new audio — it is linked immediately.'
              />
            ) : null}
            {type === 'video' ? (
              <R2FileField
                label='Video file (replace)'
                accept='video/*,.mp4,.webm'
                folder='staff-uploads/video'
                value={editMedia}
                onChange={asset => {
                  setEditMedia(asset)
                  if (asset) void linkAssetNow('media', asset)
                }}
                hint='Upload new video — it is linked immediately.'
              />
            ) : null}
          </div>
          <DialogFooter className='gap-2'>
            <Button type='button' variant='outline' onClick={closeEditDialog}>
              Cancel
            </Button>
            <Button
              type='button'
              className='bg-primary text-primary-foreground'
              disabled={busyId === String(editRow?.id)}
              onClick={() => void saveEdit()}
            >
              {busyId === String(editRow?.id) ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ContentListPage
