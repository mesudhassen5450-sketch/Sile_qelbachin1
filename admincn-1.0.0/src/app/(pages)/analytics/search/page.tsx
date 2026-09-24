import PlaceholderPage from '@/views/shared/PlaceholderPage'

const Page = () => {
  return (
    <PlaceholderPage
      title='Search Analytics'
      description='Popular search queries (placeholders).'
      actionLabel='Export'
      rows={[{ id: '1', title: 'Query A', status: 'Published', meta: '320 hits', updated: '2026-09-22' },
    { id: '2', title: 'Query B', status: 'Published', meta: '210 hits', updated: '2026-09-22' },
    { id: '3', title: 'Query C', status: 'Draft', meta: '95 hits', updated: '2026-09-22' }]}
    />
  )
}

export default Page
