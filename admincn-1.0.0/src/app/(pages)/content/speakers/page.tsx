import { redirect } from 'next/navigation'

/** Removed from CMS — keep route so old bookmarks land on Kitabs. */
export default function SpeakersPage() {
  redirect('/content/kitabs')
}
