import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  // Admin/auth/todos stay crawlable so crawlers can see their noindex directive.
  // Authentication, not robots.txt, protects the dashboard and private data.
  const policy = { allow: '/', disallow: ['/api/', '/private/'] };
  return {
    rules: [{ userAgent: '*', ...policy }, { userAgent: 'OAI-SearchBot', ...policy }],
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
