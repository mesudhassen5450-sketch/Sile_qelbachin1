import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata('/muhadara');

export default function MuhadaraLayout({ children }: { children: React.ReactNode }) {
  return children;
}
