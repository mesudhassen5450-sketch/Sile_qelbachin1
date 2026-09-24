import Link from 'next/link'

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

export type PlaceholderRow = {
  id: string
  title: string
  status: 'Published' | 'Draft'
  meta?: string
  updated?: string
}

type PlaceholderPageProps = {
  title: string
  description: string
  rows?: PlaceholderRow[]
  actionLabel?: string
  actionHref?: string
}

const defaultRows: PlaceholderRow[] = [
  { id: '1', title: 'Item A', status: 'Published', meta: 'Category 01', updated: '2026-09-20' },
  { id: '2', title: 'Item B', status: 'Draft', meta: 'Category 02', updated: '2026-09-18' },
  { id: '3', title: 'Item C', status: 'Published', meta: 'Category 01', updated: '2026-09-15' },
  { id: '4', title: 'Item D', status: 'Draft', meta: 'Category 03', updated: '2026-09-12' },
  { id: '5', title: 'Item E', status: 'Published', meta: 'Category 02', updated: '2026-09-10' }
]

const PlaceholderPage = ({
  title,
  description,
  rows = defaultRows,
  actionLabel = 'Add new',
  actionHref
}: PlaceholderPageProps) => {
  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight'>{title}</h1>
          <p className='text-muted-foreground mt-1 max-w-2xl text-sm'>{description}</p>
        </div>
        {actionHref ? (
          <Button render={<Link href={actionHref} />} nativeButton={false}>
            {actionLabel}
          </Button>
        ) : (
          <Button type='button'>{actionLabel}</Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Records</CardTitle>
          <CardDescription>Static placeholder data — ready for API wiring later.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Meta</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(row => (
                <TableRow key={row.id}>
                  <TableCell className='font-medium'>{row.title}</TableCell>
                  <TableCell className='text-muted-foreground'>{row.meta ?? '—'}</TableCell>
                  <TableCell>
                    <Badge
                      variant='outline'
                      className={row.status === 'Published' ? 'badge-publish' : 'badge-draft'}
                    >
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-muted-foreground'>{row.updated ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default PlaceholderPage
