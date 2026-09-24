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
  TableRow
} from '@/components/ui/table'

type ContentListPageProps = {
  title: string
  description: string
  type: 'kitabs' | 'ders' | 'audio' | 'video' | 'pdfs' | 'library'
  columns?: Array<'title' | 'meta' | 'status' | 'media' | 'updated'>
}

type Row = Record<string, unknown>

const ContentListPage = ({
  title,
  description,
  type,
  columns = ['title', 'meta', 'status', 'updated']
}: ContentListPageProps) => {
  const [rows, setRows] = useState<Row[]>([])
  const [count, setCount] = useState(0)
  const [q, setQ] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (q.trim()) params.set('q', q.trim())
      const res = await fetch(`/api/admin/content/${type}?${params.toString()}`, {
        cache: 'no-store'
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to load')
      setRows(data.rows || [])
      setCount(data.count || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [q, type])

  useEffect(() => {
    void load()
  }, [load])

  const metaFor = (row: Row): string => {
    if (type === 'kitabs') {
      return `${row.ders_count_live ?? row.ders_count ?? 0} ders · ${row.author_en || row.author_am || ''}`
    }
    if (type === 'ders') return `${row.kitab_slug || ''} · #${row.ders_number || row.sort_order || ''}`
    if (type === 'audio' || type === 'video' || type === 'pdfs') {
      return String(row.category || row.object_key || row.kitab_slug || '—')
    }
    if (type === 'library') return String(row.media_type || '—')
    return '—'
  }

  const mediaFor = (row: Row): string => {
    return String(row.media_url || row.audio_url || row.pdf_url || row.cover_url || row.public_url || '—')
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight'>{title}</h1>
          <p className='text-muted-foreground mt-1 max-w-2xl text-sm'>{description}</p>
        </div>
        <div className='flex gap-2'>
          <Input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder='Search…'
            className='w-56'
          />
          <Button type='button' variant='outline' onClick={() => void load()}>
            Refresh
          </Button>
        </div>
      </div>

      {error ? (
        <Card>
          <CardContent className='text-destructive py-4 text-sm'>{error}</CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Records</CardTitle>
          <CardDescription>
            {loading ? 'Loading…' : `${count} records from CMS store (Supabase when configured).`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {columns.includes('title') ? <TableHead>Title</TableHead> : null}
                {columns.includes('meta') ? <TableHead>Meta</TableHead> : null}
                {columns.includes('media') ? <TableHead>Media</TableHead> : null}
                {columns.includes('status') ? <TableHead>Status</TableHead> : null}
                {columns.includes('updated') ? <TableHead>Updated</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(row => (
                <TableRow key={String(row.id)}>
                  {columns.includes('title') ? (
                    <TableCell className='font-medium'>
                      {String(row.title || row.slug || row.object_key || row.id)}
                    </TableCell>
                  ) : null}
                  {columns.includes('meta') ? (
                    <TableCell className='text-muted-foreground'>{metaFor(row)}</TableCell>
                  ) : null}
                  {columns.includes('media') ? (
                    <TableCell className='text-muted-foreground max-w-[240px] truncate'>
                      {mediaFor(row)}
                    </TableCell>
                  ) : null}
                  {columns.includes('status') ? (
                    <TableCell>
                      <Badge
                        variant='outline'
                        className={
                          row.status === 'published' ? 'badge-publish' : 'badge-draft'
                        }
                      >
                        {String(row.status || row.health_status || '—')}
                      </Badge>
                    </TableCell>
                  ) : null}
                  {columns.includes('updated') ? (
                    <TableCell className='text-muted-foreground'>
                      {row.updated_at
                        ? new Date(String(row.updated_at)).toLocaleDateString()
                        : '—'}
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
              {!loading && rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className='text-muted-foreground'>
                    No records yet. Run Media → Cloudflare Storage → Scan, then Match Static Content.
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

export default ContentListPage
