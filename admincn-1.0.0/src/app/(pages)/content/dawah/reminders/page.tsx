import YouthContentPage from '@/views/content/YouthContentPage'

/** For now Reminders = Youth → Articles (same public feed). Independent list later. */
const Page = () => (
  <YouthContentPage
    kind="articles"
    titleOverride="Reminders"
    descOverride="For now this uses Youth → Articles (same list the public site shows on Da’wah / Library / home Featured). Edit Featured + Priority here or under Youth → Articles. Independent Reminders come next."
  />
)

export default Page
