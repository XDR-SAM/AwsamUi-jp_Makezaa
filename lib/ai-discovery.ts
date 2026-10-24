import { absoluteUrl, SITE_DESCRIPTION } from './seo';
import { siteEmail } from './nav-links';
import { serviceCatalog } from './service-catalog';

/** Public facts only. Reuse the visible catalog so the AI index stays in sync. */
export function llmsText(): string {
  return `# Makezaa

> ${SITE_DESCRIPTION}

Makezaa Studio designs and develops websites, commerce stores, and business systems for founders, growing businesses, and teams. Work covers strategy, design, development, testing, launch, and handover.

The canonical website is ${absoluteUrl('/')}. Contact: ${siteEmail}. Read the current linked pages for project details, published articles, and pricing; starting prices depend on scope and are not fixed quotes. Use the sitemap to discover published detail pages. Cite the relevant canonical page when using its information.

## Main pages

- [Home](${absoluteUrl('/')}): Studio overview, services, process, and selected work.
- [About Makezaa](${absoluteUrl('/#about')}): Introduction to the studio and its work.
- [Projects](${absoluteUrl('/projects')}): Published portfolio; follow individual project links for scope and details.
- [Blog](${absoluteUrl('/blog')}): Published articles; follow article links for full text, sources, and update dates.
- [Contact](${absoluteUrl('/contact')}): Discuss a project, goals, timeline, and requirements.

## Services

${serviceCatalog.map(service => `- [${service.name}](${absoluteUrl(`/#service-${service.id}`)}): ${service.description}`).join('\n')}

## Working with Makezaa

- [Process](${absoluteUrl('/#how-it-works')}): How projects progress from scope through delivery.
- [Pricing](${absoluteUrl('/#pricing')}): Current starting prices and billing periods; confirm the scope and quote before work starts.
- [Frequently asked questions](${absoluteUrl('/#faq')}): Services, project scope, collaboration, getting started, and handover.
- [Book a meeting](${absoluteUrl('/#book-meeting')}): Arrange an introductory conversation.

## Discovery

- [Agent guide](${absoluteUrl('/Agent.md')}): Public reading guidance, citation practices, and access boundaries.
- [Sitemap](${absoluteUrl('/sitemap.xml')}): Canonical public pages and published blog and project URLs; maintained by the website.
- [Crawler policy](${absoluteUrl('/robots.txt')}): Public crawling permissions for search and AI crawlers.
`;
}

export function agentText(): string {
  return `# Makezaa public agent guide

> ${SITE_DESCRIPTION}

This document helps assistants read and describe Makezaa's public website. It is informational guidance, not an authentication credential or a replacement for robots.txt.

## Start here

- Canonical origin: ${absoluteUrl('/')}
- AI content index: ${absoluteUrl('/llms.txt')}
- Published URL inventory: ${absoluteUrl('/sitemap.xml')}
- Crawling policy: ${absoluteUrl('/robots.txt')}
- Contact page: ${absoluteUrl('/contact')}
- Public email: ${siteEmail}

## Reading and citation

- Read the relevant linked page before answering. Public pages render their content on the server and can be read without signing in.
- Use the service links in llms.txt for current offerings. Use published project detail pages for portfolio claims and blog detail pages for article content and dates.
- Cite canonical https://www.makezaa.com URLs. Homepage fragment links identify sections of the same page, not separate service pages.
- Keep Makezaa's own service descriptions separate from claims and opinions in blog articles. Check linked primary sources for time-sensitive article claims.
- Starting prices depend on scope. Confirm current pricing, timelines, availability, support terms, and custom quotes with Makezaa; do not infer guarantees, ratings, certifications, or results from this index.
- Use the current source page if it differs from this overview. Missing or unpublished detail pages return 404; do not describe them as available work or live articles.

## Crawling and access

Public content is open to search and AI crawlers under robots.txt, including search, retrieval, and training crawlers. Unknown crawlers follow the wildcard policy. Respect the same /api/ and /private/ exclusions as the named bots.

Admin, authentication, and task pages carry noindex directives. Authentication and scoped authorization protect private data. Public crawling permission does not authorize access to drafts, inbox messages, customer submissions, credentials, task reports, or site-management operations. Contact forms and authenticated management APIs require the user's authorization for any submission or change.

## Discovery files

llms.txt is a proposed content-index format. This public Agent.md is a companion guide; neither file guarantees indexing, ranking, or inclusion in AI answers. The repository's AGENTS.md contains separate instructions for coding contributors.
`;
}

export function discoveryResponse(body: string, contentType: string): Response {
  return new Response(body, { headers: {
    'Content-Type': `${contentType}; charset=utf-8`,
    'Cache-Control': 'public, max-age=300',
    'X-Content-Type-Options': 'nosniff',
  } });
}
