import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSpeakers, getSpeakerBySlug, getDersById } from '@/lib/contentCatalog';
import { getMuhadaraById, getKitabBySlug } from '@/lib/contentCatalog';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getSpeakers().map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const speaker = getSpeakerBySlug(slug);
  if (!speaker) return { title: 'Speaker not found' };
  return {
    title: `${speaker.name} | ስለ ቀልባችን`,
    description: `Lessons associated with ${speaker.name} on Sile Qelbachin.`,
    alternates: { canonical: `https://sileqelbachin1.com/speakers/${slug}` },
  };
}

export default async function SpeakerDetailPage({ params }: Props) {
  const { slug } = await params;
  const speaker = getSpeakerBySlug(slug);
  if (!speaker) notFound();

  const ders = speaker.dersIds
    .map((id) => getDersById(id))
    .filter(Boolean);
  const kitabs = speaker.kitabSlugs
    .map((s) => getKitabBySlug(s))
    .filter(Boolean);
  const muhadara = speaker.muhadaraIds
    .map((id) => getMuhadaraById(id))
    .filter(Boolean);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Link href="/speakers" className="text-xs font-bold text-neutral-500 hover:text-red-600">
        ← Speakers
      </Link>

      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">{speaker.name}</h1>
        <p className="text-sm text-neutral-500">
          Biography: Not available
        </p>
      </header>

      {kitabs.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold">Kitab</h2>
          <ul className="space-y-2">
            {kitabs.map((k) =>
              k ? (
                <li key={k.slug}>
                  <Link href={`/kitab/${k.slug}`} className="text-sm text-red-700 dark:text-red-400 hover:underline">
                    {typeof k.title === 'string' ? k.title : k.title.en}
                  </Link>
                </li>
              ) : null
            )}
          </ul>
        </section>
      )}

      {ders.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold">Ders</h2>
          <ul className="space-y-2">
            {ders.map((d) =>
              d ? (
                <li key={d.ders.id}>
                  <Link href={d.href} className="text-sm hover:text-red-600">
                    {(typeof d.kitab.title === 'string' ? d.kitab.title : d.kitab.title.en)} —{' '}
                    {typeof d.ders.title === 'string' ? d.ders.title : d.ders.title.en}
                  </Link>
                </li>
              ) : null
            )}
          </ul>
        </section>
      )}

      {muhadara.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold">Muhadara</h2>
          <ul className="space-y-2">
            {muhadara.map((m) =>
              m ? (
                <li key={m.id}>
                  <Link href={`/muhadara/${m.id}`} className="text-sm hover:text-red-600">
                    {typeof m.title === 'string' ? m.title : m.title.en}
                  </Link>
                </li>
              ) : null
            )}
          </ul>
        </section>
      )}
    </div>
  );
}
