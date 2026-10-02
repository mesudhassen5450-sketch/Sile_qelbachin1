import ContentListPage from '@/views/content/ContentListPage'

const Page = () => (
  <ContentListPage
    title='Notes'
    description='Study notes (PDF). Kept separate from Library PDFs. Priority, featured, publish, archive.'
    type='pdfs'
    pdfSection='notes'
    columns={['title', 'meta', 'media', 'status', 'priority', 'updated']}
    allowCreate
  />
)

export default Page
