import JsonLd from '@/components/JsonLd';
import { buildSiteNavigationJsonLd, buildWebsiteJsonLd } from '@/lib/seo';

export default function SiteJsonLd() {
  return <JsonLd data={[buildWebsiteJsonLd(), buildSiteNavigationJsonLd()]} />;
}
