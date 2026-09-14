import { kitabsData } from '@/data/channelData';
import KitabDetailClient from './KitabDetailClient';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/JsonLd';
import { absoluteUrl, buildKitabJsonLd, pageMetadata } from '@/lib/seo';

export async function generateStaticParams() {
  return kitabsData.map((kitab) => ({
    slug: kitab.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const kitab = kitabsData.find((k) => k.slug === slug);

  const titleString = kitab
    ? typeof kitab.title === 'string'
      ? kitab.title
      : kitab.title.am
    : 'የኪታብ ድርስ';

  const descString = kitab
    ? typeof kitab.description === 'string'
      ? kitab.description
      : kitab.description.am
    : 'የኪታብ ድምፅ ድርሶች';

  const cover = kitab?.coverImage
    ? kitab.coverImage.startsWith('http')
      ? kitab.coverImage
      : absoluteUrl(kitab.coverImage)
    : absoluteUrl('/logo.jpg');

  const dersHint = kitab
    ? ` ${kitab.dersCount} audio ders available on Sile Qelbachin.`
    : '';

  return pageMetadata(`/kitab/${slug}`, {
    title: `${titleString}`,
    description: `${descString}${dersHint}`,
    openGraph: {
      type: 'article',
      images: [{ url: cover, alt: titleString }],
    },
    twitter: {
      card: 'summary_large_image',
      images: [cover],
    },
  });
}

export default async function KitabDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const kitab = kitabsData.find((k) => k.slug === slug);

  if (!kitab) {
    notFound();
  }

  return (
    <>
      <JsonLd data={buildKitabJsonLd(kitab)} />
      <KitabDetailClient kitab={kitab} />
    </>
  );
}
