import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata('/video-lecture');

export default function VideoLectureLayout({ children }: { children: React.ReactNode }) {
  return children;
}
