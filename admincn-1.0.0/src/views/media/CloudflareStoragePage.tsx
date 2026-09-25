'use client'

import { useCallback, useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

type StatusResponse = {
  storage: {
    provider: string
    bucket: string
    object_prefix: string
    public_base_url: string
    api_credentials_configured: boolean
    media_mirror_path: string | null
    supabase_configured: boolean
  }
  stats: {
    total_objects: number
    audio: number
    video: number
    pdf: number
    images: number
    new_files: number
    changed_files: number
    missing_files: number
    broken_files: number
    orphan_files: number
    needs_review: number
    last_scan: string | null
    kitabs: number
    ders: number
    audio_items: number
    video_items: number
    pdf_items: number
    backend: string
  }
  last_scan_run: {
    source: string
    total_objects: number
    imported: number
    updated: number
    skipped: number
    failed: number
    new_objects: number
    changed_objects: number
    missing_objects: number
    orphan_objects: number
    needs_review: number
    by_type: Record<string, number>
    finished_at: string | null
  } | null
}

type ScanResponse = {
  ok: boolean
  error?: string
  summary?: Record<string, unknown>
  preview_new?: Array<{
    object_key: string
    media_type: string
    detected_content: { kind?: string; kitabSlug?: string; dersHint?: string; needsReview?: boolean }
    public_url: string | null
    status: string
  }>
  backend?: string
}

type StatCard = { label: string; value: string | number }

const CloudflareStoragePage = () => {
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [scan, setScan] = useState<ScanResponse | null>(null)
  const [matchResult, setMatchResult] = useState<unknown>(null)
  const [phase, setPhase] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    const res = await fetch('/api/admin/media/status', { cache: 'no-store' })
    const data = (await res.json()) as StatusResponse
    setStatus(data)
  }, [])

  useEffect(() => {
    void refresh().catch(err => setError(String(err)))
  }, [refresh])

  const runScan = async () => {
    setBusy(true)
    setError(null)
    setScan(null)
    try {
      setPhase('Scanning…')
      await new Promise(r => setTimeout(r, 200))
      setPhase('Reading online files…')
      const res = await fetch('/api/admin/media/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail: 'admin' })
      })
      setPhase('Comparing with database…')
      const data = (await res.json()) as ScanResponse
      if (!res.ok || !data.ok) throw new Error(data.error || 'Scan failed')
      setPhase('Detecting new / changed / missing media…')
      setScan(data)
      await refresh()
      setPhase(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setPhase(null)
    } finally {
      setBusy(false)
    }
  }

  const runMatch = async () => {
    setBusy(true)
    setError(null)
    try {
      setPhase('Matching kitabs, ders, audio, video, and PDFs…')
      const res = await fetch('/api/admin/media/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publish: true })
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Match failed')
      setMatchResult(data.result)
      await refresh()
      setPhase(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setPhase(null)
    } finally {
      setBusy(false)
    }
  }

  const s = status?.stats
  const cards: StatCard[] = [
    { label: 'Total Objects', value: s?.total_objects ?? '—' },
    { label: 'Audio', value: s?.audio ?? '—' },
    { label: 'Video', value: s?.video ?? '—' },
    { label: 'PDF', value: s?.pdf ?? '—' },
    { label: 'Images', value: s?.images ?? '—' },
    { label: 'New Files', value: s?.new_files ?? '—' },
    { label: 'Changed Files', value: s?.changed_files ?? '—' },
    { label: 'Missing Files', value: s?.missing_files ?? '—' },
    { label: 'Broken Files', value: s?.broken_files ?? '—' },
    { label: 'Orphan Files', value: s?.orphan_files ?? '—' }
  ]

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight'>Media library</h1>
          <p className='text-muted-foreground mt-1 max-w-2xl text-sm'>
            Refresh online files into Admin so you can manage kitabs, audio, video, and PDFs.
          </p>
        </div>
        <div className='flex flex-wrap gap-2'>
          <Button
            type='button'
            className='bg-primary text-primary-foreground'
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              setError(null)
              try {
                setPhase('Refreshing library…')
                const res = await fetch('/api/admin/media/sync-r2', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ publish: true })
                })
                const data = await res.json()
                if (!res.ok || !data.ok) throw new Error(data.error || 'Refresh failed')
                setScan(data)
                setMatchResult({ ...(data.match || {}), orphans: data.orphans })
                await refresh()
                setPhase(null)
              } catch (err) {
                setError(err instanceof Error ? err.message : String(err))
                setPhase(null)
              } finally {
                setBusy(false)
              }
            }}
          >
            {busy ? 'Refreshing…' : 'Refresh library'}
          </Button>
          <Button type='button' disabled={busy} onClick={() => void runScan()}>
            {busy && phase?.startsWith('Scan') ? 'Scanning…' : 'Scan storage'}
          </Button>
          <Button type='button' variant='outline' disabled={busy} onClick={() => void runMatch()}>
            Match existing content
          </Button>
        </div>
      </div>

      {phase ? (
        <Card>
          <CardContent className='text-muted-foreground py-4 text-sm'>{phase}</CardContent>
        </Card>
      ) : null}

      {error ? (
        <Card>
          <CardContent className='text-destructive py-4 text-sm'>{error}</CardContent>
        </Card>
      ) : null}

      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-5'>
        {cards.map(card => (
          <Card key={card.label}>
            <CardHeader className='pb-2'>
              <CardDescription>{card.label}</CardDescription>
              <CardTitle className='text-2xl tabular-nums'>{card.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Storage connection</CardTitle>
          <CardDescription>
            Last scan: {s?.last_scan ? new Date(s.last_scan).toLocaleString() : 'Never'} · Backend:{' '}
            {s?.backend || '—'}
          </CardDescription>
        </CardHeader>
        <CardContent className='text-muted-foreground space-y-1 text-sm'>
          <p>Provider: {status?.storage.provider}</p>
          <p>Bucket: {status?.storage.bucket}</p>
          <p>Prefix: {status?.storage.object_prefix}</p>
          <p>Public base: {status?.storage.public_base_url}</p>
          <p>
            R2 API credentials:{' '}
            {status?.storage.api_credentials_configured ? 'configured' : 'not set (mirror fallback)'}
          </p>
          <p>Supabase: {status?.storage.supabase_configured ? 'configured' : 'local store until configured'}</p>
          {status?.storage.media_mirror_path ? (
            <p>Mirror path: {status.storage.media_mirror_path}</p>
          ) : null}
        </CardContent>
      </Card>

      {scan?.summary ? (
        <Card>
          <CardHeader>
            <CardTitle>Scan result</CardTitle>
            <CardDescription>
              Source: {String(scan.summary.source)} · Backend: {scan.backend}
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-2 text-sm'>
            <p>Total R2 objects: {String(scan.summary.total_r2_objects)}</p>
            <p>Existing records matched: {String(scan.summary.existing_records_matched)}</p>
            <p>New objects: {String(scan.summary.new_objects)}</p>
            <p>Changed objects: {String(scan.summary.changed_objects)}</p>
            <p>Missing objects: {String(scan.summary.missing_objects)}</p>
            <p>Orphan objects: {String(scan.summary.orphan_objects)}</p>
            <p>
              Imported {String(scan.summary.imported)} · Updated {String(scan.summary.updated)} ·
              Skipped {String(scan.summary.skipped)} · Failed {String(scan.summary.failed)} · Needs
              review {String(scan.summary.needs_review)}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {scan?.preview_new && scan.preview_new.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>New media found</CardTitle>
            <CardDescription>{scan.preview_new.length} new files (preview, max 100)</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Object</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Detected content</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scan.preview_new.map(row => (
                  <TableRow key={row.object_key}>
                    <TableCell className='font-medium'>
                      {row.object_key.split('/').pop()}
                    </TableCell>
                    <TableCell>{row.media_type}</TableCell>
                    <TableCell>
                      {[row.detected_content.kind, row.detected_content.kitabSlug, row.detected_content.dersHint]
                        .filter(Boolean)
                        .join(' / ') || '—'}
                    </TableCell>
                    <TableCell className='text-muted-foreground max-w-[280px] truncate'>
                      {row.object_key}
                    </TableCell>
                    <TableCell>
                      <Badge variant='outline'>{row.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      {matchResult ? (
        <Card>
          <CardHeader>
            <CardTitle>Static content match</CardTitle>
            <CardDescription>
              Linked verified Kitabs / Ders / archive items to media_assets without inventing metadata.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className='bg-muted overflow-auto rounded-md p-3 text-xs'>
              {JSON.stringify(matchResult, null, 2)}
            </pre>
            <p className='text-muted-foreground mt-3 text-sm'>
              Content counts — Kitabs: {s?.kitabs ?? 0}, Ders: {s?.ders ?? 0}, Audio: {s?.audio_items ?? 0},
              Video: {s?.video_items ?? 0}, PDFs: {s?.pdf_items ?? 0}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

export default CloudflareStoragePage
