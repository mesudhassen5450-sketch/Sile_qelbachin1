import type { MetadataRoute } from 'next';
import { getShareableSitemapPaths } from '@/lib/contentCatalog';

const SITE = 'https://sileqelbachin1.com';

export default function sitemap(): MetadataRoute.Sitemap {
  return getShareableSitemapPaths().map((path) => ({
    url: `${SITE}${path === '/' ? '' : path}`,
  }));
}
