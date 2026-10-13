import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata('/library');

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
