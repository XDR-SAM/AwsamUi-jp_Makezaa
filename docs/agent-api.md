# Makezaa AI Agent Access Layer

Purpose
- Let an admin agent read and write blog posts, projects, contact submissions, and images through a stable private API.
- Does not change or expose existing public/admin routes.
- Secrets stay server-side.

## Authentication

Use HTTP header:
- `X-Makezaa-Agent-Token: <token>`

The server validates this against the environment variable:
- `MAKEZAA_AGENT_TOKEN`

If the env var is missing, agent write operations return:
- `401` with body `{"error":"Agent auth not configured","hint":"Set MAKEZAA_AGENT_TOKEN in the server environment"}`

Writes to the agent layer never bypass normal authorization checks within the requests themselves; they still reuse the existing admin privileged helpers (`createAdminClient`) so existing data rules remain enforced.

## Allowed operations

- List all posts
- Get post by id
- Create a post
- Update a post
- Delete a post
- List all projects
- Get project by id
- Create a project
- Update a project
- Delete a project
- List contact submissions
- Delete a contact submission
- Upload an image and return a public URL

## Notes

- Safe to expose `GET` listings behind the agent token.
- Keep `MAKEZAA_AGENT_TOKEN` out of client bundles and public docs.
- Do not reuse the web admin login UI; the agent layer is header-only.
