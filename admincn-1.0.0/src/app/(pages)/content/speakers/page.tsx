import PlaceholderPage from '@/views/shared/PlaceholderPage'

const Page = () => {
  return (
    <PlaceholderPage
      title='Speakers'
      description='Speaker profiles linked to audio and video.'
      actionLabel='Add Speaker'
      rows={[{ id: '1', title: 'Speaker A', status: 'Published', meta: 'Audio / Video', updated: '2026-09-20' },
    { id: '2', title: 'Speaker B', status: 'Published', meta: 'Audio', updated: '2026-09-15' },
    { id: '3', title: 'Speaker C', status: 'Draft', meta: 'Video', updated: '2026-09-10' }]}
    />
  )
}

export default Page
