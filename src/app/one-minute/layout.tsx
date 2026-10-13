import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata('/one-minute');

export default function OneMinuteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
