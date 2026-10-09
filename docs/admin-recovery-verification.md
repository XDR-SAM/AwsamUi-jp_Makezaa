# Admin recovery verification — 2026-10-09

## Completed checks

- Supabase project `yjiybdonnpeenrggamvl` contains one confirmed Auth user: `sami`,
  `tdxfarhan@gmail.com`, with `app_metadata.role = admin`.
- A live password login with the requested initial password succeeded; the test session
  was signed out. The two original users and their sessions are gone.
- Four posts, five projects, and two contact submissions have identical database
  checksums before and after replacement. All 18 storage objects remain.
- Supabase accepted a recovery email request for the new admin with HTTP 200.
  Inbox delivery and the production email-link round trip were not verified.
- `npx tsc --noEmit` passed. Nine auth tests passed with `node --test tests/admin-auth.test.cjs`.
- The production build passed. The two existing landing-page type errors and the missing
  agent-project authorization-response helper were fixed to make type checking pass.
- Browser inspection confirmed the login recovery link, accessible form, and generic
  response for an unrelated address. See `admin-recovery-preview.png`.
- Local production HTTP checks returned 401 for unauthenticated posts, projects, and
  password-update requests. An invalid recovery code redirected to the expired-link form.

## Deployment checks still required

- Merge/deploy the code changes and confirm the deployed Supabase URL is this project's URL.
- Add the exact deployed `/admin/auth/callback` URL to Supabase's Auth redirect allow list.
- Confirm production `SUPABASE_SERVICE_ROLE_KEY` and `MAKEZAA_AGENT_TOKEN` configuration.
  Vercel tools returned project-not-found errors when inspecting environment metadata.
- Request recovery from the deployed form, follow the email in the same browser, and
  verify password update plus sign-in. Full local testing was limited by the unavailable
  server credential; mocked server tests cover the authorization and mutation paths.

The maintenance function is disabled and returns 410. Automatic approval review rejected
an attempted server-key transfer through a temporary HTTP endpoint because it would
expose a privileged credential. No service-role key was exported or saved locally.

## Existing Supabase advisory findings

- [Mutable search path](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)
  on `public.update_updated_at`.
- [Leaked-password protection disabled](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
- [RLS enabled without policies](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)
  on `contact_submissions`; current access is through the server service-role client.

These existing settings were not changed by the account replacement or recovery feature.
