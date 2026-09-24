import ContentListPage from '@/views/content/ContentListPage'

const Page = () => (
  <ContentListPage
    title='Video'
    description='Video catalog items linked to Cloudflare R2 video assets.'
    type='video'
    columns={['title', 'meta', 'media', 'status', 'updated']}
  />
)

export default Page
