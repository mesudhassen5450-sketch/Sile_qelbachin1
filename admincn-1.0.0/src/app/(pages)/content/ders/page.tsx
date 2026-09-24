import ContentListPage from '@/views/content/ContentListPage'

const Page = () => (
  <ContentListPage
    title='Ders'
    description='Ders lessons linked to Kitab records and R2 audio assets.'
    type='ders'
    columns={['title', 'meta', 'media', 'status', 'updated']}
  />
)

export default Page
