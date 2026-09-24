import PlaceholderPage from '@/views/shared/PlaceholderPage'

const Page = () => {
  return (
    <PlaceholderPage
      title='Configuration'
      description='Environment and feature flags (static placeholders).'
      actionLabel='Save'
      rows={[{ id: '1', title: 'feature.cms', status: 'Published', meta: 'Enabled', updated: '2026-09-20' },
    { id: '2', title: 'feature.ai', status: 'Draft', meta: 'Disabled', updated: '2026-09-20' },
    { id: '3', title: 'cdn.base', status: 'Published', meta: 'Configured', updated: '2026-09-18' }]}
    />
  )
}

export default Page
