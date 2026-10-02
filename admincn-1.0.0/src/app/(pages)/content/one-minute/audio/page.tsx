import ContentListPage from '@/views/content/ContentListPage'

const Page = () => (
  <ContentListPage
    title='1-Minute Audio'
    description='Short audio for the public 1-Minute section. Priority, featured, publish, schedule, archive.'
    type='audio'
    audioSection='one_minute'
    columns={['title', 'meta', 'media', 'status', 'priority', 'updated']}
    allowCreate
  />
)

export default Page
