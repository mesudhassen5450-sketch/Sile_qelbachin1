import ContentListPage from '@/views/content/ContentListPage'

const Page = () => (
  <ContentListPage
    title='Kitabs'
    description='Full control: priority (1 = first), featured, publish/unpublish, schedule, archive. Nested ders stay on each kitab.'
    type='kitabs'
    columns={['title', 'meta', 'media', 'status', 'priority', 'updated']}
    allowCreate
  />
)

export default Page
