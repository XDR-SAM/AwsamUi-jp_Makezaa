# Makezaa Control

Private, portable Agent Plugins 1.0 package. Connects the existing Vercel-hosted Makezaa website through Streamable HTTP MCP. It contains no passwords or API keys.

Install in a compatible ChatGPT/Codex plugin host and connect through OAuth. In a different MCP client, configure `https://www.makezaa.com/api/mcp` and use OAuth or a dedicated revocable Bearer key from `https://www.makezaa.com/admin/agents`. Copy the workflow skill into your agent’s supported skill location when its host does not understand this plugin package.

See the repository’s `docs/agent-control.md` for Hermes configuration, REST/OpenAPI access, multipart upload, scheduled-worker setup and operational limits. Other hosts’ native installation formats differ; this package does not claim one-click native installation on every platform.
