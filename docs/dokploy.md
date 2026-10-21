# Dokploy deployment

Deploy `XDR-SAM/AwsamUi-jp_Makezaa`, branch `main`, build path `/`.
The migration was initially verified on `codex/dokploy-deployment` (PR #15).
Dokploy automatically deploys subsequent pushes to the configured source branch.
Select Dockerfile with path `Dockerfile`, context `.`, and target `runner`.
The standalone Next.js server listens on `0.0.0.0:3000` as a non-root user.
Route domains to container port `3000`; `/api/health` is the health endpoint.

## Environment

Set these public values both as environment variables and Docker build arguments:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Next.js embeds public values during the build, so changing them requires rebuilding.

Set these only as runtime environment variables:

- `SUPABASE_SERVICE_ROLE_KEY` (existing production value)
- `MAKEZAA_AGENT_TOKEN` (existing production value, if configured)
- `MAKEZAA_SITE_URL=https://www.makezaa.com`
- `MAKEZAA_ADMIN_EMAIL` (optional)
- `MAKEZAA_MCP_ALLOWED_ORIGINS` (optional)
- `MAKEZAA_IMAGE_HOSTS` (optional)

Keep secrets out of build arguments, source control, and Docker build context.
The Docker ignore file excludes local environment files.
Supabase database, authentication and storage remain in the existing project.
Keep its production auth callback URLs for both served domains.

## Local Docker verification

```sh
docker build --build-arg NEXT_PUBLIC_SUPABASE_URL --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY -t makezaa .
docker run --rm --env-file .env.production.local -p 3000:3000 makezaa
```

Export the two public values in the shell before building. Provide server secrets
through the ignored runtime env file. Check `/`, `/blog`, `/projects`,
`/admin/login`, `/api/health`, and an existing article/project before DNS cutover.
