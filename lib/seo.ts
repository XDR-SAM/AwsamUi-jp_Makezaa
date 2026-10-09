import type { Metadata } from 'next';
import sanitizeHtml from 'sanitize-html';
import type { Post, Project } from './types';
import { siteEmail } from './nav-links';

export const SITE_ORIGIN = 'https://www.makezaa.com';
export const SITE_DESCRIPTION = 'Makezaa builds websites, apps, and digital strategy for growing businesses. Based in Dhaka, Bangladesh, serving clients worldwide.';
export const PRIVATE_ROBOTS: Metadata['robots'] = { index: false, follow: false, nocache: true };

export function absoluteUrl(path: string): string {
  return new URL(path, `${SITE_ORIGIN}/`).href;
}

export function contentPath(kind: 'blog' | 'projects', slug: string): string {
  return `/${kind}/${encodeURIComponent(slug)}`;
}

/** Plain text only; CMS markup must never become executable metadata. */
export function plainText(value: string | null | undefined): string {
  const spaced = (value ?? '').replace(/<\/(?:p|div|li|h[1-6]|blockquote)>|<br\s*\/?>/gi, ' ');
  return sanitizeHtml(spaced, { allowedTags: [], allowedAttributes: {}, parser: { decodeEntities: true } })
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

export function descriptionText(summary: string | null, content: string | null, fallback: string): string {
  const text = plainText(summary) || plainText(content) || fallback;
  if (text.length <= 170) return text;
  const shortened = text.slice(0, 167);
  const breakAt = shortened.lastIndexOf(' ');
  return `${shortened.slice(0, breakAt > 120 ? breakAt : shortened.length)}…`;
}

export function previewImage(kind: 'site' | 'blog' | 'projects', slug: string): string {
  return absoluteUrl(`/og/${kind}/${encodeURIComponent(slug)}`);
}

function withCover(metadata: Metadata, cover: string | null, title: string): Metadata {
  if (!cover || !/^https:\/\//i.test(cover)) return metadata;
  return { ...metadata,
    openGraph: { ...metadata.openGraph, images: [{ url: cover, alt: plainText(title) },
      ...(Array.isArray(metadata.openGraph?.images) ? metadata.openGraph.images : [])] },
    twitter: { ...metadata.twitter, images: [{ url: cover, alt: plainText(title) }] },
  };
}

export function pageMetadata(title: string, description: string, path: string, image = previewImage('site', 'home')): Metadata {
  const url = absoluteUrl(path);
  const displayTitle = `${title} | Makezaa`;
  return {
    title, description,
    alternates: { canonical: url },
    openGraph: { type: 'website', siteName: 'Makezaa', title: displayTitle, description, url,
      images: [{ url: image, width: 1200, height: 630, alt: displayTitle }] },
    twitter: { card: 'summary_large_image', title: displayTitle, description,
      images: [{ url: image, alt: displayTitle }] },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
  };
}

export function postMetadata(post: Post): Metadata {
  const description = descriptionText(post.excerpt, post.content, `Read ${plainText(post.title)} on the Makezaa blog.`);
  const metadata = withCover(pageMetadata(plainText(post.title), description, contentPath('blog', post.slug), previewImage('blog', post.slug)), post.cover_image, post.title);
  return { ...metadata, openGraph: { ...metadata.openGraph, type: 'article',
    publishedTime: post.created_at, modifiedTime: post.updated_at, authors: [absoluteUrl('/blog')], tags: post.tags ?? [] } };
}

export function projectMetadata(project: Project): Metadata {
  return withCover(pageMetadata(plainText(project.title), descriptionText(project.description, project.content,
    `Explore ${plainText(project.title)}, a Makezaa project.`), contentPath('projects', project.slug), previewImage('projects', project.slug)), project.cover_image, project.title);
}

export const organization = {
  '@type': 'Organization', '@id': absoluteUrl('/#organization'), name: 'Makezaa', url: absoluteUrl('/'),
  logo: { '@type': 'ImageObject', url: absoluteUrl('/favicon.png') },
  description: SITE_DESCRIPTION, email: siteEmail,
  address: { '@type': 'PostalAddress', addressLocality: 'Dhaka', addressCountry: 'BD' },
};

export function siteSchema() {
  return { '@context': 'https://schema.org', '@graph': [organization,
    { '@type': 'WebSite', '@id': absoluteUrl('/#website'), name: 'Makezaa', url: absoluteUrl('/'),
      publisher: { '@id': organization['@id'] }, inLanguage: 'en' }] };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return { '@type': 'BreadcrumbList', itemListElement: items.map((item, index) => ({
    '@type': 'ListItem', position: index + 1, name: item.name, item: absoluteUrl(item.path),
  })) };
}

export function postSchema(post: Post) {
  const url = absoluteUrl(contentPath('blog', post.slug));
  return { '@context': 'https://schema.org', '@graph': [organization, {
    '@type': 'BlogPosting', '@id': `${url}#article`, url, headline: plainText(post.title),
    description: descriptionText(post.excerpt, post.content, `Read ${plainText(post.title)} on Makezaa.`),
    image: post.cover_image || previewImage('blog', post.slug), datePublished: post.created_at, dateModified: post.updated_at,
    author: { '@type': 'Organization', name: 'Makezaa', '@id': organization['@id'], url: absoluteUrl('/blog') },
    publisher: { '@id': organization['@id'] }, mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    keywords: post.tags ?? [],
  }, breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Blog', path: '/blog' }, { name: post.title, path: contentPath('blog', post.slug) }])] };
}

export function projectSchema(project: Project) {
  const url = absoluteUrl(contentPath('projects', project.slug));
  return { '@context': 'https://schema.org', '@graph': [organization, {
    '@type': 'CreativeWork', '@id': `${url}#project`, url, name: plainText(project.title),
    description: descriptionText(project.description, project.content, `A Makezaa project: ${plainText(project.title)}.`),
    image: project.cover_image || previewImage('projects', project.slug), creator: { '@id': organization['@id'] },
    dateCreated: project.created_at, dateModified: project.updated_at, keywords: project.tech_stack ?? [],
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  }, breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Projects', path: '/projects' }, { name: project.title, path: contentPath('projects', project.slug) }])] };
}

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}
