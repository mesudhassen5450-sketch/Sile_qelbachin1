import ContentListPage from '@/views/content/ContentListPage'

const Page = () => (
  <ContentListPage
    title='Videos (1 min+)'
    description='Long-form videos. Priority, featured, publish/unpublish, schedule, archive.'
    type='video'
    videoSection='long'
    columns={['title', 'meta', 'media', 'status', 'priority', 'updated']}
    allowCreate
  />
)

export default Page
