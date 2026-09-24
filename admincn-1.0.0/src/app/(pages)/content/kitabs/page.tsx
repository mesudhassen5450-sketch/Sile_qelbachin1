import ContentListPage from '@/views/content/ContentListPage'

const Page = () => (
  <ContentListPage
    title='Kitabs'
    description='Database-driven Kitab management. Covers, PDFs, and Ders link to Cloudflare media assets.'
    type='kitabs'
    columns={['title', 'meta', 'media', 'status', 'updated']}
  />
)

export default Page
