import type { MetadataRoute } from 'next';
import { kitabsData, sahabahData, SITE_URL } from '@/data/channelData';
import { SITE_PAGES } from '@/lib/seo';

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

  // Help Google discover each ders under its kitab (e.g. Intebih Ders 1…)
  const dersRoutes: MetadataRoute.Sitemap = kitabsData.flatMap((kitab) =>
    kitab.dersList.map((_, index) => ({
      url: `${SITE_URL}/kitab/${kitab.slug}?ders=${index + 1}`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.65,
    }))
  );

  const sahabahRoutes: MetadataRoute.Sitemap = sahabahData.map((sahabah) => ({
    url: `${SITE_URL}/sahabah/${sahabah.slug}`,
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...kitabRoutes, ...dersRoutes, ...sahabahRoutes];
}
