import PlaceholderPage from '@/views/shared/PlaceholderPage'

const Page = () => {
  return (
    <PlaceholderPage
      title='Categories'
      description='Content categories used across kitabs, ders, and media.'
      actionLabel='Add Category'
      rows={[{ id: '1', title: 'Category 01', status: 'Published', meta: 'Content', updated: '2026-09-18' },
    { id: '2', title: 'Category 02', status: 'Published', meta: 'Content', updated: '2026-09-12' },
    { id: '3', title: 'Category 03', status: 'Draft', meta: 'Media', updated: '2026-09-08' }]}
    />
  )
}

export default Page
