'use client'

import { useCallback, useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type HealthRow = {
  id: string
  title?: string
  object_key: string
  media_type: string
  mime_type: string | null
  file_size: number | null
  health_status: string
  is_orphan: boolean
  needs_review: boolean
  public_url: string | null
  last_verified_at: string | null
  error_message: string | null
  linked_content: Array<{ kind: string; id: string; title: string }>
}

type Summary = {
  total_objects: number
  audio: number
  video: number
  pdf: number
  images: number
  healthy: number
  broken: number
  missing: number
  unreachable: number
  needs_review: number
  orphaned: number
  last_scan: string | null
}

function fmtSize(n: number | null) {
  if (n == null || !Number.isFinite(n)) return '—'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

const MediaHealthPage = () => {
  const [rows, setRows] = useState<HealthRow[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [checkSummary, setCheckSummary] = useState<Record<string, number> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [q, setQ] = useState('')
  const [health, setHealth] = useState('all')
  const [type, setType] = useState('all')
  const [showAll, setShowAll] = useState(false)

  const load = useCallback(async () => {
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    if (health !== 'all') params.set('health', health)
    if (type !== 'all') params.set('type', type)
    if (showAll) params.set('all', '1')
    const res = await fetch(`/api/admin/media/health?${params}`, { cache: 'no-store' })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed')
    setRows(data.rows || [])
    setSummary(data.summary || null)
  }, [q, health, type, showAll])

  useEffect(() => {
    void load().catch(err => setError(String(err)))
  }, [load])

  const runCheck = async () => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/media/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 80 }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Health check failed')
      setCheckSummary({
        checked: data.checked,
        healthy: data.healthy,
        missing: data.missing,
        unreachable: data.unreachable,
        orphans: data.orphans,
      })
      if (data.summary) setSummary(data.summary)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  const cards = [
    { label: 'Total objects', value: summary?.total_objects },
    { label: 'Audio', value: summary?.audio },
    { label: 'Video', value: summary?.video },
    { label: 'PDF', value: summary?.pdf },
    { label: 'Images', value: summary?.images },
    { label: 'Healthy', value: summary?.healthy },
    { label: 'Broken', value: summary?.broken },
    { label: 'Missing', value: summary?.missing },
    { label: 'Orphaned', value: summary?.orphaned },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Media Health</h1>
          <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
            Content → Media Asset → Cloudflare object. Orphans are never deleted automatically.
          </p>
          {summary?.last_scan ? (
            <p className="text-muted-foreground mt-1 text-xs">
              Last scan: {new Date(summary.last_scan).toLocaleString()}
            </p>
          ) : null}
        </div>
        <Button type="button" disabled={busy} onClick={() => void runCheck()}>
          {busy ? 'Checking…' : 'Run Check'}
        </Button>
      </div>

      {error ? (
        <Card>
          <CardContent className="text-destructive py-4 text-sm">{error}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map(c => (
          <Card key={c.label} size="sm">
            <CardHeader className="pb-0">
              <CardDescription>{c.label}</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {c.value == null ? '—' : c.value.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent />
          </Card>
        ))}
      </div>

      {checkSummary ? (
        <Card>
          <CardHeader>
            <CardTitle>Last check</CardTitle>
            <CardDescription>
              Checked {checkSummary.checked}: healthy {checkSummary.healthy}, missing{' '}
              {checkSummary.missing}, unreachable {checkSummary.unreachable}, orphans{' '}
              {checkSummary.orphans}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search object key, URL, MIME…"
          className="sm:max-w-xs"
        />
        <select
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
          value={health}
          onChange={e => setHealth(e.target.value)}
        >
          <option value="all">All health</option>
          <option value="healthy">Healthy</option>
          <option value="missing">Missing</option>
          <option value="broken">Broken</option>
          <option value="unreachable">Unreachable</option>
          <option value="needs_review">Needs review</option>
          <option value="orphaned">Orphaned</option>
        </select>
        <select
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
          value={type}
          onChange={e => setType(e.target.value)}
        >
          <option value="all">All types</option>
          <option value="audio">Audio</option>
          <option value="video">Video</option>
          <option value="pdf">PDF</option>
          <option value="image">Images</option>
          <option value="other">Other</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showAll}
            onChange={e => setShowAll(e.target.checked)}
          />
          Show healthy too
        </label>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assets & relationships</CardTitle>
          <CardDescription>
            Object key, MIME, size, last verified, linked content, and error detail.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Object</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Health</TableHead>
                <TableHead>MIME / Size</TableHead>
                <TableHead>Linked content</TableHead>
                <TableHead>Verified</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(row => (
                <TableRow key={row.id}>
                  <TableCell className="max-w-[280px]">
                    <div className="truncate font-medium">{row.title || row.object_key}</div>
                    <div className="text-muted-foreground truncate font-mono text-xs">
                      {row.object_key}
                    </div>
                    {row.error_message ? (
                      <div className="text-destructive mt-1 text-xs">{row.error_message}</div>
                    ) : null}
                  </TableCell>
                  <TableCell>{row.media_type}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{row.health_status}</Badge>
                    <div className="text-muted-foreground mt-1 text-xs">
                      {[row.is_orphan ? 'orphan' : null, row.needs_review ? 'needs review' : null]
                        .filter(Boolean)
                        .join(', ') || '—'}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    <div>{row.mime_type || '—'}</div>
                    <div>{fmtSize(row.file_size)}</div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {row.linked_content?.length ? (
                      <ul className="space-y-0.5">
                        {row.linked_content.slice(0, 3).map(l => (
                          <li key={`${l.kind}-${l.id}`}>
                            <span className="text-muted-foreground">{l.kind}:</span> {l.title}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.last_verified_at
                      ? new Date(row.last_verified_at).toLocaleString()
                      : '—'}
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">
                    No issues listed. Scan storage first if the library is empty, or enable “Show
                    healthy too”.
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

export default MediaHealthPage
