const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { NextRequest } = require('next/server');

function load(file, mocks = {}) {
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(source, {
    exports: module.exports, module,
    require: name => Object.hasOwn(mocks, name) ? mocks[name] : require(name),
    process, console, URL,
  }, { filename: file });
  return module.exports;
}

const { isAdmin } = load('utils/supabase/authorization.ts');
const admin = { id: 'admin', email: 'tdxfarhan@gmail.com', app_metadata: { role: 'admin' } };

test('only trusted app metadata grants admin access', () => {
  assert.equal(isAdmin(null), false);
  assert.equal(isAdmin({ app_metadata: {}, user_metadata: { role: 'admin' } }), false);
  assert.equal(isAdmin({ app_metadata: { role: 'editor' } }), false);
  assert.equal(isAdmin(admin), true);
});

test('server authorization rejects missing, deleted, or ordinary users', async () => {
  for (const result of [
    { data: { user: null }, error: null },
    { data: { user: admin }, error: new Error('User deleted') },
    { data: { user: { app_metadata: {}, user_metadata: { role: 'admin' } } }, error: null },
  ]) {
    const route = load('utils/supabase/require-admin.ts', {
      'server-only': {}, 'next/headers': { cookies: async () => ({}) },
      './server': { createClient: () => ({ auth: { getUser: async () => result } }) },
      './authorization': { isAdmin },
    });
    await assert.rejects(route.assertAdmin(), /Unauthorized/);
  }
});

function recovery(users, resetError = null) {
  const sent = [];
  const route = load('app/api/admin/forgot-password/route.ts', {
    'next/headers': { cookies: async () => ({}) },
    '@/utils/supabase/admin': { createAdminClient: () => ({ auth: { admin: {
      listUsers: async () => ({ data: { users }, error: null }),
    } } }) },
    '@/utils/supabase/server': { createClient: () => ({ auth: {
      resetPasswordForEmail: async (...args) => { sent.push(args); return { error: resetError }; },
    } }) },
    '@/utils/supabase/authorization': { isAdmin },
  });
  return { route, sent };
}

function request(path, body) {
  return new NextRequest(`https://makezaa.com${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
}

test('recovery only sends for the configured admin and uses the fixed callback', async () => {
  const { route, sent } = recovery([admin]);
  const response = await route.POST(request('/api/admin/forgot-password', { email: ' TDXFARHAN@gmail.com ' }));
  assert.equal(response.status, 200);
  assert.equal(sent.length, 1);
  assert.equal(sent[0][0], admin.email);
  assert.equal(sent[0][1].redirectTo, 'https://makezaa.com/admin/auth/callback');
});

test('unknown emails and non-admin accounts cannot trigger email recovery', async () => {
  for (const [users, email] of [
    [[admin], 'someone@example.com'],
    [[{ email: admin.email, app_metadata: {}, user_metadata: { role: 'admin' } }], admin.email],
    [[], admin.email],
  ]) {
    const { route, sent } = recovery(users);
    const response = await route.POST(request('/api/admin/forgot-password', { email }));
    assert.equal(response.status, 200);
    assert.match((await response.json()).message, /If this email belongs/);
    assert.equal(sent.length, 0);
  }
});

test('email delivery failures are reported instead of claiming success', async () => {
  const { route } = recovery([admin], { message: 'Rate limited', status: 429 });
  assert.equal((await route.POST(request('/api/admin/forgot-password', { email: admin.email }))).status, 429);
});

test('password mutation rejects unauthorized requests before touching credentials', async () => {
  const route = load('app/api/admin/reset-password/route.ts', {
    '@/utils/supabase/require-admin': { assertAdmin: async () => { throw new Error('Unauthorized'); } },
  });
  assert.equal((await route.POST(request('/api/admin/reset-password', { password: 'long-enough-password' }))).status, 401);
});

test('password mutation validates length, then updates and globally signs out', async () => {
  const calls = [];
  const route = load('app/api/admin/reset-password/route.ts', {
    '@/utils/supabase/require-admin': { assertAdmin: async () => ({ supabase: { auth: {
      updateUser: async body => { calls.push(['update', body.password]); return { error: null }; },
      signOut: async options => { calls.push(['signout', options.scope]); return { error: null }; },
    } } }) },
  });
  assert.equal((await route.POST(request('/api/admin/reset-password', { password: 'short' }))).status, 400);
  assert.equal(calls.length, 0);
  assert.equal((await route.POST(request('/api/admin/reset-password', { password: 'long-enough-password' }))).status, 200);
  assert.deepEqual(calls, [['update', 'long-enough-password'], ['signout', 'global']]);
});

test('callback rejects expired links and non-admin sessions; never follows an external next URL', async () => {
  for (const [error, user, expected] of [
    [new Error('Expired'), admin, '/admin/forgot-password?error=invalid-link'],
    [null, { app_metadata: {} }, '/admin/forgot-password?error=invalid-link'],
    [null, admin, '/admin/reset-password'],
  ]) {
    const route = load('app/admin/auth/callback/route.ts', {
      'next/headers': { cookies: async () => ({}) },
      '@/utils/supabase/server': { createClient: () => ({ auth: {
        exchangeCodeForSession: async () => ({ error }),
        getUser: async () => ({ data: { user } }),
        signOut: async () => ({ error: null }),
      } }) },
      '@/utils/supabase/authorization': { isAdmin },
    });
    const response = await route.GET(new NextRequest('https://makezaa.com/admin/auth/callback?code=test&next=https://attacker.example'));
    assert.equal(response.headers.get('location'), `https://makezaa.com${expected}`);
  }
});

test('agent projects rejects unauthenticated requests with a response, not a ReferenceError', async () => {
  const route = load('app/api/agent/projects/route.ts');
  const response = await route.GET(new NextRequest('https://makezaa.com/api/agent/projects'));
  assert.ok([401, 500].includes(response.status));
  assert.equal(typeof (await response.json()).error, 'string');
});
