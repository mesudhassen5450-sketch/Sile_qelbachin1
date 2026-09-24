import PlaceholderPage from '@/views/shared/PlaceholderPage'

const Page = () => {
  return (
    <PlaceholderPage
      title='System Health'
      description='Service status for admin, APIs, and storage.'
      actionLabel='Refresh'
      rows={[{ id: '1', title: 'Admin UI', status: 'Published', meta: 'Healthy', updated: '2026-09-22' },
    { id: '2', title: 'Website API', status: 'Published', meta: 'Healthy', updated: '2026-09-22' },
    { id: '3', title: 'Mobile API', status: 'Draft', meta: 'Degraded', updated: '2026-09-22' },
    { id: '4', title: 'Media storage', status: 'Published', meta: 'Healthy', updated: '2026-09-22' }]}
    />
  )
}

export default Page
