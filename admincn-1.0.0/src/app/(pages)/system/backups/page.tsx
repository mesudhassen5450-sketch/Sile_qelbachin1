import PlaceholderPage from '@/views/shared/PlaceholderPage'

const Page = () => {
  return (
    <PlaceholderPage
      title='Backups'
      description='Content and database backup history.'
      actionLabel='Run Backup'
      rows={[{ id: '1', title: 'backup-2026-09-22', status: 'Published', meta: 'Complete', updated: '2026-09-22' },
    { id: '2', title: 'backup-2026-09-15', status: 'Published', meta: 'Complete', updated: '2026-09-15' },
    { id: '3', title: 'backup-2026-09-08', status: 'Draft', meta: 'Failed', updated: '2026-09-08' }]}
    />
  )
}

export default Page
