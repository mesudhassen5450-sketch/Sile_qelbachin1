import PlaceholderPage from '@/views/shared/PlaceholderPage'

const Page = () => {
  return (
    <PlaceholderPage
      title='Sessions'
      description='Active admin sessions.'
      actionLabel='Revoke All'
      rows={[{ id: '1', title: 'session-01', status: 'Published', meta: 'admin-01', updated: '2026-09-22' },
    { id: '2', title: 'session-02', status: 'Published', meta: 'admin-02', updated: '2026-09-21' },
    { id: '3', title: 'session-03', status: 'Draft', meta: 'admin-01', updated: '2026-09-20' }]}
    />
  )
}

export default Page
