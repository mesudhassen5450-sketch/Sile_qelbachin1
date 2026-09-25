import ContentListPage from '@/views/content/ContentListPage'

const Page = () => (
  <ContentListPage
    title='PDFs'
    description='Add PDF documents with an optional cover. Newest items show first on the website and in the app.'
    type='pdfs'
    columns={['title', 'meta', 'media', 'status', 'updated']}
    allowCreate
  />
)

export default Page
