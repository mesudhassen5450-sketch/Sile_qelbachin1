import PlaceholderPage from '@/views/shared/PlaceholderPage'

const Page = () => {
  return (
    <PlaceholderPage
      title='Analytics Overview'
      description='High-level engagement metrics across website and mobile.'
      actionLabel='Export'
      rows={[{ id: '1', title: 'Visitors (7d)', status: 'Published', meta: '12.4k', updated: '2026-09-22' },
    { id: '2', title: 'App opens (7d)', status: 'Published', meta: '8.1k', updated: '2026-09-22' },
    { id: '3', title: 'Media plays (7d)', status: 'Published', meta: '6.3k', updated: '2026-09-22' }]}
    />
  )
}

export default Page
