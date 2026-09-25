import Link from 'next/link'

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
  emptyMessage?: string
}

/** Empty/real records only — never invents demo rows. */
const PlaceholderPage = ({
  title,
  description,
  rows = [],
  actionLabel = 'Add new',
  actionHref,
  emptyMessage = 'No records yet.'
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
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Records</CardTitle>
          <CardDescription>
            {rows.length ? `${rows.length} record${rows.length === 1 ? '' : 's'}` : 'Nothing to show yet'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className='text-muted-foreground py-8 text-center text-sm'>{emptyMessage}</p>
          ) : (
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
                    <TableCell>{row.status}</TableCell>
                    <TableCell className='text-muted-foreground'>{row.updated ?? '—'}</TableCell>
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

export default PlaceholderPage
