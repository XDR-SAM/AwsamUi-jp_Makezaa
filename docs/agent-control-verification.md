# Agent control verification

## Local and database checks

- Admin recovery regression suite: 9 tests pass.
- Agent suite: 10 tests pass, including actual MCP SDK client initialization/tool discovery/tool invocation over stateless Web Standard transport, hashed key lookup, expiry/revocation/admin-role rejection, scopes, safe HTML, image MIME/signatures, PKCE known vector, CSRF origin checks and deterministic mutation receipts.
- TypeScript: `npx tsc --noEmit` passes independently of the repository’s existing build setting that skips type validation.
- Next.js production build passes with network access for Google Fonts.
- Real Supabase RPC transaction tests pass: serialized claims, missing/stale lease rejection, retry receipts/conflicts, incomplete batch refusal, draft key editing live content refusal, media retry conflict, wrong PKCE refusal, single-use codes, resource binding and refresh rotation. All fixtures rolled back.
- Before additive migration and rolled-back test: posts 4, projects 5, contact submissions 2. Baseline row-to-JSON checksums: `9e55644d891b373a5757adf0df051fa9`, `3828292dd3eb87e83239a9df8dd72231`, `7b51e6afb856920407a323c184dd6ae6`. Compare with the final live check below.
- After the migration and rolled-back tests, all three checksums match exactly; storage remains 18 objects. No test credentials or jobs remain.
- New server-only tables have RLS enabled and no anon/authenticated grants. RPCs are SECURITY INVOKER with an empty search path and executable only by service_role. Supabase’s “RLS enabled, no policy” information is intentional for these private tables and the existing inbox table; browser access is denied. Existing mutable-search-path and Auth leaked-password-protection warnings predate this integration ([search-path guidance](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable), [password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)).

## Live integration

- PR #3 merged into main (`0ce38f3`); GitHub’s Vercel production status is success. Canonical deployment: `https://www.makezaa.com`.
- A real MCP SDK client connected to production with a temporary scoped read-only key, discovered all 23 tools, and successfully read site info, 4 posts, 5 projects, the task queue and all 18 storage objects. Anonymous MCP POST returns 401 with the correct protected-resource metadata challenge. Both OAuth metadata endpoints and REST/OpenAPI return 200; OpenAPI contains 23 operations.
- Admin sign-in with the user-provided account succeeded in the browser. Agent control renders connection information, selected key permissions, task queue and report area. The actual implementation completion report is saved as job `3fa8efb5-e625-4e26-9340-def9080b1271`.
- The temporary read key is revoked and returns 401 on a later REST read. No verification OAuth code or access token exists. Existing CMS/storage counts remain 4/5/2/18.
- Public-client OAuth registration and the admin consent screen render correctly with an exact callback and requested `site:read` scope. The test’s Deny click did not produce a visibly confirmed callback in the in-app browser. Its pending request was expired. Do not treat this as a completed OAuth authorization.
- Automatic approval review rejected the subsequent attempt to provision a production OAuth exchange fixture because it followed denied test consent and would bypass that consent. That attempt was stopped; live authorization-code exchange remains unverified. Real rollback database tests cover the exchange logic, one-use codes, PKCE, audience and refresh rotation. The owner must complete the plugin’s normal Connect/consent flow; no session or OAuth tokens were extracted from the browser.
- Official Agent Plugins manifest/MCP JSON schema validation passes; the archive contains only one plugin directory, its workflow and referenced icon, with no credentials. The private user-scoped plugin was saved successfully: [Makezaa Control](https://chatgpt.com/plugins/plugins_6ac8cfdf14ac819181157d15b580463c), release `pluginrel_6ac8cfe129bc8191b65a1df62a562eb8`.
- Plugin save is verified; installation/connection in the user’s ChatGPT session and a recurring agent scheduler are user setup steps, not claimed as already active. No editorial posts, generated images, email notifications or recurring publishing schedule were created during this implementation.
