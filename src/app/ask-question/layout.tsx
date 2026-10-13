import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata('/ask-question');

export default function AskQuestionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
