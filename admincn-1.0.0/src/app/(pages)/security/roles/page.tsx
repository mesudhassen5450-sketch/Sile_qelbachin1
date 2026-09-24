import PlaceholderPage from '@/views/shared/PlaceholderPage'

const Page = () => {
  return (
    <PlaceholderPage
      title='Roles & Permissions'
      description='Role definitions and permission matrices.'
      actionLabel='Add Role'
      rows={[{ id: '1', title: 'Owner', status: 'Published', meta: 'Full access', updated: '2026-09-18' },
    { id: '2', title: 'Editor', status: 'Published', meta: 'Content write', updated: '2026-09-18' },
    { id: '3', title: 'Viewer', status: 'Draft', meta: 'Read only', updated: '2026-09-18' }]}
    />
  )
}

export default Page
