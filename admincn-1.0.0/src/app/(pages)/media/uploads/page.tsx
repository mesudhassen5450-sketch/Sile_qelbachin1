import PlaceholderPage from '@/views/shared/PlaceholderPage'

const Page = () => {
  return (
    <PlaceholderPage
      title='Uploads'
      description='Recent upload queue and history.'
      actionLabel='New Upload'
      rows={[{ id: '1', title: 'upload-batch-01', status: 'Published', meta: '4 files', updated: '2026-09-22' },
    { id: '2', title: 'upload-batch-02', status: 'Draft', meta: '2 files', updated: '2026-09-21' },
    { id: '3', title: 'upload-batch-03', status: 'Published', meta: '6 files', updated: '2026-09-19' }]}
    />
  )
}

export default Page
