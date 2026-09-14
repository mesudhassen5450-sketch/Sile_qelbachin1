import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata('/knowledge');

export default function KnowledgeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
