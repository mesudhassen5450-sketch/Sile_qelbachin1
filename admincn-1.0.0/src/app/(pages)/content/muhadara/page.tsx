import ContentListPage from '@/views/content/ContentListPage'

const Page = () => (
  <ContentListPage
    title='Muhadara'
    description='Muhadara uses the audio archive records (no duplicate audio rows).'
    type='audio'
    columns={['title', 'meta', 'media', 'status', 'updated']}
  />
)

export default Page
