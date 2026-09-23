import { MetadataRoute } from 'next';
import { getCanonicalUrl } from '@/config/site';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getCanonicalUrl();
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/admin/', '/admin/*', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
