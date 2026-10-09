import type { MetadataRoute } from 'next';
import { getSitemapContent } from '@/lib/seo-content';
import { absoluteUrl, contentPath } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, projects] = await Promise.all([getSitemapContent('posts'), getSitemapContent('projects')]);
  return [
    ...['/', '/blog', '/projects', '/contact'].map(path => ({ url: absoluteUrl(path) })),
    ...posts.map(post => ({ url: absoluteUrl(contentPath('blog', post.slug)), lastModified: post.updated_at })),
    ...projects.map(project => ({ url: absoluteUrl(contentPath('projects', project.slug)), lastModified: project.updated_at })),
  ];
}
