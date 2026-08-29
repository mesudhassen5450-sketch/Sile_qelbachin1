import { kitabsData } from '@/data/channelData';
import KitabDetailClient from './KitabDetailClient';
import { notFound } from 'next/navigation';

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

  return {
    title: `${titleString} - ስለ ቀልባችን`,
    description: descString,
  };
}

export default async function KitabDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const kitab = kitabsData.find((k) => k.slug === slug);

  if (!kitab) {
    notFound();
  }

  return <KitabDetailClient kitab={kitab} />;
}
