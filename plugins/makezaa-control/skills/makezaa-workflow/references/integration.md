# Connection and file uploads

MCP endpoint: `https://www.makezaa.com/api/mcp` (Streamable HTTP).

ChatGPT uses OAuth discovery, dynamic public-client registration and PKCE S256. The owner signs in through the website and reviews the requested scopes before connecting. Use the host’s normal connection interface. Do not type the admin password into an agent prompt or store it in configuration.

Independent agents can connect with OAuth or with `Authorization: Bearer <dedicated agent key>` from `/admin/agents`. Store that key in the host’s secret store or an environment variable, never in the plugin package. The owner can revoke a key or OAuth connection immediately from Agent control.

For a generated local image, a host with authenticated HTTP/file-upload capability can send multipart `POST https://www.makezaa.com/api/agent/v1/upload` with Bearer authentication, `file`, `alt`, `provenance`, `idempotency_key`, and optional `source_url`. Maximum 2 MiB; PNG/JPEG/WebP/GIF. The response returns its stable public URL and storage path. Use those in the article. Do not copy large image bytes into the conversation if the host can upload a file directly.

Agents without MCP can use the same operations as authenticated JSON POST requests at `/api/agent/v1/<operation>`. The public OpenAPI definition is `https://www.makezaa.com/api/agent/openapi.json`. An agent’s host must register these tools and supply its own research/image capabilities and scheduler.
