# OBO — On Behalf Of

Agentic API governance. Let AI agents act on your behalf — governed, audited, scoped.

## Security

> **IMPORTANT:** OBO stores sensitive credentials (API keys, OAuth tokens). Always configure encryption for production.

### Encryption at Rest

Tokens are encrypted using AES-256-GCM before storage. Configure with:

```bash
export OBO_ENCRYPTION_KEY="$(openssl rand -base64 32)"  # REQUIRED for production
export OBO_ENCRYPT_AT_REST="true"  # default
```

### One-Time Token Delivery

Optionally store only a hash, making tokens non-retrievable after initial delivery:

```bash
export OBO_ONE_TIME_DELIVERY="true"  # default false
```

See [`packages/crypto/README.md`](./packages/crypto/README.md) for full security documentation.

## The Vocabulary

| Term | Meaning |
|------|---------|
| **Principal** | The authority owner (e.g., `kaarch@gmail.com`) |
| **Actor** | The AI agent making requests |
| **Target** | The service being accessed (e.g., GitHub, Supabase) |
| **Slip** | The authorization record — temporary, transferable, revocable |
| **Policy** | The rules governing what Actors can request |
| **Token** | The actual credential presented to the Target |

## The Request Flow

```
Actor requests a Slip from OBO, on behalf of the Principal, against the Target, subject to Policy.
OBO issues a Token.
```

## Project Structure

```
obo/
├── apps/
│   ├── web/          # Next.js dashboard
│   ├── api/          # API server (tRPC/Next.js)
│   └── worker/       # Background jobs
├── packages/
│   ├── core/         # Business logic
│   ├── mcp/          # MCP server for agents
│   ├── db/           # Database schema
│   └── types/        # Shared TypeScript types
├── services/
│   └── proxy/        # Target proxy for rogue-tier requests
├── turbo.json
├── package.json
└── pnpm-workspace.yaml
```

## Quick Start

```bash
# Install
pnpm install

# Dev
pnpm dev

# Build
pnpm build
```

## License

MIT
