import PlaceholderPage from '@/views/shared/PlaceholderPage'

const Page = () => {
  return (
    <PlaceholderPage
      title='Website Users'
      description='Accounts registered on the public website.'
      actionLabel='Invite User'
      rows={[{ id: '1', title: 'user-web-01', status: 'Published', meta: 'Active', updated: '2026-09-20' },
    { id: '2', title: 'user-web-02', status: 'Draft', meta: 'Pending', updated: '2026-09-18' },
    { id: '3', title: 'user-web-03', status: 'Published', meta: 'Active', updated: '2026-09-15' }]}
    />
  )
}

export default Page
