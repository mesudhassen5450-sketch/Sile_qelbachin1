import PlaceholderPage from '@/views/shared/PlaceholderPage'

const Page = () => {
  return (
    <PlaceholderPage
      title='Notifications'
      description='Push and in-app notification campaigns.'
      actionLabel='Create Notification'
      rows={[{ id: '1', title: 'Campaign A', status: 'Published', meta: 'Scheduled', updated: '2026-09-20' },
    { id: '2', title: 'Campaign B', status: 'Draft', meta: 'Draft', updated: '2026-09-18' },
    { id: '3', title: 'Campaign C', status: 'Published', meta: 'Sent', updated: '2026-09-12' }]}
    />
  )
}

export default Page
