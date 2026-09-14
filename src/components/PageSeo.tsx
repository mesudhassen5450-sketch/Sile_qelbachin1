'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import JsonLd from './JsonLd';
import {
  buildBreadcrumbJsonLd,
  buildWebPageJsonLd,
  getPageSeo,
  resolveCrumbs,
} from '@/lib/seo';

export default function PageSeo() {
  const pathname = usePathname() || '/';
  if (pathname === '/') return null;

  const crumbs = resolveCrumbs(pathname);
  const page = getPageSeo(pathname === '/videos' ? '/video-lecture' : pathname === '/muhadera' ? '/muhadara' : pathname);
  const current = crumbs[crumbs.length - 1];

  return (
    <>
      <JsonLd
        data={[
          buildWebPageJsonLd(
            pathname,
            page?.title || current.name,
            page?.description || current.name
          ),
          buildBreadcrumbJsonLd(crumbs),
        ]}
      />
      <nav aria-label="Breadcrumb" className="mb-6 text-sm">
        <ol className="flex flex-wrap items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1;
            return (
              <li key={`${crumb.path}-${index}`} className="flex items-center gap-1.5">
                {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />}
                {isLast ? (
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">{crumb.name}</span>
                ) : (
                  <Link href={crumb.path} className="hover:text-red-600 dark:hover:text-red-400 transition">
                    {crumb.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
