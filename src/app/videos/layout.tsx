import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Video Lectures — Islamic Video Lessons',
  alternates: { canonical: '/video-lecture' },
  robots: { index: false, follow: true },
};

export default function VideosAliasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
