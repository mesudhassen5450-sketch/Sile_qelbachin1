import ContentListPage from '@/views/content/ContentListPage'

const Page = () => (
  <ContentListPage
    title='Sahabah'
    description='Add Sahabah profiles with title, description, biography, and optional cover. Newest first on the website and in the app.'
    type='sahabah'
    columns={['title', 'meta', 'media', 'status', 'updated']}
    allowCreate
  />
)

export default Page
