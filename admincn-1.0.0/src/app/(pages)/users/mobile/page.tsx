import PlaceholderPage from '@/views/shared/PlaceholderPage'

const Page = () => {
  return (
    <PlaceholderPage
      title='Mobile Users'
      description='Accounts registered in the mobile app.'
      actionLabel='Invite User'
      rows={[{ id: '1', title: 'user-mobile-01', status: 'Published', meta: 'Active', updated: '2026-09-21' },
    { id: '2', title: 'user-mobile-02', status: 'Published', meta: 'Inactive', updated: '2026-09-17' },
    { id: '3', title: 'user-mobile-03', status: 'Draft', meta: 'Pending', updated: '2026-09-12' }]}
    />
  )
}

export default Page
