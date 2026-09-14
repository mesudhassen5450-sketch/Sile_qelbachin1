import type { Metadata } from 'next';
import Link from 'next/link';
import { getSpeakers } from '@/lib/contentCatalog';

export const metadata: Metadata = {
  title: 'Speakers / Ustaazes | ስለ ቀልባችን',
  description: 'Speakers associated with verified Sile Qelbachin lessons. Names derived from existing content only.',
  alternates: { canonical: 'https://sileqelbachin1.com/speakers' },
};

export default function SpeakersPage() {
  const speakers = getSpeakers();

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Speakers / Ustaazes</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
          Profiles list speakers named on existing Ders and Muhadara only. Biographies are not invented —
          if a biography is not available, it is omitted.
        </p>
      </div>

      {speakers.length === 0 ? (
        <p className="text-sm text-neutral-500">No speakers available.</p>
      ) : (
        <ul className="space-y-3">
          {speakers.map((s) => (
            <li key={s.slug}>
              <Link
                href={`/speakers/${s.slug}`}
                className="block p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-red-600/40 transition"
              >
                <h2 className="font-semibold text-neutral-900 dark:text-white">{s.name}</h2>
                <p className="text-xs text-neutral-500 mt-1">
                  {s.dersIds.length} ders · {s.kitabSlugs.length} kitab
                  {s.muhadaraIds.length ? ` · ${s.muhadaraIds.length} muhadara` : ''}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
