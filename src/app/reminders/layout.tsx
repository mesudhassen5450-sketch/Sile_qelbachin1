import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata('/reminders');

export default function RemindersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
