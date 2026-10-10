const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, mocks = {}, globals = {}) {
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
      ...globals,
    },
    { filename: file },
  );
  return module.exports;
}
const scopes = load('lib/agents/scope-list.ts');
const security = load('lib/agents/security.ts', { './scope-list': scopes });
const validation = load('lib/agents/validation.ts', { './security': security });
const { isAdmin } = load('utils/supabase/authorization.ts');
const oauth = load('lib/agents/oauth.ts', {
  'server-only': {},
  '@/utils/supabase/admin': { createAdminClient: () => { throw new Error('Unexpected database access'); } },
  './validation': validation,
  './security': security,
});

test('consent forms retain same-origin headers while other private routes suppress referrers', async () => {
  const { updateSession } = load('utils/supabase/middleware.ts', {
    '@supabase/ssr': { createServerClient: () => ({ auth: { getUser: async () => ({}) } }) },
    'next/server': { NextResponse: { next: () => ({ headers: new Headers() }) } },
  });
  const request = (path) => ({ nextUrl: new URL('https://www.makezaa.com' + path), headers: new Headers(), cookies: {} });
  const consent = await updateSession(request('/admin/agents/authorize'));
  assert.equal(consent.headers.get('Referrer-Policy'), 'same-origin');
  assert.equal(consent.headers.get('Cache-Control'), 'private, no-store');
  for (const path of ['/admin/posts', '/api/admin/posts']) {
    const response = await updateSession(request(path));
    assert.equal(response.headers.get('Referrer-Policy'), 'no-referrer');
    assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
  }
  assert.throws(() => security.sameOrigin(new Request('https://www.makezaa.com/api/oauth/authorize', { method: 'POST', headers: { origin: 'null' } })), /Invalid request origin/);
});

test('OAuth callbacks preserve loopback URI, state and issuer identification', () => {
  const url = new URL(oauth.callback(
    { redirect_uri: 'http://127.0.0.1:62899/callback', state: 'client-state' },
    { code: 'test-code' },
  ));
  assert.equal(url.origin, 'http://127.0.0.1:62899');
  assert.equal(url.pathname, '/callback');
  assert.equal(url.searchParams.get('state'), 'client-state');
  assert.equal(url.searchParams.get('iss'), security.siteOrigin());
  assert.equal(url.searchParams.get('code'), 'test-code');
});

test('ChatGPT authorization ignores optional parameters while validating security fields', async () => {
  const params = {
    client_id: 'chatgpt-client',
    redirect_uri: 'https://chatgpt.com/connector_platform_oauth_redirect',
    response_type: 'code',
    code_challenge: security.pkce('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'),
    code_challenge_method: 'S256',
    resource: security.resourceUrl(),
    state: 'chatgpt-state',
    scope: 'site:read posts:read',
    ui_locales: 'en-US',
    extra_client_hint: 'ignored',
    owner_id: 'cannot-inject-owner',
  };
  let lookedUpClient;
  const fixture = load('lib/agents/oauth.ts', {
    'server-only': {},
    '@/utils/supabase/admin': { createAdminClient: () => ({
      from: () => ({ select: () => ({ eq: (_, client) => {
        lookedUpClient = client;
        return { maybeSingle: async () => ({
          data: { redirect_uris: [params.redirect_uri] }, error: null,
        }) };
      } }) }),
    }) },
    './validation': validation,
    './security': security,
  });
  const result = await fixture.validateAuthorization(params);
  assert.equal(lookedUpClient, params.client_id);
  assert.equal(result.params.redirect_uri, params.redirect_uri);
  assert.equal(result.params.state, params.state);
  assert.equal(result.scopes.join(' '), params.scope);
  for (const field of ['ui_locales', 'extra_client_hint', 'owner_id'])
    assert.equal(Object.hasOwn(result.params, field), false);
  await assert.rejects(fixture.validateAuthorization({ ...params, redirect_uri: 'https://attacker.example/callback' }), /Invalid client or redirect URI/);
  await assert.rejects(fixture.validateAuthorization({ ...params, scope: 'unknown:scope' }));
  for (const invalid of [
    { code_challenge_method: 'plain' },
    { code_challenge: 'invalid' },
    { resource: 'https://attacker.example/mcp' },
    { response_type: 'token' },
  ]) assert.equal(oauth.authorizeSchema.safeParse({ ...params, ...invalid }).success, false);
});

test('OAuth consent returns 401 for a missing admin session and keeps origin checks', async () => {
  let adminChecks = 0;
  const route = load('app/api/oauth/authorize/route.ts', {
    'next/server': {},
    'next/headers': { cookies: async () => { throw new Error('Unexpected cookie access'); } },
    '@/utils/supabase/admin': { createAdminClient: () => { throw new Error('Unexpected grant'); } },
    '@/utils/supabase/require-admin': { assertAdmin: async () => { adminChecks++; throw new Error('Unauthorized'); } },
    '@/lib/agents/security': security,
    '@/lib/agents/oauth': oauth,
  });
  const request = (origin) => new Request('https://www.makezaa.com/api/oauth/authorize', {
    method: 'POST', headers: { origin, 'content-type': 'application/x-www-form-urlencoded' },
    body: 'request=invalid&decision=deny',
  });
  const forbidden = await route.POST(request('https://example.com'));
  assert.equal(forbidden.status, 403);
  assert.equal(adminChecks, 0);
  const unauthenticated = await route.POST(request('https://www.makezaa.com'));
  assert.equal(unauthenticated.status, 401);
  assert.match((await unauthenticated.json()).error, /Admin sign-in required/);
  assert.equal(adminChecks, 1);
});
const key = 'mza_abcdefghijklmnopqrstuvwxyz0123456789';
function consentFixture({ nonce = 'test-nonce', pending = true, rpcError = null, lookupError = null, requested = ['posts:read'] } = {}) {
  const calls = [];
  const params = { client_id: 'test-client', redirect_uri: 'http://127.0.0.1:62899/callback', state: 'client-state' };
  const query = {
    select() { return this; }, eq() { return this; }, gt() { return this; },
    async maybeSingle() { return { data: pending ? { params } : null, error: lookupError }; },
  };
  function response(body, init) {
    const result = new Response(body, init);
    result.cookies = { set: (...args) => calls.push({ cookie: args }) };
    return result;
  }
  const route = load('app/api/oauth/authorize/route.ts', {
    'next/server': { NextResponse: {
      json: (body) => response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } }),
      redirect: (url, status) => response(null, { status, headers: { location: url } }),
    } },
    'next/headers': { cookies: async () => ({ get: () => nonce ? { value: nonce } : undefined }) },
    '@/utils/supabase/admin': { createAdminClient: () => ({ from: () => query, rpc: async (name, args) => { calls.push({ name, args }); return { error: rpcError }; } }) },
    '@/utils/supabase/require-admin': { assertAdmin: async () => ({ user: { id: 'owner' } }) },
    '@/lib/agents/security': security,
    '@/lib/agents/oauth': { ...oauth, validateAuthorization: async () => ({ params, scopes: requested }) },
  });
  return { calls, post: (accept = 'application/json', decision = 'allow', scope = 'posts:read') => route.POST(new Request('https://www.makezaa.com/api/oauth/authorize', {
    method: 'POST', headers: { origin: 'https://www.makezaa.com', accept, 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams([
      ['request', '049fbd44-038c-423c-8134-693fb2f8b511'], ['decision', decision],
      ...(Array.isArray(scope) ? scope : [scope]).map(s => ['scope', s]),
    ]),
  })) };
}
test('fetch consent and native forms issue the same validated callback and clear the nonce', async () => {
  for (const accept of ['application/json', 'text/html']) {
    const f = consentFixture();
    const result = await f.post(accept);
    const destination = new URL(accept === 'application/json' ? (await result.json()).redirect_to : result.headers.get('location'));
    assert.equal(result.status, accept === 'application/json' ? 200 : 303);
    assert.equal(destination.origin, 'http://127.0.0.1:62899');
    assert.equal(destination.searchParams.get('state'), 'client-state');
    assert.equal(destination.searchParams.get('iss'), security.siteOrigin());
    assert.match(destination.searchParams.get('code'), /^code_/);
    assert.equal(result.headers.get('cache-control'), 'no-store');
    assert.equal(f.calls[0].args.p_allow, true);
    assert.equal(f.calls[1].cookie[2].maxAge, 0);
  }
});
test('fetch denial returns access_denied without issuing a code', async () => {
  const f = consentFixture();
  const destination = new URL((await (await f.post('application/json', 'deny')).json()).redirect_to);
  assert.equal(destination.searchParams.get('error'), 'access_denied');
  assert.equal(destination.searchParams.has('code'), false);
  assert.equal(f.calls[0].args.p_allow, false);
});
test('native consent preserves every selected checkbox and grants only the requested subset', async () => {
  const selected = ['projects:read', 'projects:write', 'projects:publish'];
  const f = consentFixture({ requested: [...scopes.SCOPES] });
  assert.equal((await f.post('text/html', 'allow', selected)).status, 303);
  assert.equal(f.calls[0].args.p_scopes.join(' '), selected.join(' '));
  const denied = consentFixture({ requested: [...scopes.SCOPES] });
  const result = await denied.post('text/html', 'deny', []);
  assert.equal(result.status, 303);
  assert.equal(denied.calls[0].args.p_allow, false);
  const empty = consentFixture();
  assert.equal((await empty.post('application/json', 'allow', [])).status, 400);
  assert.equal(empty.calls.length, 0);
});
test('consent defaults allow publishing while leaving deletion and private inbox unchecked', () => {
  const defaults = scopes.defaultConsentScopes([...scopes.SCOPES]);
  assert.equal(defaults.length, 12);
  for (const permission of ['posts:read', 'projects:read', 'projects:write', 'projects:publish']) assert(defaults.includes(permission));
  for (const permission of scopes.SCOPES.filter(s => s.endsWith(':delete') || s.startsWith('inbox:'))) assert.equal(defaults.includes(permission), false);
  assert.equal(scopes.defaultConsentScopes(['posts:read']).join(' '), 'posts:read');
  assert.equal(scopes.defaultConsentScopes(['inbox:read']).length, 0);
});
test('fetch consent cannot skip the bound nonce, expiry, requested scopes or atomic consumption', async () => {
  for (const options of [{ nonce: null }, { pending: false }, { rpcError: { message: 'already consumed' } }]) {
    const f = consentFixture(options);
    const result = await f.post();
    assert.equal(result.status, 403);
    assert.equal((await result.json()).redirect_to, undefined);
  }
  const f = consentFixture();
  assert.equal((await f.post('application/json', 'allow', 'posts:publish')).status, 400);
  assert.equal(f.calls.length, 0);
});
test('consent distinguishes missing browser cookies, expired requests and database outages', async () => {
  for (const [options, status, message] of [
    [{ nonce: null }, 403, /Consent cookie missing/],
    [{ pending: false }, 403, /expired or belongs to another browser/],
    [{ lookupError: { message: 'offline' } }, 503, /lookup failed/],
  ]) {
    const f = consentFixture(options);
    const result = await f.post();
    assert.equal(result.status, status);
    assert.match((await result.json()).error, message);
    assert.equal(f.calls.length, 0);
  }
});
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
    './github': {},
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
      runOperation: async (name, principal, input) => {
        if (name.startsWith('project_') || name === 'content_list' || input.check_publishing)
          return f.runOperation(name, principal, input);
        if (name === 'audit_read') throw new security.AgentError('Database unavailable', 500);
        return { operation: name, ok: true };
      },
    },
    './security': security,
  });
  let wireTools;
  const fetch = async (url, init) => {
    const request = new Request(url, init);
    if (request.method === 'GET') return new Response(null, { status: 405 });
    const server = mcp.createMakezaaServer({ id: 'test', scopes: ['site:read', 'posts:read', 'posts:write', 'posts:publish'] }),
      transport = new WebStandardStreamableHTTPServerTransport({
        enableJsonResponse: true,
      });
    await server.connect(transport);
    try {
      const response = await transport.handleRequest(request);
      if (response.headers.get('content-type')?.includes('application/json')) {
        const message = await response.clone().json();
        if (message.result?.tools) wireTools = message.result.tools;
      }
      return response;
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
  assert.deepEqual(Object.keys(mcp.toolScopes).sort(), Object.keys(f.operations).sort());
  for (const tool of tools) {
    assert.deepEqual(wireTools.find(t => t.name === tool.name).securitySchemes, tool._meta.securitySchemes);
    assert.equal(tool._meta.securitySchemes[0].type, 'oauth2');
  }
  assert.deepEqual(tools.find(t => t.name === 'project_save')._meta.securitySchemes[0].scopes, ['projects:write']);
  assert.deepEqual(tools.find(t => t.name === 'content_list')._meta.securitySchemes[0].scopes, ['posts:read', 'projects:read']);
  assert.deepEqual([...new Set(wireTools.flatMap(t => t.securitySchemes[0].scopes))].sort(), [...scopes.SCOPES].sort());
  assert.equal(tools.find(t => t.name === 'github_repository').annotations.openWorldHint, true);
  assert(tools.some((t) => t.name === 'job_finish'));
  assert.equal(
    tools.find((t) => t.name === 'post_delete').annotations.destructiveHint,
    true,
  );
  const result = await client.callTool({ name: 'site_info', arguments: {} });
  assert.equal(result.isError, undefined);
  assert.match(result.content[0].text, /"ok":true/);
  for (const [name, args, scope] of [
    ['site_info', { check_publishing: 'projects' }, 'projects:read projects:write projects:publish'],
    ['content_list', { kind: 'projects' }, 'projects:read'],
    ['project_save', { fields: { title: 'Example', slug: 'example' }, idempotency_key: 'project-test-1' }, 'projects:write'],
    ['project_publish', { id: '049fbd44-038c-423c-8134-693fb2f8b511', published: true, idempotency_key: 'project-test-2' }, 'projects:publish'],
  ]) {
    const denied = await client.callTool({ name, arguments: args });
    assert.equal(denied.isError, true);
    const challenge = denied._meta['mcp/www_authenticate'][0];
    assert.match(challenge, /error="insufficient_scope"/);
    assert.match(challenge, /resource_metadata="https:\/\/www.makezaa.com\/\.well-known\/oauth-protected-resource"/);
    assert(challenge.includes(scope));
    assert(challenge.includes('posts:publish'));
    assert.doesNotMatch(challenge, /:delete|inbox:/);
  }
  assert.equal(f.calls.length, 0);
  const otherError = await client.callTool({ name: 'audit_read', arguments: {} });
  assert.equal(otherError.isError, true);
  assert.equal(otherError._meta, undefined);
  await client.close();
});

test('portfolio draft, publish and live edits enforce separate scopes and preserve URLs', async () => {
  const id = '049fbd44-038c-423c-8134-693fb2f8b511';
  const fields = { title: 'Repository project', slug: 'repository-project', github_url: 'https://github.com/XDR-SAM/example', tech_stack: ['TypeScript'], content: '<h2>How it works</h2><p>Documented features.</p>' };
  const f = operationFixture();
  const writer = { id: 'test', scopes: ['projects:write'] };
  await f.runOperation('project_save', writer, { fields, idempotency_key: 'portfolio-draft-1' });
  assert.equal(f.calls[0].params.p_data.github_url, fields.github_url);
  assert.equal(f.calls[0].params.p_operation, 'project_save');
  await assert.rejects(f.runOperation('project_publish', writer, { id, published: true, idempotency_key: 'portfolio-publish-1' }), e => e instanceof security.AgentScopeError);
  await assert.rejects(operationFixture(true).runOperation('project_save', writer, { id, fields, idempotency_key: 'portfolio-edit-1' }), e => e.status === 403);
  const publisher = { id: 'test', scopes: ['projects:write', 'projects:publish'] };
  const result = await f.runOperation('project_publish', publisher, { id, published: true, idempotency_key: 'portfolio-publish-1' });
  assert.equal(result.public_url, 'https://www.makezaa.com/projects/test');
  await operationFixture(true).runOperation('project_save', publisher, { id, fields, idempotency_key: 'portfolio-edit-1' });
});

test('public GitHub research sorts latest activity, filters forks, and reads bounded README evidence', async () => {
  const calls = [];
  const repo = { name: 'new-project', full_name: 'XDR-SAM/new-project', html_url: 'https://github.com/XDR-SAM/new-project', pushed_at: '2026-10-10T12:00:00Z', private: false, fork: false, archived: false };
  const github = load('lib/agents/github.ts', { 'server-only': {}, './security': security }, {
    fetch: async (url, options) => {
      calls.push({ url, options });
      if (url.includes('/users/')) return Response.json([repo, { ...repo, name: 'fork', fork: true }]);
      if (url.endsWith('/readme')) return Response.json({ encoding: 'base64', content: Buffer.from('x'.repeat(22000)).toString('base64'), path: 'README.md', html_url: repo.html_url + '/blob/main/README.md' });
      if (url.endsWith('/languages')) return Response.json({ TypeScript: 123 });
      return Response.json(repo);
    },
  });
  const list = await github.listGithubRepositories({ owner: 'XDR-SAM', sort: 'pushed', page: 1, limit: 2, include_forks: false, include_archived: false });
  assert.equal(list.items.length, 1);
  assert.equal(list.next_page, 2);
  assert.match(calls[0].url, /sort=pushed&direction=desc/);
  const detail = await github.getGithubRepository({ owner: 'XDR-SAM', repo: 'new-project' });
  assert.equal(detail.readme.text.length, 20000);
  assert.equal(detail.readme.truncated, true);
  assert.equal(detail.languages.TypeScript, 123);
  assert.equal(calls.length, 4);
  for (const call of calls) {
    assert(call.url.startsWith('https://api.github.com/'));
    assert.equal(call.options.headers.Authorization, undefined);
    assert.equal(call.options.redirect, 'error');
    assert(call.options.signal);
  }
});

test('GitHub missing README is allowed; private/missing repos, rate limits and oversized responses are explicit errors', async () => {
  const repo = { name: 'example', private: false };
  const fixture = fetch => load('lib/agents/github.ts', { 'server-only': {}, './security': security }, { fetch });
  const detail = await fixture(async url => url.endsWith('/readme') ? new Response(null, { status: 404 }) : Response.json(url.endsWith('/languages') ? {} : repo)).getGithubRepository({ owner: 'XDR-SAM', repo: 'example' });
  assert.equal(detail.readme, null);
  for (const [response, status] of [
    [new Response(null, { status: 404 }), 404],
    [new Response(null, { status: 403 }), 429],
    [Response.json({ private: true }), 403],
    [new Response('x'.repeat(2 * 1024 * 1024 + 1)), 413],
  ]) await assert.rejects(fixture(async () => response).getGithubRepository({ owner: 'XDR-SAM', repo: 'example' }), e => e.status === status);
});

test('GitHub research rejects paths and needs site read permission before making requests', async () => {
  const f = operationFixture();
  await assert.rejects(f.runOperation('github_repository', { scopes: ['site:read'] }, { owner: 'XDR-SAM', repo: '../secrets' }), /Invalid/);
  await assert.rejects(f.runOperation('github_repositories', { scopes: [] }, {}), e => e.status === 403);
  await assert.rejects(f.runOperation('github_repository', { scopes: [] }, { repo: 'example' }), e => e.status === 403);
  assert.equal(f.calls.length, 0);
});
