'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  ArrowDownIcon,
  ArrowUpIcon,
  Loader2Icon,
  PlusIcon,
  Trash2Icon
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { R2FileField, type UploadedAsset } from '@/views/content/R2FileField'

type DersRow = {
  id: string
  title_en?: string | null
  title_am?: string | null
  sort_order?: number | null
  audio_asset_id?: string | null
  audio_url?: string | null
  audio_key?: string | null
  status?: string | null
}

type KitabChildAudioEditorProps = {
  kitabId: string
  onChanged?: () => void
}

async function readJson(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text()
  try {
    return JSON.parse(text) as Record<string, unknown>
  } catch {
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      throw new Error('Admin server is restarting. Wait a moment, then try again.')
    }
    throw new Error(`Server error (${res.status}). Try again.`)
  }
}

/**
 * Full control for kitab child ders audio: list, rename, replace file, reorder, add, delete.
 */
export function KitabChildAudioEditor({ kitabId, onChanged }: KitabChildAudioEditorProps) {
  const [rows, setRows] = useState<DersRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newAudio, setNewAudio] = useState<UploadedAsset | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/admin/content/ders?kitab_id=${encodeURIComponent(kitabId)}&t=${Date.now()}`,
        { cache: 'no-store' }
      )
      const data = await readJson(res)
      if (!res.ok || !data.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Failed to load child audio')
      }
      setRows((data.rows as DersRow[]) || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [kitabId])

  useEffect(() => {
    void load()
  }, [load])

  const patchDers = async (body: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/content/ders?t=${Date.now()}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store'
    })
    const data = await readJson(res)
    if (!res.ok || !data.ok) {
      throw new Error(typeof data.error === 'string' ? data.error : 'Update failed')
    }
  }

  const rename = async (id: string, title_en: string) => {
    setBusyId(id)
    setError(null)
    try {
      await patchDers({ id, title_en: title_en || null })
      setRows(prev => prev.map(r => (r.id === id ? { ...r, title_en } : r)))
      onChanged?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusyId(null)
    }
  }

  const replaceAudio = async (id: string, asset: UploadedAsset | null) => {
    if (!asset?.id) return
    setBusyId(id)
    setError(null)
    try {
      await patchDers({ id, audio_asset_id: asset.id, media_asset_id: asset.id })
      setRows(prev =>
        prev.map(r =>
          r.id === id
            ? {
                ...r,
                audio_asset_id: asset.id,
                audio_url: asset.public_url,
                audio_key: asset.object_key
              }
            : r
        )
      )
      onChanged?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (id: string, label: string) => {
    if (!window.confirm(`Delete child audio “${label}”?\n\nThis removes it from the website / app.`)) {
      return
    }
    setBusyId(id)
    setError(null)
    try {
      const res = await fetch('/api/admin/content/ders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, delete_r2: true })
      })
      const data = await readJson(res)
      if (!res.ok || !data.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Delete failed')
      }
      setRows(prev => prev.filter(r => r.id !== id))
      onChanged?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusyId(null)
    }
  }

  const move = async (index: number, direction: -1 | 1) => {
    const other = index + direction
    if (other < 0 || other >= rows.length) return
    const a = rows[index]
    const b = rows[other]
    const orderA = Number(a.sort_order) || index + 1
    const orderB = Number(b.sort_order) || other + 1
    setBusyId(a.id)
    setError(null)
    try {
      await patchDers({ id: a.id, sort_order: orderB })
      await patchDers({ id: b.id, sort_order: orderA })
      await load()
      onChanged?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusyId(null)
    }
  }

  const addDers = async () => {
    if (!newAudio?.id) {
      setError('Upload an audio file before adding.')
      return
    }
    setAdding(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/content/ders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kitab_id: kitabId,
          title_en: newTitle.trim() || `Ders ${rows.length + 1}`,
          audio_asset_id: newAudio.id,
          status: 'published'
        })
      })
      const data = await readJson(res)
      if (!res.ok || !data.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Could not add child audio')
      }
      setNewTitle('')
      setNewAudio(null)
      await load()
      onChanged?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className='space-y-3 rounded-lg border border-border p-3'>
      <div>
        <p className='text-sm font-medium'>Child ders audio</p>
        <p className='text-muted-foreground text-xs'>
          Add, rename, replace, reorder, or delete audio under this kitab. Changes apply to the
          website and app.
        </p>
      </div>

      {loading ? (
        <p className='text-muted-foreground flex items-center gap-2 text-xs'>
          <Loader2Icon className='size-3.5 animate-spin' />
          Loading child audio…
        </p>
      ) : null}

      {!loading && rows.length === 0 ? (
        <p className='text-muted-foreground text-xs'>No child audio yet. Add the first ders below.</p>
      ) : null}

      <div className='space-y-3'>
        {rows.map((row, idx) => {
          const label = String(row.title_en || row.title_am || `Ders ${idx + 1}`)
          const audioValue: UploadedAsset | null =
            typeof row.audio_asset_id === 'string' && row.audio_asset_id
              ? {
                  id: row.audio_asset_id,
                  public_url: String(row.audio_url || ''),
                  object_key: String(row.audio_key || 'audio')
                }
              : null
          return (
            <div key={row.id} className='bg-muted/40 space-y-2 rounded-md p-3'>
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <span className='text-sm font-medium'>Ders {idx + 1}</span>
                <div className='flex items-center gap-1'>
                  <Button
                    type='button'
                    size='icon-sm'
                    variant='ghost'
                    disabled={busyId === row.id || idx === 0}
                    onClick={() => void move(idx, -1)}
                    title='Move up'
                  >
                    <ArrowUpIcon className='size-4' />
                  </Button>
                  <Button
                    type='button'
                    size='icon-sm'
                    variant='ghost'
                    disabled={busyId === row.id || idx === rows.length - 1}
                    onClick={() => void move(idx, 1)}
                    title='Move down'
                  >
                    <ArrowDownIcon className='size-4' />
                  </Button>
                  <Button
                    type='button'
                    size='icon-sm'
                    variant='ghost'
                    disabled={busyId === row.id}
                    onClick={() => void remove(row.id, label)}
                    title='Delete'
                  >
                    <Trash2Icon className='size-4' />
                  </Button>
                </div>
              </div>
              <Input
                defaultValue={label}
                disabled={busyId === row.id}
                placeholder='Ders title (EN)'
                onBlur={e => {
                  const next = e.target.value.trim()
                  if (next !== label) void rename(row.id, next)
                }}
              />
              <R2FileField
                label='Audio file (replace)'
                accept='audio/*,.mp3,.m4a,.ogg,.wav'
                folder='staff-uploads/kitabs/ders'
                value={audioValue}
                onChange={asset => void replaceAudio(row.id, asset)}
                hint='Upload a new file to replace this ders audio.'
              />
            </div>
          )
        })}
      </div>

      <div className='space-y-2 rounded-md border border-dashed p-3'>
        <p className='text-sm font-medium'>Add child audio</p>
        <Input
          placeholder='New ders title (EN)'
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          disabled={adding}
        />
        <R2FileField
          label='Audio file'
          accept='audio/*,.mp3,.m4a,.ogg,.wav'
          folder='staff-uploads/kitabs/ders'
          value={newAudio}
          onChange={setNewAudio}
          hint='Upload the audio, then click Add ders audio.'
        />
        <Button
          type='button'
          size='sm'
          className='bg-primary text-primary-foreground'
          disabled={adding || !newAudio?.id}
          onClick={() => void addDers()}
        >
          {adding ? (
            <Loader2Icon className='size-4 animate-spin' />
          ) : (
            <PlusIcon className='size-4' />
          )}
          {adding ? 'Adding…' : 'Add ders audio'}
        </Button>
      </div>

      {error ? (
        <p className='text-destructive text-xs' role='alert'>
          {error}
        </p>
      ) : null}
    </div>
  )
}
