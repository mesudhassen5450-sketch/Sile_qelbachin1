import PlaceholderPage from '@/views/shared/PlaceholderPage'

const Page = () => {
  return (
    <PlaceholderPage
      title='Accounts'
      description='Unified account records across platforms.'
      actionLabel='Add Account'
      rows={[{ id: '1', title: 'account-01', status: 'Published', meta: 'Website + Mobile', updated: '2026-09-20' },
    { id: '2', title: 'account-02', status: 'Published', meta: 'Website', updated: '2026-09-16' },
    { id: '3', title: 'account-03', status: 'Draft', meta: 'Mobile', updated: '2026-09-11' }]}
    />
  )
}

export default Page
