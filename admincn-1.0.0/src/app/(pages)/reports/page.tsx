import PlaceholderPage from '@/views/shared/PlaceholderPage'

const Page = () => {
  return (
    <PlaceholderPage
      title='Reports'
      description='Scheduled and on-demand reports.'
      actionLabel='Generate Report'
      rows={[{ id: '1', title: 'Weekly Summary', status: 'Published', meta: 'Ready', updated: '2026-09-22' },
    { id: '2', title: 'Media Health', status: 'Draft', meta: 'Queued', updated: '2026-09-21' },
    { id: '3', title: 'User Growth', status: 'Published', meta: 'Ready', updated: '2026-09-15' }]}
    />
  )
}

export default Page
