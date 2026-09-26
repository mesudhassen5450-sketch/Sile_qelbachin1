import { notFound } from 'next/navigation'

import { kitabsData } from '@/data/channelData'
import JsonLd from '@/components/JsonLd'
import { absoluteUrl, buildKitabJsonLd, pageMetadata } from '@/lib/seo'
import { loadKitabBySlug } from '@/lib/loadKitabs'
import KitabDetailClient from './KitabDetailClient'

export const dynamicParams = true
export const dynamic = 'force-dynamic'

export async function generateStaticParams() {
  return kitabsData.map(kitab => ({
    slug: kitab.slug
  }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const kitab = await loadKitabBySlug(slug)

  const titleString = kitab
    ? typeof kitab.title === 'string'
      ? kitab.title
      : kitab.title.am || kitab.title.en
    : 'የኪታብ ድርስ'

  const descString = kitab
    ? typeof kitab.description === 'string'
      ? kitab.description
      : kitab.description.am || kitab.description.en
    : 'የኪታብ ድምፅ ድርሶች'

  const cover = kitab?.coverImage
    ? kitab.coverImage.startsWith('http')
      ? kitab.coverImage
      : absoluteUrl(kitab.coverImage)
    : absoluteUrl('/logo.jpg')

  const dersHint = kitab ? ` ${kitab.dersCount} audio ders available on Sile Qelbachin.` : ''

  return pageMetadata(`/kitab/${slug}`, {
    title: `${titleString}`,
    description: `${descString}${dersHint}`,
    openGraph: {
      type: 'article',
      images: [{ url: cover, alt: titleString }]
    },
    twitter: {
      card: 'summary_large_image',
      images: [cover]
    }
  })
}

export default async function KitabDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const kitab = await loadKitabBySlug(slug)

  if (!kitab) {
    notFound()
  }

  return (
    <>
      <JsonLd data={buildKitabJsonLd(kitab)} />
      <KitabDetailClient kitab={kitab} />
    </>
  )
}
