import ContentListPage from '@/views/content/ContentListPage'

const Page = () => (
  <ContentListPage
    title='Audio'
    description='Add audio with an optional cover. Newest items show first on the website and in the app.'
    type='audio'
    columns={['title', 'meta', 'media', 'status', 'updated']}
    allowCreate
  />
)

export default Page
