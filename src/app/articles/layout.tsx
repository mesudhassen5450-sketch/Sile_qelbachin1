import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata('/articles');

export default function ArticlesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
