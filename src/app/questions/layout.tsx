import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata('/questions');

export default function QuestionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
