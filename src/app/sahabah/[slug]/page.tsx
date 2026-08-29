import { sahabahData } from '@/data/channelData';
import SahabahDetailClient from './SahabahDetailClient';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  return sahabahData.map((s) => ({
    slug: s.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sahabah = sahabahData.find((s) => s.slug === slug);

  const nameString = sahabah
    ? typeof sahabah.name === 'string'
      ? sahabah.name
      : sahabah.name.am
    : 'የሶሓቦች ታሪክ';

  const descString = sahabah
    ? typeof sahabah.shortDescription === 'string'
      ? sahabah.shortDescription
      : sahabah.shortDescription.am
    : 'የሶሓቦች ታሪክና ትምህርቶች';

  return {
    title: `${nameString} - ስለ ቀልባችን`,
    description: descString,
  };
}

export default async function SahabahDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sahabah = sahabahData.find((s) => s.slug === slug);

  if (!sahabah) {
    notFound();
  }

  return <SahabahDetailClient sahabah={sahabah} />;
}
