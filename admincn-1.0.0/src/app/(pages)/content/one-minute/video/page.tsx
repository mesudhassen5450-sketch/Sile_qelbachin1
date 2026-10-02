import ContentListPage from '@/views/content/ContentListPage'

const Page = () => (
  <ContentListPage
    title='1-Minute Video'
    description='Short videos for the 1-Minute section. Priority, featured, publish, schedule, archive.'
    type='video'
    videoSection='one_minute'
    columns={['title', 'meta', 'media', 'status', 'priority', 'updated']}
    allowCreate
  />
)

export default Page
