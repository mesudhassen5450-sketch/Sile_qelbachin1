import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllDers, getDersById } from '@/lib/contentCatalog';
import DersDetailClient from './DersDetailClient';

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return getAllDers().map((d) => ({ id: d.ders.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const rec = getDersById(id);
  if (!rec) return { title: 'Ders not found' };
  const kitabTitle = typeof rec.kitab.title === 'string' ? rec.kitab.title : rec.kitab.title.en;
  const dersTitle = typeof rec.ders.title === 'string' ? rec.ders.title : rec.ders.title.en;
  return {
    title: `${dersTitle} · ${kitabTitle} | ስለ ቀልባችን`,
    description: `Listen to ${dersTitle} from ${kitabTitle} on Sile Qelbachin.`,
    alternates: { canonical: `https://sileqelbachin1.com/ders/${id}` },
    openGraph: {
      title: `${dersTitle} · ${kitabTitle}`,
      url: `https://sileqelbachin1.com/ders/${id}`,
      siteName: 'ስለ ቀልባችን',
      type: 'website',
    },
  };
}

export default async function DersPage({ params }: Props) {
  const { id } = await params;
  const rec = getDersById(id);
  if (!rec) notFound();
  return <DersDetailClient record={rec} />;
}
