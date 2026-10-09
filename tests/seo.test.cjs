const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, mocks = {}) {
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(source, { module, exports: module.exports, URL, console,
    require: name => Object.hasOwn(mocks, name) ? mocks[name] : require(name) }, { filename: file });
  return module.exports;
}
const seo = load('lib/seo.ts', { './nav-links': { siteEmail: 'hello@makezaa.com' } });
const post = { title: 'A useful article', slug: 'useful-article', excerpt: null,
  content: '<p>A practical &amp; original article.</p>', cover_image: null,
  tags: ['Development'], created_at: '2026-06-07T10:00:00Z', updated_at: '2026-10-09T11:00:00Z' };

test('new posts automatically get canonical, useful description, article dates, and a unique preview', () => {
  const result = seo.postMetadata(post);
  assert.equal(result.alternates.canonical, 'https://www.makezaa.com/blog/useful-article');
  assert.equal(result.description, 'A practical & original article.');
  assert.equal(result.openGraph.type, 'article');
  assert.equal(result.openGraph.modifiedTime, post.updated_at);
  assert.equal(result.openGraph.images[0].url, 'https://www.makezaa.com/og/blog/useful-article');
  assert.equal(result.twitter.card, 'summary_large_image');
  const covered = seo.postMetadata({ ...post, cover_image: 'https://example.com/photo.jpg' });
  assert.equal(covered.openGraph.images[0].url, 'https://example.com/photo.jpg');
  assert.equal(covered.openGraph.images[1].width, 1200);
});

test('metadata stays plain text and JSON-LD cannot break out of the script element', () => {
  const value = '</script><script>alert("bad")</script><p>Useful text &amp; details</p>';
  assert.equal(seo.plainText(value), 'Useful text & details');
  const encoded = seo.serializeJsonLd({ title: value });
  assert.equal(encoded.includes('<'), false);
  assert.equal(JSON.parse(encoded).title, value);
  assert.ok(seo.descriptionText('word '.repeat(100), null, 'fallback').length <= 170);
});

test('article schema preserves truthful dates and images, project schema stays CreativeWork', () => {
  const schema = seo.postSchema({ ...post, cover_image: 'https://example.com/cover.png' });
  const article = schema['@graph'].find(x => x['@type'] === 'BlogPosting');
  assert.equal(article.image, 'https://example.com/cover.png');
  assert.equal(article.datePublished, post.created_at);
  assert.equal(article.author.name, 'Makezaa');
  assert.equal(schema['@graph'].find(x => x['@type'] === 'BreadcrumbList').itemListElement.length, 3);
  const project = seo.projectSchema({ ...post, description: null, tech_stack: ['Next.js'] });
  assert.equal(project['@graph'][1]['@type'], 'CreativeWork');
  const organization = seo.siteSchema()['@graph'][0];
  assert.equal(organization.telephone, undefined);
  assert.equal(organization.openingHoursSpecification, undefined);
  assert.equal(organization.aggregateRating, undefined);
});

test('sitemap reads only published rows beyond the default 1000-row limit', async () => {
  const calls = [];
  const first = Array.from({ length: 1000 }, (_, i) => ({ slug: `post-${i}`, updated_at: post.updated_at }));
  const db = { from: table => ({ select: fields => ({ eq: (field, value) => ({ order: order => ({
    range: async (start, end) => {
      calls.push({ table, fields, field, value, order, start, end });
      return { data: start === 0 ? first : [{ slug: 'post-1000', updated_at: post.updated_at }], error: null };
    },
  }) }) }) }) };
  const mod = load('lib/seo-content.ts', { 'server-only': {}, '@/utils/supabase/public': { createPublicClient: () => db } });
  const rows = await mod.getSitemapContent('posts');
  assert.equal(rows.length, 1001);
  assert.equal(calls.length, 2);
  for (const call of calls) { assert.equal(call.field, 'published'); assert.equal(call.value, true); }
  assert.equal(calls[1].start, 1000);
});

test('database failure cannot masquerade as a complete empty sitemap', async () => {
  const db = { from: () => ({ select: () => ({ eq: () => ({ order: () => ({
    range: async () => ({ data: null, error: { message: 'database unavailable' } }),
  }) }) }) }) };
  const mod = load('lib/seo-content.ts', { 'server-only': {}, '@/utils/supabase/public': { createPublicClient: () => db } });
  await assert.rejects(mod.getSitemapContent('posts'), /database unavailable/);
});

test('crawler policy exposes rendering assets and lets Google read admin noindex', () => {
  const result = load('app/robots.ts', { '@/lib/seo': seo }).default();
  assert.equal(result.sitemap, 'https://www.makezaa.com/sitemap.xml');
  for (const policy of result.rules) {
    assert.equal(policy.disallow.includes('/_next/'), false);
    assert.equal(policy.disallow.includes('/admin/'), false);
    assert.equal(policy.disallow.includes('/api/'), true);
  }
  assert.equal(result.rules.some(rule => rule.userAgent === 'OAI-SearchBot'), true);
  assert.equal(seo.PRIVATE_ROBOTS.index, false);
});
