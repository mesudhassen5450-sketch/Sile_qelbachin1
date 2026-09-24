import PlaceholderPage from '@/views/shared/PlaceholderPage'

const Page = () => {
  return (
    <PlaceholderPage
      title='Website Analytics'
      description='Website traffic and content engagement (mock).'
      actionLabel='Export'
      rows={[{ id: '1', title: 'Home', status: 'Published', meta: '8,420 views', updated: '2026-09-22' },
    { id: '2', title: 'Kitabs', status: 'Published', meta: '3,210 views', updated: '2026-09-22' },
    { id: '3', title: 'Audio', status: 'Published', meta: '2,880 views', updated: '2026-09-22' }]}
    />
  )
}

export default Page
