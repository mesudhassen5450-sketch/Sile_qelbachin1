import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata('/dawah');

export default function DawahLayout({ children }: { children: React.ReactNode }) {
  return children;
}
