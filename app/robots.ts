import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  // Admin/auth/todos stay crawlable so crawlers can see their noindex directive.
  // Authentication, not robots.txt, protects the dashboard and private data.
  const policy = { allow: '/', disallow: ['/api/', '/private/'] };
  return {
    // Repeat the complete policy: named groups do not inherit wildcard rules.
    // The wildcard also welcomes crawlers not named here, including future bots.
    rules: ['*', 'Googlebot', 'Googlebot-Image', 'Googlebot-Video', 'Google-Extended',
      'bingbot', 'OAI-SearchBot', 'GPTBot', 'ChatGPT-User', 'ClaudeBot',
      'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User']
      .map(userAgent => ({ userAgent, ...policy })),
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
