import ContentListPage from '@/views/content/ContentListPage'

const Page = () => {
  return (
    <ContentListPage
      title='Media Library'
      description='Imported Cloudflare R2 media assets (metadata in CMS database).'
      type='library'
      columns={['title', 'meta', 'status', 'updated']}
    />
  )
}

export default Page
