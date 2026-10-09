# Admin access and password recovery

The Makezaa database is `v0-makezaa-agency-website` (`yjiybdonnpeenrggamvl`).
Admin access requires an authenticated Supabase user with `app_metadata.role = "admin"`.
Set roles through the Supabase Auth admin API; user-editable metadata never grants access.

## Deployment configuration

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)
- `MAKEZAA_ADMIN_EMAIL` (optional; defaults to `tdxfarhan@gmail.com`)

In Supabase Authentication > URL Configuration, allow the exact production callback
`https://makezaa.com/admin/auth/callback`. Add the equivalent callback for any other
domain hosting the admin, and `http://localhost:3000/admin/auth/callback` for development.
Set Site URL to the actual production domain; avoid broad production wildcards.

Authentication must have working SMTP. Supabase's default SMTP only sends to authorized
team email addresses; configure custom SMTP for production.
See [Supabase SMTP documentation](https://supabase.com/docs/guides/auth/auth-smtp).
Use the default recovery email template containing `{{ .ConfirmationURL }}`.

## Flow

1. Select **Forgot password?** at `/admin/login` and enter the admin email.
2. The server verifies the account's stored admin role before sending. Other addresses
   receive a generic response and no email.
3. Open the link in the same browser. The PKCE code requires the browser's verifier
   cookie. `/admin/auth/callback` exchanges it and checks the admin role.
4. Enter and confirm a password of 12–128 characters.
5. The server validates the admin, changes the password, and signs out all sessions.
   Sign in with the new password.

Expired, reused, and invalid links return to the recovery form. Never commit passwords,
service keys, recovery links, or agent tokens.

## Account replacement completed 2026-10-09

The two original Auth users were replaced with one confirmed user named `sami`,
email `tdxfarhan@gmail.com`, and role `admin`. Their old sessions were revoked.
The password was set separately through the Auth admin API and is not stored here.
The four blog posts, five projects, two contact submissions, and 18 storage objects
were preserved; database content checksums matched before and after replacement.
The temporary maintenance function was disabled and now returns HTTP 410.
