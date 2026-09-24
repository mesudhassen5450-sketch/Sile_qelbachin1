import ContentListPage from '@/views/content/ContentListPage'

const Page = () => (
  <ContentListPage
    title='PDFs'
    description='PDF assets linked to R2 and optionally to Kitabs.'
    type='pdfs'
    columns={['title', 'meta', 'media', 'status', 'updated']}
  />
)

export default Page
