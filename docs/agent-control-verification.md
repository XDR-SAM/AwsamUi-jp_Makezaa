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

Live production MCP discovery, OAuth consent, Dashboard and plugin save are checked after deployment. This document will be updated with the actual results; a package/source check alone does not prove a user has connected its plugin or configured a scheduler.
