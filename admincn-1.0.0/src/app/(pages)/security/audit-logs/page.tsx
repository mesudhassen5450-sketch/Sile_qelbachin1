import PlaceholderPage from '@/views/shared/PlaceholderPage'

const Page = () => {
  return (
    <PlaceholderPage
      title='Audit Logs'
      description='Security and content change audit trail.'
      actionLabel='Export Logs'
      rows={[{ id: '1', title: 'login', status: 'Published', meta: 'admin-01', updated: '2026-09-22' },
    { id: '2', title: 'publish kitab', status: 'Published', meta: 'admin-02', updated: '2026-09-21' },
    { id: '3', title: 'role update', status: 'Draft', meta: 'admin-01', updated: '2026-09-19' }]}
    />
  )
}

export default Page
