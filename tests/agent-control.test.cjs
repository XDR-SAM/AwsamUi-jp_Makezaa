const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, mocks = {}) {
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(
    source,
    {
      exports: module.exports,
      module,
      require: (n) => (Object.hasOwn(mocks, n) ? mocks[n] : require(n)),
      process,
      console,
      URL,
      URLSearchParams,
      Buffer,
      Request,
      Response,
      AbortController,
      setTimeout,
      clearTimeout,
      Intl,
    },
    { filename: file },
  );
  return module.exports;
}
const scopes = load('lib/agents/scope-list.ts');
const security = load('lib/agents/security.ts', { './scope-list': scopes });
const validation = load('lib/agents/validation.ts', { './security': security });
const { isAdmin } = load('utils/supabase/authorization.ts');
const key = 'mza_abcdefghijklmnopqrstuvwxyz0123456789';
const admin = { id: 'admin', app_metadata: { role: 'admin' } };
function authFixture(credential, owner = admin, dbError = null) {
  const calls = [];
  const db = {
    from: (table) => ({
      select: () => ({
        eq: (field, value) => ({
          maybeSingle: async () => {
            calls.push({ table, field, value });
            return { data: credential, error: dbError };
          },
        }),
      }),
    }),
    auth: {
      admin: {
        getUserById: async () => ({ data: { user: owner }, error: null }),
      },
    },
  };
  return {
    calls,
    ...load('lib/agents/auth.ts', {
      'server-only': {},
      '@/utils/supabase/admin': { createAdminClient: () => db },
      '@/utils/supabase/authorization': { isAdmin },
      './security': security,
    }),
  };
}
const active = {
  id: 'key-id',
  owner_id: 'admin',
  name: 'Hermes',
  scopes: ['posts:read'],
  expires_at: '2099-01-01T00:00:00Z',
  revoked_at: null,
};
test('agent keys are hashed before lookup and grant exactly database scopes', async () => {
  const a = authFixture(active),
    p = await a.authenticateAgent(
      new Request('https://www.makezaa.com/api/mcp', {
        headers: { Authorization: `Bearer ${key}` },
      }),
    );
  assert.equal(a.calls[0].value, security.hash(key));
  assert.equal(p.scopes[0], 'posts:read');
  assert.throws(() => a.need(p, 'posts:publish'), /Required permission/);
});
test('missing, expired, revoked keys and deleted/demoted owners fail closed', async () => {
  const request = () =>
    new Request('https://www.makezaa.com/api/mcp', {
      headers: { Authorization: `Bearer ${key}` },
    });
  await assert.rejects(
    authFixture(active).authenticateAgent(
      new Request('https://www.makezaa.com/api/mcp'),
    ),
    (e) => e.status === 401,
  );
  for (const [credential, owner] of [
    [null, admin],
    [{ ...active, revoked_at: '2026-01-01' }, admin],
    [{ ...active, expires_at: '2000-01-01' }, admin],
    [{ ...active, owner_id: null }, admin],
    [active, null],
    [active, { app_metadata: {}, user_metadata: { role: 'admin' } }],
  ])
    await assert.rejects(
      authFixture(credential, owner).authenticateAgent(request()),
      (e) => e.status === 401,
    );
});
test('credential database failure does not silently grant access', async () => {
  await assert.rejects(
    authFixture(active, admin, { message: 'offline' }).authenticateAgent(
      new Request('https://www.makezaa.com/api/mcp', {
        headers: { Authorization: `Bearer ${key}` },
      }),
    ),
    /lookup failed/,
  );
});
test('content strips executable HTML and unsafe image/link schemes', () => {
  const p = validation.parse(validation.postFields, {
    content:
      '<h2>Hello</h2><script>alert(1)</script><p onclick="evil()">News <a href="javascript:evil()">link</a></p><img src="data:text/html,evil" onerror="evil()" />',
  });
  assert.match(p.content, /<h2>Hello<\/h2>/);
  assert.doesNotMatch(p.content, /script|onclick|onerror|javascript:|data:/);
  assert.throws(
    () => validation.parse(validation.postFields, { id: 'forbidden' }),
    /Unrecognized key/,
  );
  assert.throws(
    () => validation.parse(validation.postFields, { slug: '../../admin' }),
    /Invalid/,
  );
});
test('image validation rejects disguised SVG/HTML, wrong MIME and oversized data', () => {
  assert.throws(
    () =>
      validation.validateImage(
        Buffer.from('<svg onload="evil()"></svg>'),
        'image/png',
      ),
    /matching file/,
  );
  const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0]);
  assert.equal(validation.validateImage(png, 'image/png'), 'png');
  assert.throws(() => validation.validateImage(png, 'image/jpeg'), /matching/);
  assert.throws(
    () => validation.validateImage(Buffer.alloc(2097153), 'image/png'),
    /2 MiB/,
  );
});
test('OAuth S256 and safe comparisons follow the published PKCE test vector', () => {
  assert.equal(
    security.pkce('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'),
    'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
  );
  assert.equal(security.safeEqual('secret', 'secret'), true);
  assert.equal(security.safeEqual('secret', 'different length'), false);
  assert.equal(security.safeEqual('', ''), false);
});
test('cross-origin admin mutation requests are rejected', () => {
  assert.throws(
    () =>
      security.sameOrigin(
        new Request('https://www.makezaa.com/api/admin/agents', {
          headers: { Origin: 'https://attacker.example' },
        }),
      ),
    (e) => e.status === 403,
  );
  assert.doesNotThrow(() =>
    security.sameOrigin(
      new Request('https://www.makezaa.com/api/admin/agents', {
        headers: { Origin: 'https://www.makezaa.com' },
      }),
    ),
  );
});
function operationFixture(published = false) {
  const calls = [];
  const db = {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: { published }, error: null }),
        }),
      }),
    }),
    rpc: async (name, params) => {
      calls.push({ name, params });
      return {
        data: { id: '123', slug: 'test', published: !!params.p_data.published },
        error: null,
      };
    },
  };
  const auth = authFixture(active);
  const ops = load('lib/agents/operations.ts', {
    'server-only': {},
    zod: require('zod'),
    '@/utils/supabase/admin': { createAdminClient: () => db },
    './auth': auth,
    './security': security,
    './validation': validation,
    'next/cache': { revalidatePath: () => {} },
  });
  return { calls, ...ops };
}
test('draft-only key cannot publish directly or edit an already published article', async () => {
  const p = { id: 'key-id', scopes: ['posts:write'] },
    a = {
      id: '049fbd44-038c-423c-8134-693fb2f8b511',
      fields: { title: 'Changed' },
      idempotency_key: 'test-save-1',
    };
  await assert.rejects(
    operationFixture(true).runOperation('post_save', p, a),
    (e) => e.status === 403,
  );
  await assert.rejects(
    operationFixture().runOperation('post_save', p, {
      ...a,
      id: undefined,
      fields: {
        title: 'News',
        slug: 'news',
        content: '<p>News</p>',
        published: true,
      },
    }),
    (e) => e.status === 403,
  );
  await assert.rejects(
    operationFixture().runOperation('post_publish', p, {
      id: a.id,
      published: true,
      idempotency_key: 'test-pub-1',
    }),
    (e) => e.status === 403,
  );
});
test('content writes use a deterministic receipt and require a lease for associated jobs', async () => {
  const f = operationFixture(),
    p = { id: 'key-id', scopes: ['posts:write'] },
    a = {
      fields: { title: 'News', slug: 'news', content: '<p>News</p>' },
      idempotency_key: 'test-draft-1',
    };
  await f.runOperation('post_save', p, a);
  await f.runOperation('post_save', p, a);
  assert.equal(f.calls[0].params.p_hash, f.calls[1].params.p_hash);
  assert.equal(f.calls[0].params.p_key, a.idempotency_key);
  await assert.rejects(
    f.runOperation('post_save', p, {
      ...a,
      job_id: '049fbd44-038c-423c-8134-693fb2f8b511',
    }),
    /lease_token/,
  );
});
test('real SDK client initializes stateless HTTP, lists schemas, and calls a tool', async () => {
  const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
  const { StreamableHTTPClientTransport } =
    await import('@modelcontextprotocol/sdk/client/streamableHttp.js');
  const { WebStandardStreamableHTTPServerTransport } =
    await import('@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js');
  const f = operationFixture();
  const mcp = load('lib/agents/mcp.ts', {
    './auth': {},
    './operations': {
      operations: f.operations,
      runOperation: async (name) => ({ operation: name, ok: true }),
    },
    './security': security,
  });
  const fetch = async (url, init) => {
    const request = new Request(url, init);
    if (request.method === 'GET') return new Response(null, { status: 405 });
    const server = mcp.createMakezaaServer({ id: 'test', scopes: [] }),
      transport = new WebStandardStreamableHTTPServerTransport({
        enableJsonResponse: true,
      });
    await server.connect(transport);
    try {
      return await transport.handleRequest(request);
    } finally {
      await server.close();
    }
  };
  const client = new Client({ name: 'makezaa-verification', version: '1.0.0' });
  await client.connect(
    new StreamableHTTPClientTransport(
      new URL('https://www.makezaa.com/api/mcp'),
      { fetch },
    ),
  );
  const { tools } = await client.listTools();
  assert.equal(tools.length, Object.keys(f.operations).length);
  assert(tools.some((t) => t.name === 'job_finish'));
  assert.equal(
    tools.find((t) => t.name === 'post_delete').annotations.destructiveHint,
    true,
  );
  const result = await client.callTool({ name: 'site_info', arguments: {} });
  assert.equal(result.isError, undefined);
  assert.match(result.content[0].text, /"ok":true/);
  await client.close();
});
