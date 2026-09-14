import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata('/audio-lecture');

export default function AudioLectureLayout({ children }: { children: React.ReactNode }) {
  return children;
}
