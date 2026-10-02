'use client'

import { useEffect, useState } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type Usage = {
  kitab_opens: number
  audio_plays: number
  video_views: number
  pdf_opens: number
  downloads: number
  searches: number
  featured_clicks: number
  top_paths: Array<{ path: string; hits: number }>
}

const fmt = (n: number | null | undefined) =>
  n == null || !Number.isFinite(n) ? '0' : n.toLocaleString()

const Page = () => {
  const [usage, setUsage] = useState<Usage | null>(null)
  const [today, setToday] = useState<{
    audio_plays?: number
    video_plays?: number
    pdf_opens?: number
    kitab_opens?: number
  } | null>(null)
  const [library, setLibrary] = useState<Record<string, number> | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/admin/stats?days=7', { cache: 'no-store' })
        const data = await res.json()
        if (!res.ok || !data.ok) throw new Error(data.error || 'Failed')
        setUsage(data.content_usage || null)
        setToday(data.today?.combined || null)
        setLibrary(data.content || null)
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      }
    })()
  }, [])

  const cards = [
    { label: 'Kitab opens (7d)', value: usage?.kitab_opens },
    { label: 'Audio plays (7d)', value: usage?.audio_plays },
    { label: 'Video views (7d)', value: usage?.video_views },
    { label: 'PDF opens (7d)', value: usage?.pdf_opens },
    { label: 'Downloads (7d)', value: usage?.downloads },
    { label: 'Searches (7d)', value: usage?.searches },
    { label: 'Featured clicks (7d)', value: usage?.featured_clicks },
    { label: 'Today audio', value: today?.audio_plays },
    { label: 'Today video', value: today?.video_plays },
    { label: 'Today PDF', value: today?.pdf_opens },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Content Analytics</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Usage across existing content types. Private question text is never included.
        </p>
      </div>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map(c => (
          <Card key={c.label} size="sm">
            <CardHeader className="pb-0">
              <CardDescription>{c.label}</CardDescription>
              <CardTitle className="text-2xl tabular-nums">{fmt(c.value)}</CardTitle>
            </CardHeader>
            <CardContent />
          </Card>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Published kitabs', value: library?.kitabs },
          { label: 'Published ders', value: library?.ders },
          { label: 'Published audio', value: library?.audio },
          { label: 'Published video', value: library?.video },
          { label: 'Published PDFs', value: library?.pdfs },
        ].map(c => (
          <Card key={c.label} size="sm">
            <CardHeader className="pb-0">
              <CardDescription>{c.label}</CardDescription>
              <CardTitle className="text-xl tabular-nums">{fmt(c.value)}</CardTitle>
            </CardHeader>
            <CardContent />
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top paths (7d)</CardTitle>
          <CardDescription>Most frequent event paths — no private content.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Path</TableHead>
                <TableHead className="w-24 text-right">Hits</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(usage?.top_paths || []).map(row => (
                <TableRow key={row.path}>
                  <TableCell className="font-mono text-sm">{row.path}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt(row.hits)}</TableCell>
                </TableRow>
              ))}
              {!usage?.top_paths?.length ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-muted-foreground">
                    No path activity yet.
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

export default Page
