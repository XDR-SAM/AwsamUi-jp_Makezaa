const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, mocks, globals = {}) {
  const module = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  vm.runInNewContext(source, { module, exports: module.exports, require: name => {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    return require(name);
  }, URL, console, ...globals }, { filename: file });
  return module.exports;
}
test('publishing expires lists, old/new detail slugs, homepage and sitemap immediately', () => {
  const tags = [], paths = [];
  const cache = load('lib/public-content-cache.ts', { 'server-only': {}, 'next/cache': {
    revalidateTag: (...args) => tags.push(args), revalidatePath: (...args) => paths.push(args),
  } });
  for (const kind of ['posts', 'projects']) cache.invalidatePublicContent(kind);
  assert.equal(JSON.stringify(tags), JSON.stringify([
    ['published:posts', { expire: 0 }], ['published:projects', { expire: 0 }],
  ]));
  assert.ok(paths.some(([path, type]) => path === '/blog/[slug]' && type === 'page'));
  assert.ok(paths.some(([path, type]) => path === '/projects/[slug]' && type === 'page'));
  assert.equal(paths.filter(([path]) => path === '/sitemap.xml').length, 2);
  assert.equal(paths.filter(([path]) => path === '/').length, 2);
});

for (const [kind, singular, file] of [['posts', 'Post', 'lib/blog.ts'], ['projects', 'Project', 'lib/projects.ts']]) {
  function fixture(error = null) {
    const filters = [], invalidated = [], configurations = [];
    const rows = [{ id: 'one', slug: 'one', published: true, featured: false }, { id: 'two', slug: 'two', published: true, featured: true }];
    const chain = {
      select: () => chain, order: () => chain, insert: () => chain, update: () => chain, delete: () => chain,
      eq: (field, value) => { filters.push([field, value]); return chain; },
      range: async () => ({ data: error ? null : rows, error }),
      maybeSingle: async () => ({ data: rows[0], error }), single: async () => ({ data: rows[0], error }),
      then: resolve => resolve({ error }),
    };
    const lib = load(file, {
      '@/utils/supabase/public': { createPublicClient: () => ({ from: () => chain }) },
      '@/utils/supabase/admin': { createAdminClient: () => ({ from: () => chain }) },
      react: { cache: fn => fn },
      'next/cache': { unstable_cache: (fn, keys, options) => { configurations.push({ keys, options }); return fn; } },
      './public-content-cache': { PUBLIC_CONTENT_TTL: 300, publicContentTag: k => `published:${k}`, invalidatePublicContent: k => invalidated.push(k) },
    });
    return { lib, filters, invalidated, configurations };
  }
  test(`${kind}: only published anonymous reads are cached, admin reads remain fresh`, async () => {
    const f = fixture();
    await f.lib[`getPublished${kind[0].toUpperCase() + kind.slice(1)}`]();
    await f.lib[`get${singular}BySlug`]('one');
    assert.equal(f.filters.filter(([field, value]) => field === 'published' && value === true).length, 2);
    assert.equal(f.configurations.length, 2);
    for (const { options } of f.configurations) {
      assert.equal(options.revalidate, 300); assert.equal(options.tags[0], `published:${kind}`);
    }
    await f.lib[`getAll${kind[0].toUpperCase() + kind.slice(1)}`]();
    assert.equal(f.configurations.length, 2);
  });
  test(`${kind}: successful create/update/delete invalidate; failures do not cache empty collections`, async () => {
    const f = fixture();
    await f.lib[`create${singular}`]({ title: 'New' });
    await f.lib[`update${singular}`]('one', { published: false });
    await f.lib[`delete${singular}`]('one');
    assert.equal(f.invalidated.join(','), `${kind},${kind},${kind}`);
    const bad = fixture(new Error('database unavailable'));
    await assert.rejects(bad.lib[`getPublished${kind[0].toUpperCase() + kind.slice(1)}`](), /database unavailable/);
    await assert.rejects(bad.lib[`update${singular}`]('one', { published: false }), /database unavailable/);
    assert.equal(bad.invalidated.length, 0);
  });
  test(`${kind}: admin API rejects unauthenticated writes before mutation/invalidation`, async () => {
    let invalidations = 0;
    const route = load(`app/api/admin/${kind}/route.ts`, {
      '@/utils/supabase/require-admin': { assertAdmin: async () => { throw new Error('Unauthorized'); } },
      '@/utils/supabase/admin': { createAdminClient: () => { throw new Error('Must not access database'); } },
      '@/lib/public-content-cache': { invalidatePublicContent: () => invalidations++ },
    });
    assert.equal((await route.POST({})).status, 401);
    assert.equal(invalidations, 0);
  });
  test(`${kind}: admin create, edit, unpublish and delete expire public content only after success`, async () => {
    const invalidated = [];
    let error = null;
    const chain = { insert: () => chain, update: () => chain, delete: () => chain, eq: () => chain, select: () => chain,
      single: async () => ({ data: { slug: 'renamed', published: false }, error }), then: resolve => resolve({ error }) };
    const mocks = {
      '@/utils/supabase/require-admin': { assertAdmin: async () => ({}) },
      '@/utils/supabase/admin': { createAdminClient: () => ({ from: () => chain }) },
      '@/lib/public-content-cache': { invalidatePublicContent: k => invalidated.push(k) },
    };
    const collection = load(`app/api/admin/${kind}/route.ts`, mocks);
    const detail = load(`app/api/admin/${kind}/[id]/route.ts`, mocks);
    const request = { json: async () => ({ slug: 'renamed', published: false }) }, params = { params: Promise.resolve({ id: 'one' }) };
    assert.equal((await collection.POST(request)).status, 201);
    assert.equal((await detail.PUT(request, params)).status, 200);
    assert.equal((await detail.DELETE(request, params)).status, 200);
    assert.equal(invalidated.join(','), `${kind},${kind},${kind}`);
    error = { message: 'failed mutation' };
    assert.equal((await detail.PUT(request, params)).status, 500);
    assert.equal(invalidated.length, 3);
  });
}

test('public routes skip session refresh; admin, API admin and auth routes still enforce it', async () => {
  const checked = [];
  const { middleware } = load('middleware.ts', {
    '@/utils/supabase/middleware': { updateSession: async req => { checked.push(req.nextUrl.pathname); return 'protected'; } },
    'next/server': { NextResponse: { next: () => 'public' } },
  });
  for (const path of ['/', '/projects', '/projects/example', '/blog', '/blog/example', '/contact', '/sitemap.xml', '/robots.txt', '/og/site/home'])
    assert.equal(await middleware({ nextUrl: { pathname: path } }), 'public');
  assert.equal(checked.length, 0);
  for (const path of ['/admin', '/admin/posts', '/api/admin/posts', '/auth/callback', '/todos'])
    assert.equal(await middleware({ nextUrl: { pathname: path } }), 'protected');
  assert.equal(checked.length, 5);
});

test('route commit resolves the view transition even when animation frames are suspended', async () => {
  const refs = [], layout = [], effects = [];
  let refIndex = 0, path = '/', click, update, frames = 0;
  const timers = new Map();
  const document = {
    documentElement: { dataset: {} }, querySelectorAll: () => [],
    addEventListener: (type, fn) => { if (type === 'click') click = fn; }, removeEventListener: () => {},
    startViewTransition: fn => { update = fn(); return { ready: Promise.resolve(), finished: update }; },
  };
  class Element { closest() { return { href: 'https://www.makezaa.com/projects', target: '', hasAttribute: () => false, querySelector: () => null }; } }
  const component = load('components/studio/route-transitions.tsx', {
    react: { useRef: initial => refs[refIndex++] ?? (refs[refIndex - 1] = { current: initial }), useEffect: fn => effects.push(fn), useLayoutEffect: fn => layout.push(fn) },
    'next/navigation': { usePathname: () => path, useRouter: () => ({ push: () => { path = '/projects'; } }) },
  }, { document, Element, location: { href: 'https://www.makezaa.com/', origin: 'https://www.makezaa.com' },
    window: { matchMedia: () => ({ matches: false }), setTimeout: fn => { timers.set(1, fn); return 1; } },
    clearTimeout: id => timers.delete(id), requestAnimationFrame: () => { frames++; },
  });
  component.StudioRouteTransitions({ children: null }); layout.splice(0).forEach(fn => fn()); effects.splice(0).forEach(fn => fn());
  let prevented = false;
  click({ button: 0, target: new Element(), preventDefault: () => { prevented = true; } });
  assert.equal(prevented, true); assert.equal(document.documentElement.dataset.studioNavigation, 'client');
  refIndex = 0; component.StudioRouteTransitions({ children: null }); layout.splice(0).forEach(fn => fn());
  let settled = false; update.then(() => { settled = true; }); await Promise.resolve();
  assert.equal(settled, true); assert.equal(frames, 0); assert.equal(timers.size, 0);
});
