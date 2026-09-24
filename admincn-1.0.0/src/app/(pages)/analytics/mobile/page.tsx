import PlaceholderPage from '@/views/shared/PlaceholderPage'

const Page = () => {
  return (
    <PlaceholderPage
      title='Mobile Analytics'
      description='App opens, retention, and media plays (mock).'
      actionLabel='Export'
      rows={[{ id: '1', title: 'Daily opens', status: 'Published', meta: '1,240', updated: '2026-09-22' },
    { id: '2', title: 'Retention D7', status: 'Published', meta: '42%', updated: '2026-09-22' },
    { id: '3', title: 'Crash-free', status: 'Published', meta: '99.2%', updated: '2026-09-22' }]}
    />
  )
}

export default Page
