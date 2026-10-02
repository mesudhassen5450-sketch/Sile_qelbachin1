import ContentListPage from '@/views/content/ContentListPage'

const Page = () => (
  <ContentListPage
    title='PDFs'
    description='Library PDFs. Priority, featured, publish, schedule, archive.'
    type='pdfs'
    pdfSection='pdfs'
    columns={['title', 'meta', 'media', 'status', 'priority', 'updated']}
    allowCreate
  />
)

export default Page
