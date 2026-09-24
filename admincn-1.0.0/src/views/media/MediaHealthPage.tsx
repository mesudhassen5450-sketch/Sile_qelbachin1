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

type HealthRow = {
  id: string
  title?: string
  object_key: string
  media_type: string
  health_status: string
  is_orphan: boolean
  needs_review: boolean
  public_url: string | null
  last_verified_at: string | null
}

const MediaHealthPage = () => {
  const [rows, setRows] = useState<HealthRow[]>([])
  const [summary, setSummary] = useState<Record<string, number> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/media/health', { cache: 'no-store' })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed')
    setRows(data.rows || [])
  }, [])

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
        body: JSON.stringify({ limit: 80 })
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Health check failed')
      setSummary({
        checked: data.checked,
        healthy: data.healthy,
        missing: data.missing,
        unreachable: data.unreachable,
        orphans: data.orphans
      })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight'>Media Health</h1>
          <p className='text-muted-foreground mt-1 max-w-2xl text-sm'>
            Verify object existence, orphan media, and missing database references. Orphans are never
            deleted automatically.
          </p>
        </div>
        <Button type='button' disabled={busy} onClick={() => void runCheck()}>
          {busy ? 'Checking…' : 'Run Check'}
        </Button>
      </div>

      {error ? (
        <Card>
          <CardContent className='text-destructive py-4 text-sm'>{error}</CardContent>
        </Card>
      ) : null}

      {summary ? (
        <Card>
          <CardHeader>
            <CardTitle>Last check</CardTitle>
            <CardDescription>
              Checked {summary.checked}: healthy {summary.healthy}, missing {summary.missing},
              unreachable {summary.unreachable}, orphans {summary.orphans}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Issues & orphans</CardTitle>
          <CardDescription>Needs review, missing, unreachable, or unlinked R2 objects.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Object</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Health</TableHead>
                <TableHead>Flags</TableHead>
                <TableHead>Verified</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(row => (
                <TableRow key={row.id}>
                  <TableCell className='font-medium max-w-[320px] truncate'>
                    {row.title || row.object_key}
                  </TableCell>
                  <TableCell>{row.media_type}</TableCell>
                  <TableCell>
                    <Badge variant='outline'>{row.health_status}</Badge>
                  </TableCell>
                  <TableCell className='text-muted-foreground text-sm'>
                    {[row.is_orphan ? 'orphan' : null, row.needs_review ? 'needs review' : null]
                      .filter(Boolean)
                      .join(', ') || '—'}
                  </TableCell>
                  <TableCell className='text-muted-foreground'>
                    {row.last_verified_at
                      ? new Date(row.last_verified_at).toLocaleString()
                      : '—'}
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className='text-muted-foreground'>
                    No issues listed. Scan storage first if the library is empty.
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
