import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { remindersData } from '@/data/channelData';
import { getReminderById } from '@/lib/contentCatalog';
import ReminderDetailClient from './ReminderDetailClient';

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return remindersData.map((r) => ({ id: r.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const reminder = getReminderById(id);
  if (!reminder) return { title: 'Reminder not found' };
  const title = typeof reminder.title === 'string' ? reminder.title : reminder.title.en;
  return {
    title: `${title} | ስለ ቀልባችን`,
    description: 'Islamic reminder from Sile Qelbachin.',
    alternates: { canonical: `https://sileqelbachin1.com/reminder/${id}` },
    openGraph: {
      title,
      url: `https://sileqelbachin1.com/reminder/${id}`,
      siteName: 'ስለ ቀልባችን',
      type: 'article',
    },
  };
}

export default async function ReminderPage({ params }: Props) {
  const { id } = await params;
  const reminder = getReminderById(id);
  if (!reminder) notFound();
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/reminders" className="text-xs font-bold text-neutral-500 hover:text-red-600">
        ← Reminders
      </Link>
      <ReminderDetailClient reminder={reminder} />
    </div>
  );
}
