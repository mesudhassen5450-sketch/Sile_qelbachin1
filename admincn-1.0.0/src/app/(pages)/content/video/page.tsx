import ContentListPage from '@/views/content/ContentListPage'

const Page = () => (
  <ContentListPage
    title='Video'
    description='Add video with an optional cover. Newest items show first on the website and in the app.'
    type='video'
    columns={['title', 'meta', 'media', 'status', 'updated']}
    allowCreate
  />
)

export default Page
