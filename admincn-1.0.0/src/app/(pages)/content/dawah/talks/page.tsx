import ContentListPage from '@/views/content/ContentListPage'

const Page = () => (
  <ContentListPage
    title="Da'wah Talks (audio)"
    description='Audio talks (1 min+) for Da`wah. Priority, featured, publish/unpublish, schedule, archive.'
    type='audio'
    audioSection='dawah'
    columns={['title', 'meta', 'media', 'status', 'priority', 'updated']}
    allowCreate
  />
)

export default Page
