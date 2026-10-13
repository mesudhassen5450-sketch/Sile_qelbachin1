import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata('/quran-recitation');

export default function QuranRecitationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
