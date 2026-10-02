import ContentListPage from '@/views/content/ContentListPage'

const Page = () => (
  <ContentListPage
    title="Qur'an Recitations"
    description='Recitation audio for the public archive. Priority 1 shows first. Publish, feature, schedule, archive.'
    type='audio'
    audioSection='quran'
    columns={['title', 'meta', 'media', 'status', 'priority', 'updated']}
    allowCreate
  />
)

export default Page
