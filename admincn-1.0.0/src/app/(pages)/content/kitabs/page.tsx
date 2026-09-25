import ContentListPage from '@/views/content/ContentListPage'

const Page = () => (
  <ContentListPage
    title='Kitabs'
    description='Add kitabs with cover, PDF, sheikh, and ders audio. Newest items show first on the website and in the app.'
    type='kitabs'
    columns={['title', 'meta', 'media', 'status', 'updated']}
    allowCreate
  />
)

export default Page
