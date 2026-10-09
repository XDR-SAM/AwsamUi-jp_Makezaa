# Makezaa public search and sharing

The canonical production origin is `https://www.makezaa.com`. Public pages render their content and metadata on the server. SEO applies to the homepage, contact page, blog/project collections and published details; it does not expose drafts, the admin dashboard, inbox, credentials or task reports.

## Automatic behavior

- `lib/seo.ts` supplies unique titles, plain-text descriptions, canonical URLs, Open Graph and Twitter metadata. A missing excerpt/description falls back to readable article content. No database migration or manual SEO field is required.
- An existing HTTPS cover image is the first social image; its descriptive title stays in the share metadata. Each published detail also has a generated 1200 × 630 PNG fallback at `/og/blog/<slug>` or `/og/projects/<slug>`. Collection and homepage cards use `/og/site/<name>`. The card uses the current public title/summary, and never fetches a draft or accepts arbitrary image URLs. For Indic scripts such as Bengali, the fallback uses neutral English brand text because the image renderer cannot reliably shape conjuncts; the original title remains intact in page/share metadata and the actual cover remains preferred. Cards cache for five minutes; missing details return 404 and database failures return 503 without caching.
- Blog details use `BlogPosting`, real creation/update dates, a visible Makezaa byline and update date, the actual cover image when present, and breadcrumbs. Projects use `CreativeWork`, without inventing product prices, reviews or project outcomes. The homepage uses consistent `Organization` and `WebSite` identities. JSON-LD escapes CMS text safely.
- `/sitemap.xml` reads published records through anonymous Supabase RLS, including pagination beyond 1,000 rows. It includes only four real static routes plus published blog/project details. Detail `lastmod` comes from the record; static pages have no fabricated timestamp. Database failures fail the request instead of returning a deceptive empty sitemap. Individual detail queries also distinguish a missing record from database failure and deduplicate within a render.
- `/robots.txt` points to one canonical sitemap and permits rendering assets. `OAI-SearchBot` explicitly follows the public crawling policy. `/api/` and `/private/` stay excluded from crawling. Admin/auth/todos remain crawlable so a crawler can read their `noindex`; authenticated guards protect private data.
- Admin pages have robots metadata. Admin, auth, API, discovery and todos responses also carry `X-Robots-Tag: noindex, nofollow, noarchive`. These directives are not an access-control substitute.
- Old `/about`, `/services` and `/book-meeting` routes permanently redirect to their existing homepage sections. Removed or unpublished content continues to return 404 rather than redirecting every missing page to the homepage. CMS body H1 tags render as H2 section headings beneath the page title; stored content is unchanged.

## Publishing with agents

Call `site_info` for publishing guidance. Supply an accurate title, unique stable slug, useful excerpt/description, original helpful content with H2/H3 headings, source links and appropriate image credits/alt text. Verify primary sources and event dates for news. Label generated illustrations where they might be confused with documentary images. Avoid invented authors, ratings, performance claims, keyword stuffing, and bulk summaries with no added value. Relevant internal links help readers discover related work.

The server applies the same metadata and sitemap behavior to both admin and agent publications. The calling host still researches, authors, uploads images and verifies the public result. SEO plumbing cannot establish that article claims are accurate or that Google will index/rank it.

## Online setup and verification

The owner already has a verified `makezaa.com` domain property in Google Search Console and a submitted www sitemap. Its Search generative AI setting was observed as **Include** during the October 9, 2026 audit. Resubmit the canonical sitemap after deployment, request a robots recrawl, and use URL Inspection to test representative live pages and request indexing. Requests and accepted sitemaps are not proof of immediate indexing. Domain-property statistics include other subdomains and must not be attributed entirely to this website.

Run:

```powershell
node --test tests/seo.test.cjs tests/admin-auth.test.cjs tests/agent-control.test.cjs
npx tsc --noEmit
npm run build
npm run start
py -3 scripts/verify-seo.py http://localhost:3000
py -3 scripts/verify-seo.py https://www.makezaa.com
```

The HTTP verifier needs Python `requests` and `beautifulsoup4`. It checks every current sitemap page, canonical/description/robots/social metadata, expected JSON-LD and headings, PNG dimensions, private headers, 404 handling and legacy redirects. Keep bounded before/after crawls under ignored `artifacts/`, separately from the source. No new hosting, scheduler or paid SEO service is required.

## Search and AI limits

Google AI visibility builds on indexing and helpful, reliable content; there is no required special AI schema or `llms.txt` ranking file. OpenAI search crawling uses `OAI-SearchBot`, independently of training controls and user-triggered browsing. Neither permissive crawling nor structured data guarantees rankings, rich results, AI citations or traffic. Inspect real Search Console data over time; do not call an implementation check a ranking improvement.

Primary references: [Google AI optimization](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide), [Google generative AI control](https://support.google.com/webmasters/answer/16908024), [Google noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing), [article structured data](https://developers.google.com/search/docs/appearance/structured-data/article), [OpenAI crawlers](https://developers.openai.com/api/docs/bots), [Next.js sitemap](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap).
