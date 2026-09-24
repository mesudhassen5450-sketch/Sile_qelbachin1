import ContentListPage from '@/views/content/ContentListPage'

const Page = () => (
  <ContentListPage
    title='Audio'
    description='Audio archive / Muhadara items linked to R2 objects.'
    type='audio'
    columns={['title', 'meta', 'media', 'status', 'updated']}
  />
)

export default Page
