import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Muhadara — Islamic Discourses',
  alternates: { canonical: '/muhadara' },
  robots: { index: false, follow: true },
};

export default function MuhaderaAliasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
