import PlaceholderPage from '@/views/shared/PlaceholderPage'

const Page = () => {
  return (
    <PlaceholderPage
      title='Errors'
      description='Recent application and API errors.'
      actionLabel='Clear Resolved'
      rows={[{ id: '1', title: 'ERR-1001', status: 'Published', meta: 'Media missing', updated: '2026-09-22' },
    { id: '2', title: 'ERR-1002', status: 'Draft', meta: 'API timeout', updated: '2026-09-21' },
    { id: '3', title: 'ERR-1003', status: 'Published', meta: 'Auth failure', updated: '2026-09-20' }]}
    />
  )
}

export default Page
