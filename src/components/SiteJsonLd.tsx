import JsonLd from '@/components/JsonLd';
import {
  buildOrganizationJsonLd,
  buildSiteNavigationJsonLd,
  buildWebsiteJsonLd,
} from '@/lib/seo';

/** Global Organization + WebSite + sitelink navigation (Netlify-style hub discovery). */
export default function SiteJsonLd() {
  return (
    <JsonLd
      data={[buildOrganizationJsonLd(), buildWebsiteJsonLd(), buildSiteNavigationJsonLd()]}
    />
  );
}
