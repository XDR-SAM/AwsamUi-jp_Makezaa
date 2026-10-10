# Makezaa Control

Makezaa remains a Next.js application on Vercel with Supabase Auth, Postgres and the existing `blog-images` bucket. The new private plugin connects the same application. No Docker, extra hosting, built-in LLM provider, or long-running Vercel process is required.

## Connect

| Client | Connection |
| --- | --- |
| ChatGPT / compatible Codex plugin host | Install the private Makezaa Control plugin, connect, sign in to Makezaa as admin, and approve the requested CMS permissions. |
| Hermes / other remote MCP clients | Streamable HTTP `https://www.makezaa.com/api/mcp`, OAuth or a dedicated Bearer key. |
| Agents using HTTP tools, including custom OpenAI or Grok integrations | Import/adapt `https://www.makezaa.com/api/agent/openapi.json`; authenticated JSON POST `/api/agent/v1/<operation>`. Your host must register/call the tools. |

Installation and OAuth support depend on the host/account’s available features. This plugin does not claim a universal native package format for every bot. The portable workflow skill is in `plugins/makezaa-control/skills/makezaa-workflow/SKILL.md`.

Hermes supports remote MCP, OAuth and runtime environment substitution. Add one of these configurations to its supported `mcp_servers` configuration:

```yaml
mcp_servers:
  makezaa:
    url: "https://www.makezaa.com/api/mcp"
    auth: oauth
```

Or create a dedicated key at `https://www.makezaa.com/admin/agents`, save it as `MAKEZAA_ACCESS_TOKEN` in the agent’s secret environment, and use:

```yaml
mcp_servers:
  makezaa:
    url: "https://www.makezaa.com/api/mcp"
    headers:
      Authorization: "Bearer ${MAKEZAA_ACCESS_TOKEN}"
```

Copy/install the workflow skill using your host’s skill mechanism and enable its web research and image capabilities. Hermes configuration and environment substitution are documented in its [official MCP guide](https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp).

## Available operations

| Area | Tools |
| --- | --- |
| Website | `site_info` |
| Public GitHub research | `github_repositories`, `github_repository` |
| Posts & projects | `content_list`, `content_get`, `post_save`, `post_publish`, `post_delete`, `project_save`, `project_publish`, `project_delete` |
| Private customer inbox | `inbox_list`, `inbox_delete` |
| Images | `media_list`, `media_upload`, `media_import`, `media_delete` |
| Tasks & reports | `job_create`, `job_list`, `job_get`, `job_claim`, `job_progress`, `job_finish`, `job_cancel` |
| Action history | `audit_read` |

These cover the current CMS. Static page layout/source, deployments, DNS, billing and Auth user administration require separate repository/platform tools. The plugin does not expose arbitrary SQL, shell execution or Supabase service-role credentials.

### GitHub and portfolio publishing

Call `site_info` with `check_publishing: "projects"` before a portfolio publishing task, or `"posts"` for blog work. This read-only preflight checks the destination's read/write/publish permissions together and returns one OAuth challenge if they are missing; it never creates content or grants permissions by itself.

ChatGPT tool refresh discovers the union of descriptor scopes. Shared content tools must advertise both `posts:read` and `projects:read`, even though each call enforces its chosen destination. On the Makezaa consent screen, only checked permissions are granted. Requested editor permissions are selected by default; deletion and private inbox permissions remain unchecked unless the owner explicitly chooses them. Native and fetch forms preserve every checked value and the server validates the granted subset against the original request.

Public repository research is built in: `github_repositories` defaults to `XDR-SAM`, sorts by latest push and excludes forks/archived repositories. Select `sort: "created"` for newly created repositories. Paginate explicitly; filtering applies within each page. `github_repository` returns metadata, a bounded README and language statistics from the public GitHub API. It forwards no credentials, executes no code and cannot access private repositories. Private research requires a separate authorized GitHub connection and explicit authorization for any public disclosure.

Blog OAuth permissions do not grant portfolio access. Published portfolio work needs `projects:read`, `projects:write` and `projects:publish`. Add these through supported OAuth consent while preserving existing permissions. Delete and inbox scopes are unnecessary for this workflow. MCP descriptors publish both `securitySchemes` and its `_meta` mirror. Missing permissions return an `insufficient_scope` challenge in `_meta["mcp/www_authenticate"]` with the existing scopes plus the specifically required scope; permissions are still enforced on the server. The current SDK drops top-level descriptor extensions, so the list handler emits those fields explicitly while SDK validation handles calls.

Write an English blog through `post_save`/`post_publish` or a portfolio entry through `project_save`/`project_publish`. Verify features/stack from sources, preserve repository and verified live URLs, check existing entries for duplicates, and verify the public page after publishing. Portfolio jobs do not set `expected_posts`; reports still track their outputs. No existing content or authorization grants are changed by installing this update.

Example task: “আজকের পাঁচটি গুরুত্বপূর্ণ টেক নিউজ নিয়ে সোর্সসহ original পোস্ট তৈরি করে ছবি দিয়ে publish করো। Dashboard ও এই চ্যাটে রিপোর্ট দাও।” The host agent researches current primary sources, produces original articles, obtains permitted/generated images, uploads them, saves drafts, publishes, verifies each public page and stores the structured completion report. Research and image generation are supplied by the calling agent. Images are limited to 2 MiB per upload; resize/compress larger generated files before upload.

## Tasks and scheduling

Task records are durable, while execution runs in ChatGPT/Hermes/your chosen agent. A queued task remains queued until a worker claims it. An individual HTTP function only performs the requested CMS operation; it does not start an autonomous LLM process.

For a schedule, configure the chosen agent’s scheduler to invoke “Process available Makezaa queued tasks using the Makezaa workflow” at the requested time, or create scheduled agent tasks with the concrete editorial instruction. A worker checks `run_at`, claims a task, renews its 10-minute lease through progress calls and resumes expired work after examining its receipts. Claims serialize in Postgres. Old workers cannot write under a reclaimed lease. Configure the host to deliver its completed result in the originating chat where supported. The Dashboard always retains the report; asynchronous delivery to an arbitrary chat requires that host’s scheduling/notification support. No email notification was configured.

Stable idempotency keys prevent duplicate content and conflicting retries. Batch completion with `expected_posts` requires that many distinct **new** posts created against the task to be published. Partial success is reported as failed, retaining the successful URLs and remaining blockers. This is a factual publication check, not an automatic editorial-quality judgment.

## Upload a generated file

An authenticated host can upload the generated local file directly, avoiding large base64 tool arguments. Example POSIX shell:

```sh
curl --fail-with-body https://www.makezaa.com/api/agent/v1/upload \
  -H "Authorization: Bearer $MAKEZAA_ACCESS_TOKEN" \
  -F "file=@cover.png;type=image/png" \
  -F "alt=Illustration of a modern software workspace" \
  -F "provenance=Generated illustration created for Makezaa; not documentary photography" \
  -F "idempotency_key=TASK-UUID-cover-1"
```

`media_import` downloads from exact trusted HTTPS hosts only: `images.unsplash.com`, `images.pexels.com`, the project’s public blog-images storage, or owner-configured `MAKEZAA_IMAGE_HOSTS`. Redirects, URL credentials, alternate ports, oversized files, SVG/HTML and mismatched file signatures are rejected. The agent must establish permitted image usage and retain provenance; an allowed host does not grant copyright permission. `media_delete` refuses images still referenced in content. Reference checks occur before storage deletion; concurrent manual content edits should be coordinated with the deleting agent.

## Deployment configuration

Already required by the CMS:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — server-only, stays in Vercel; never included in the plugin.

New optional variables:

- `MAKEZAA_SITE_URL`: canonical origin, defaults to `https://www.makezaa.com`. Keep issuer/resource URLs exact and stable for OAuth. Local testing can use `http://localhost:3000`.
- `MAKEZAA_MCP_ALLOWED_ORIGINS`: comma-separated additional trusted browser origins. Normal server MCP clients send no Origin. Makezaa and ChatGPT browser origins are included.
- `MAKEZAA_IMAGE_HOSTS`: comma-separated exact additional trusted image hostnames.

The additive migration `20261009105642_agent_control.sql` introduces private agent/OAuth tables and invoker RPCs, with RLS and no browser-role table/function grants. Apply it before deployment. Existing posts, projects, submissions and storage objects are not rewritten. OAuth uses the existing Supabase admin identity, public-client DCR, mandatory PKCE S256, exact redirect matching, bound resource/audience, one-use codes, rotating refresh tokens, 1-hour access tokens and 30-day connection expiry. The issuer is included in authorization responses per [OpenAI’s authentication guidance](https://developers.openai.com/plugins/build/auth). Manual keys default to 30 days and can be granted only selected scopes.

Keys are shown once, stored only as SHA-256 hashes and revocable through Agent control. Every agent request rechecks the owner’s admin role. Revocation prevents subsequent requests and token refresh; already-running requests may finish. Reports and audit records are server-only. The legacy `/api/agent/posts`, `/projects`, `/submissions` and `/upload` APIs continue using their separately configured shared `MAKEZAA_AGENT_TOKEN` for compatibility; the new plugin uses scoped keys/OAuth only. Rotate or remove the legacy environment token when its clients migrate.

For operational retention, review old task/audit/idempotency/media records as content grows. Do not remove idempotency receipts while clients may still retry those keys. OAuth requests/codes expire and are cleaned on new authorization requests; disconnected/expired grant records can be pruned by an owner-approved maintenance job. No recurring maintenance or editorial schedule is enabled merely by installing the plugin.

## Validation

Run `npm run test:auth`, `npm run test:agents`, `npx tsc --noEmit` and `npm run build`. `tests/agent-database.sql` tests the real RPCs in a transaction that rolls back every fixture, including temporary posts, credentials, OAuth grants and media metadata. See `docs/agent-control-verification.md` for deployment evidence and limits.
