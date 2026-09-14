import type { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';
import { buildKitabLibraryJsonLd, pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata('/kitab');

export default function KitabLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={buildKitabLibraryJsonLd()} />
      {children}
    </>
  );
}
