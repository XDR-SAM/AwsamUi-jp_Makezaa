# Makezaa agent posting API

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
- `500` with body `{"error":"not configured","hint":"Set MAKEZAA_AGENT_TOKEN in the server environment"}`

The routes use the Supabase service-role client and **bypass database RLS**. The token
grants publishing, updating, deleting, image uploads, and access to private contact
submissions. Only trusted agents should receive it. Keep the service-role key and admin
password out of agents; use this dedicated token instead. Missing token configuration
currently returns HTTP 500, while a wrong or missing request token returns HTTP 401.

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

## Endpoints

| Endpoint | Method | Operation |
| --- | --- | --- |
| `/api/agent/posts` | GET | List all posts, including drafts; `?id=UUID` gets one |
| `/api/agent/posts` | POST | Create a post; defaults to a draft |
| `/api/agent/posts` | PUT | Update a post; JSON must include `id` |
| `/api/agent/posts?id=UUID` | DELETE | Delete a post |
| `/api/agent/projects` | GET / POST / PUT / DELETE | Equivalent operations for projects |
| `/api/agent/submissions` | GET | List submissions; filter `?type=contact` or `?type=meeting`, or fetch `?id=UUID` |
| `/api/agent/submissions?id=UUID` | DELETE | Delete a submission |
| `/api/agent/upload` | POST | Multipart field `file`; returns `{ "url": "..." }` |

## Agent draft workflow

Generate a long random `MAKEZAA_AGENT_TOKEN` and store it in the deployment environment
and the agent's secret store. Rotate it if exposed. Never use a `NEXT_PUBLIC_` variable.
Set `MAKEZAA_SITE_URL` to the deployed website's origin. A Node.js agent can create a draft:

```js
const response = await fetch(`${process.env.MAKEZAA_SITE_URL}/api/agent/posts`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Makezaa-Agent-Token': process.env.MAKEZAA_AGENT_TOKEN,
  },
  body: JSON.stringify({
    title: 'How Makezaa builds websites',
    slug: 'how-makezaa-builds-websites',
    excerpt: 'A look at our design and development process.',
    content: '<h2>Our process</h2><p>Your reviewed article goes here.</p>',
    tags: ['Agency', 'Development'],
    published: false,
  }),
});
if (!response.ok) throw new Error(`Posting failed: ${response.status}`);
const draft = await response.json();
```

Post fields `title`, `slug`, and `content` are required; the slug must be unique.
Optional fields are `excerpt`, `cover_image` (URL), `tags` (string array), and `published`.
Use sanitized HTML compatible with the rich-text editor. Upload a cover image first and
use the returned URL in `cover_image`.

After receiving authorization to publish, send `PUT /api/agent/posts` with:

```json
{ "id": "THE_DRAFT_UUID", "published": true }
```

Read it back with `GET /api/agent/posts?id=UUID` and check the public `/blog/SLUG` page.
Projects require `title` and `slug`; optional fields include `description`, `content`,
`cover_image`, `tech_stack`, `live_url`, `github_url`, `featured`, and `published`.

The API has one shared token without per-agent scopes, an audit log, or an approval queue.
Draft-first publishing is a recommended agent workflow, not an enforced API rule.
For multiple agents, add separate revocable tokens with `posts:draft` / `posts:publish`
scopes, an audit log, and owner approval for publication.

## Verification limits

Repository inspection confirmed the routes; the broken authorization-response helper
in the projects route has been repaired. Production token configuration could not be
inspected because Vercel returned project-not-found errors. Verify the deployed token and
service-role environment variables before enabling an agent. No content was posted
during the account-recovery task.
