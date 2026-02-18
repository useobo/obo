# OBO — On Behalf Of

> Agentic API governance. Let AI agents act on your behalf — governed, audited, scoped.

OBO enables AI agents to request scoped, temporary access to external APIs on behalf of users. Agents request **slips** (authorization tokens) that are governed by **policies** you control. All access is auditable and revocable.

## What Problem Does OBO Solve?

AI coding tools like [Lovable.dev](https://lovable.dev), [Cursor](https://cursor.sh), and [Claude](https://claude.ai) need API access to be useful — creating GitHub repos, querying Supabase, deploying to Vercel. But hardcoding credentials is unsafe, and manual OAuth flows break the AI workflow.

OBO sits between your agents and your APIs, acting as a governance layer:

1. **Agent requests access** via MCP (Model Context Protocol)
2. **Policy engine evaluates** the request against your rules
3. **Slip is issued** — a scoped, time-limited authorization token
4. **Agent uses the slip** to access the target service
5. **All activity is logged** and slips can be revoked instantly

## Packages

| Package | Version | Description |
|---------|---------|-------------|
| [`@useobo/core`](./packages/core) | [![npm](https://img.shields.io/npm/v/@useobo/core)](https://www.npmjs.com/package/@useobo/core) | Core engine — types, slip service, policy evaluation |
| [`@useobo/crypto`](./packages/crypto) | [![npm](https://img.shields.io/npm/v/@useobo/crypto)](https://www.npmjs.com/package/@useobo/crypto) | AES-256-GCM encryption, JWT signing, key rotation |
| [`@useobo/providers`](./packages/providers) | [![npm](https://img.shields.io/npm/v/@useobo/providers)](https://www.npmjs.com/package/@useobo/providers) | Target integrations (GitHub, Supabase, OBO itself) |
| [`@useobo/mcp-server`](./packages/mcp) | [![npm](https://img.shields.io/npm/v/@useobo/mcp-server)](https://www.npmjs.com/package/@useobo/mcp-server) | MCP server for Claude/Cursor/Lovable integration |

## Quick Start

### Self-Hosted

```bash
# Clone the repo
git clone https://github.com/useobo/obo.git
cd obo

# Install dependencies
pnpm install

# Start PostgreSQL (required)
docker-compose up -d postgres

# Run migrations
cd packages/db && pnpm migrate && cd ../..

# Start the API server
cd apps/api && pnpm dev

# In another terminal, start the MCP server
cd packages/mcp && pnpm build && pnpm test
```

### MCP Configuration

Add to `~/.claude/mcp.json`:

```json
{
  "obo": {
    "command": "node",
    "args": ["./packages/mcp/dist/index.js"],
    "env": {
      "OBO_API_URL": "http://localhost:3001",
      "OBO_PRINCIPAL": "your-email@example.com"
    }
  }
}
```

### Docker

```bash
# Build and run all services
docker-compose up -d

# View logs
docker-compose logs -f api
```

## The Vocabulary

| Term | Meaning |
|------|---------|
| **Principal** | The authority owner (e.g., `user@example.com`) |
| **Actor** | The AI agent making requests |
| **Target** | The service being accessed (e.g., GitHub, Supabase) |
| **Slip** | The authorization record — temporary, transferable, revocable |
| **Policy** | The rules governing what Actors can request |
| **Token** | The actual credential presented to the Target |

## The Request Flow

```
┌─────────┐     ┌────────┐     ┌─────────┐     ┌────────┐     ┌─────────┐
│  Agent  │────▶│   MCP   │────▶│   OBO   │────▶│ Policy │────▶│  Slip   │
│(Actor)  │     │ Server │     │   API   │     │ Engine │     │ Issued  │
└─────────┘     └────────┘     └─────────┘     └────────┘     └─────────┘
                                                           │
                                                           ▼
                                                    ┌──────────┐
                                                    │  Target  │
                                                    │ Service  │
                                                    └──────────┘
```

## Security

> **IMPORTANT:** OBO stores sensitive credentials (API keys, OAuth tokens). Always configure encryption for production.

### Encryption at Rest

Tokens are encrypted using AES-256-GCM before storage:

```bash
export OBO_ENCRYPTION_KEY="$(openssl rand -base64 32)"  # REQUIRED for production
export OBO_ENCRYPT_AT_REST="true"  # default
```

### One-Time Token Delivery

Optionally store only a hash, making tokens non-retrievable after initial delivery:

```bash
export OBO_ONE_TIME_DELIVERY="true"  # default false
```

### JWT Key Rotation

Support for multiple signing keys with seamless rotation:

```bash
export OBO_JWT_SECRET_1="$(openssl rand -base64 32)"  # primary
export OBO_JWT_SECRET_2="$(openssl rand -base64 32)"  # secondary
```

See [`docs/SECURITY.md`](./docs/SECURITY.md) for full security documentation.

## Self-Referential Proof

OBO uses OBO to manage OBO. Agents can request slips to create, list, and revoke other slips — proving the protocol works end-to-end:

```
request_slip(target="obo", scopes=["slips:list", "slips:create"])
→ Returns JWT token with scoped permissions
→ Agent can now manage slips on your behalf
```

See [`packages/providers/src/obo/`](./packages/providers/src/obo) for implementation.

## Project Structure

```
obo/
├── apps/
│   ├── web/          # Next.js dashboard (Clerk auth)
│   └── api/          # API server (tRPC/Hono on port 3001)
├── packages/
│   ├── core/         # Business logic & slip service
│   ├── crypto/       # Encryption, JWT, KMS
│   ├── db/           # PostgreSQL schema (Drizzle ORM)
│   ├── policy/       # Policy evaluation engine
│   ├── providers/    # Target integrations
│   └── mcp/          # MCP server for AI agents
├── docs/
│   ├── SECURITY.md
│   └── MCP_INTEGRATION.md
├── docker-compose.yml
└── pnpm-workspace.yaml
```

## Supported Targets

| Target | Status | Notes |
|--------|--------|-------|
| GitHub | ✅ | OAuth device flow + BYOC (PAT) |
| Supabase | ✅ | Rogue mode (no credentials needed) |
| OBO | ✅ | Self-referential proof |
| Vercel | 🚧 | Planned |
| Linear | 🚧 | Planned |
| Notion | 🚧 | Planned |
| Slack | 🚧 | Planned |

## Contributing

Contributions welcome! See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for guidelines.

## License

[MIT](./LICENSE) — © 2026 Kyle Arch
