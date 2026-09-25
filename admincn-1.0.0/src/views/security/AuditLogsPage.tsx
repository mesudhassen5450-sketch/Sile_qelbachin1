'use client'

import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

type Row = {
  id: string
  title: string
  meta: string
  status: string
  updated: string
}

const AuditLogsPage = () => {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/admin/audit-logs', { cache: 'no-store' })
        const data = await res.json()
        if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to load')
        setRows(data.rows || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold tracking-tight'>Activity log</h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          Real actions from Admin (uploads, publishes, deletes). Empty until staff do something.
        </p>
      </div>

      {error ? <p className='text-destructive text-sm'>{error}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>
            {loading ? 'Loading…' : `${rows.length} record${rows.length === 1 ? '' : 's'}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 && !loading ? (
            <p className='text-muted-foreground py-8 text-center text-sm'>No activity yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Who</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(row => (
                  <TableRow key={row.id}>
                    <TableCell className='font-medium'>{row.title}</TableCell>
                    <TableCell className='text-muted-foreground'>{row.meta}</TableCell>
                    <TableCell>
                      <Badge variant='outline'>{row.status}</Badge>
                    </TableCell>
                    <TableCell className='text-muted-foreground text-xs whitespace-nowrap'>
                      {row.updated ? new Date(row.updated).toLocaleString() : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AuditLogsPage
