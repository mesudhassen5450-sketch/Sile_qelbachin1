import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { muhadarasData } from '@/data/channelData';
import { getMuhadaraById } from '@/lib/contentCatalog';
import MuhadaraDetailClient from './MuhadaraDetailClient';

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return muhadarasData.map((m) => ({ id: m.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const item = getMuhadaraById(id);
  if (!item) return { title: 'Muhadara not found' };
  const title = typeof item.title === 'string' ? item.title : item.title.en;
  return {
    title: `${title} | ስለ ቀልባችን`,
    description: 'Muhadara from Sile Qelbachin.',
    alternates: { canonical: `https://sileqelbachin1.com/muhadara/${id}` },
    openGraph: {
      title,
      url: `https://sileqelbachin1.com/muhadara/${id}`,
      siteName: 'ስለ ቀልባችን',
      type: 'website',
    },
  };
}

export default async function MuhadaraDetailPage({ params }: Props) {
  const { id } = await params;
  const item = getMuhadaraById(id);
  if (!item) notFound();
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/muhadara" className="text-xs font-bold text-neutral-500 hover:text-red-600">
        ← Muhadara
      </Link>
      <MuhadaraDetailClient item={item} />
    </div>
  );
}
