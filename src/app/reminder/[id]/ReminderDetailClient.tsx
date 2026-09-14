'use client';

import { Share2 } from 'lucide-react';
import type { Reminder } from '@/data/channelData';
import { useLanguage } from '@/context/LanguageContext';

export default function ReminderDetailClient({ reminder }: { reminder: Reminder }) {
  const { getLocalized } = useLanguage();

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: getLocalized(reminder.title), url });
      else await navigator.clipboard.writeText(url);
    } catch {
      /* cancelled */
    }
  };

  return (
    <article className="space-y-5">
      <p className="text-xs font-bold uppercase tracking-wide text-red-700 dark:text-red-400">
        {reminder.category} · {reminder.type}
      </p>
      <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
        {getLocalized(reminder.title)}
      </h1>
      <blockquote className="text-lg leading-relaxed text-neutral-800 dark:text-neutral-200 border-l-4 border-red-600 pl-4">
        {getLocalized(reminder.content)}
      </blockquote>
      <p className="text-sm text-neutral-500">Source: {getLocalized(reminder.source)}</p>
      <button
        type="button"
        onClick={share}
        className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700"
      >
        <Share2 className="w-4 h-4" />
        Share
      </button>
    </article>
  );
}
