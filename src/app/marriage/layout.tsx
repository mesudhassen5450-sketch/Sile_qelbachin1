import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata('/marriage');

export default function MarriageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
