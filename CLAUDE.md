# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OBO (On Behalf Of) is an agentic API governance system. AI agents (Actors) request authorization on behalf of users (Principals) to access external services (Targets) through scoped, revocable slips. The system is a TypeScript monorepo using pnpm workspaces and Turborepo.

### Core Vocabulary
- **Principal**: Authority owner (e.g., `kaarch@gmail.com`)
- **Actor**: AI agent making requests
- **Target**: Service being accessed (GitHub, Supabase)
- **Slip**: Authorization record — temporary, transferable, revocable
- **Policy**: Rules governing what Actors can request
- **Token**: Actual credential presented to the Target

### Monorepo Structure
```
obo/
├── apps/
│   ├── api/          # API server (tRPC/Hono on port 3001)
│   └── web/          # Next.js dashboard (port 3000)
├── packages/
│   ├── core/         # Business logic & slip service
│   ├── db/           # Database schema & Drizzle ORM
│   ├── mcp/          # MCP server for AI agent integration
│   ├── policy/       # Policy evaluation engine
│   └── providers/    # Target integrations (GitHub, Supabase)
└── services/proxy/   # Future proxy for rogue-tier requests
```

## Development Commands

### Root Level
```bash
pnpm install          # Install dependencies
pnpm dev              # Start all apps in development
pnpm build            # Build all packages
pnpm lint             # Lint all packages
pnpm typecheck        # Type check all packages
pnpm test             # Run tests (Vitest)
pnpm clean            # Clean build artifacts
```

### Database
```bash
# Start PostgreSQL (required for development)
docker-compose up -d

# From packages/db/
pnpm generate         # Generate Drizzle migrations from schema
pnpm migrate          # Run pending migrations
pnpm push             # Push schema changes directly (dev only)
pnpm studio           # Open Drizzle Studio GUI
```

### MCP Server (`packages/mcp`)
```bash
cd packages/mcp
pnpm build            # Build for distribution
bash test.sh          # Test MCP server directly via stdin/stdout
```

The built MCP server is configured in `~/.claude/mcp.json`:
```json
{"obo": {"command": "node", "args": ["/Users/kyle/Projects/obo/packages/mcp/dist/index.js"]}}
```

### Testing
```bash
# Run tests for a specific package
cd packages/policy && pnpm test
cd packages/core && pnpm test
```

## Architecture Notes

### Database (`packages/db/src/schema/`)
- PostgreSQL 16, managed via `docker-compose.yml`
- Drizzle ORM with schema-driven migrations
- Core entities: `principals`, `actors`, `targets`, `policies`, `slips`, `tokens`, `auditLog`, `byocCredentials`
- Schema exports available via `@obo/db/schema`

### Providers (`packages/providers/`)
- Each provider implements the `Provider` interface from `@obo/core`
- GitHub: OAuth device flow + BYOC (bring your own credential/PAT)
- Supabase: Rogue mode (no credentials needed)
- Providers must be registered with the SlipService

### Policy Engine (`packages/policy/`)
- Uses `minimatch` for glob pattern matching on principals, actors, targets
- Evaluation priority: deny > manual_approve > auto_approve
- Scopes not matching any pattern are denied by default

### Slip Service (`packages/core/src/slip/`)
- In-memory `SlipService` class handles slip lifecycle
- Policy evaluation happens before provider provisioning
- Default policies for GitHub and Supabase are built-in

### API Server (`apps/api/`)
- Hono + tRPC on port 3001
- Auto-initializes default targets, policies, and actors on startup
- Persists slips/tokens to database while using in-memory SlipService for policy evaluation

### MCP Server (`packages/mcp/`)
- Stdio transport, exposes 5 tools: `request_slip`, `complete_oauth_flow`, `list_slips`, `revoke_slip`, `check_policy`
- GitHub BYOC mode: paste a PAT in the `reason` field (formats: `github_pat_*`, `ghp_*`)

### Authentication
- Clerk handles web dashboard authentication (configured in `apps/web/`)
- MCP server accepts any principal email (no auth)
