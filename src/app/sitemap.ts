import type { MetadataRoute } from 'next';
import { kitabsData, sahabahData, SITE_URL } from '@/data/channelData';
import { SITE_PAGES } from '@/lib/seo';

/**
 * Clean sitemap for international indexing.
 * Hub pages + kitabs + sahabah only — no ?ders= query URLs (those inflate
 * Search Console “Not indexed” without helping sitelinks).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticRoutes: MetadataRoute.Sitemap = SITE_PAGES.map((page) => ({
    url: page.path === '/' ? SITE_URL : `${SITE_URL}${page.path}`,
    lastModified,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  const kitabRoutes: MetadataRoute.Sitemap = kitabsData.map((kitab) => ({
    url: `${SITE_URL}/kitab/${kitab.slug}`,
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  const sahabahRoutes: MetadataRoute.Sitemap = sahabahData.map((sahabah) => ({
    url: `${SITE_URL}/sahabah/${sahabah.slug}`,
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...kitabRoutes, ...sahabahRoutes];
}
