import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/data/channelData';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/account',
          '/account/',
          '/login',
          '/register',
          '/forgot-password',
          '/reset-password',
          '/auth/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
