import { redirect } from 'next/navigation'

/** Removed from CMS — keep route so old bookmarks land on Kitabs. */
export default function KnowledgePage() {
  redirect('/content/kitabs')
}
