'use client';

import { useMemo, useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, BookOpen, Headphones, Mic2, Heart, Users, Video, FileText } from 'lucide-react';
import { globalSearch, type ContentType, type SearchResult } from '@/lib/contentCatalog';
import { useLanguage } from '@/context/LanguageContext';

const TYPE_LABELS: Record<ContentType, string> = {
  kitab: 'Kitab',
  ders: 'Ders',
  muhadara: 'Muhadara',
  reminder: 'Reminder',
  knowledge: 'Qur\'an & Hadith',
  sahabah: 'Sahabah',
  speaker: 'Speaker',
  audio: 'Audio',
  video: 'Video',
  pdf: 'PDF',
};

function typeIcon(type: ContentType) {
  switch (type) {
    case 'kitab':
      return <BookOpen className="w-4 h-4" />;
    case 'ders':
    case 'audio':
      return <Headphones className="w-4 h-4" />;
    case 'muhadara':
      return <Mic2 className="w-4 h-4" />;
    case 'reminder':
      return <Heart className="w-4 h-4" />;
    case 'speaker':
    case 'sahabah':
      return <Users className="w-4 h-4" />;
    case 'video':
      return <Video className="w-4 h-4" />;
    default:
      return <FileText className="w-4 h-4" />;
  }
}

function SearchPageInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { t } = useLanguage();
  const initial = params.get('q') || '';
  const [query, setQuery] = useState(initial);

  useEffect(() => {
    setQuery(initial);
  }, [initial]);

  const results: SearchResult[] = useMemo(() => globalSearch(query, 50), [query]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.replace(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
          {t('navSearch')}
        </h1>
        <p className="text-neutral-600 dark:text-neutral-300 text-sm leading-relaxed">
          Search Kitab, Ders, Muhadara, reminders, speakers, Sahabah, and media available on Sile Qelbachin.
        </p>
      </div>

      <form onSubmit={onSubmit} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Intebih, ders 3, sabr, marriage…"
          className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600/40"
          aria-label="Search site content"
          autoFocus
        />
      </form>

      {!query.trim() && (
        <p className="text-sm text-neutral-500">Enter a keyword to search verified site content.</p>
      )}

      {query.trim() && results.length === 0 && (
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          No matching content found in the available Sile Qelbachin library.
        </p>
      )}

      <ul className="space-y-3">
        {results.map((r) => (
          <li key={`${r.type}-${r.id}`}>
            <Link
              href={r.href}
              className="block p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 hover:border-red-600/40 transition"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-red-600 dark:text-red-400">{typeIcon(r.type)}</span>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-2xs font-bold uppercase tracking-wide text-red-700 dark:text-red-400">
                      {TYPE_LABELS[r.type]}
                    </span>
                    {r.speaker && (
                      <span className="text-xs text-neutral-500 truncate">{r.speaker}</span>
                    )}
                    {r.author && (
                      <span className="text-xs text-neutral-500 truncate">{r.author}</span>
                    )}
                  </div>
                  <h2 className="font-semibold text-neutral-900 dark:text-white leading-snug">{r.title}</h2>
                  {r.description && (
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">{r.description}</p>
                  )}
                  <p className="text-xs font-mono text-neutral-400 truncate">{r.href}</p>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="text-sm text-neutral-500">Loading search…</div>}>
      <SearchPageInner />
    </Suspense>
  );
}
