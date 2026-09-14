import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata('/sahabah');

export default function SahabahLayout({ children }: { children: React.ReactNode }) {
  return children;
}
