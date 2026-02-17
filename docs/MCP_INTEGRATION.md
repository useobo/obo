# OBO MCP Server Integration

This guide explains how to integrate OBO with AI coding tools via the Model Context Protocol (MCP).

## What is MCP?

The Model Context Protocol lets AI tools (like Claude Code, Cursor, Windsurf) securely request scoped access to external services. OBO implements an MCP server that provides:

- **`request_slip`** - Request permission to access a service
- **`complete_oauth_flow`** - Complete GitHub OAuth device flow
- **`list_slips`** - List your active slips
- **`revoke_slip`** - Revoke a slip
- **`check_policy`** - Check if a request would be approved

## Installation

### 1. Add OBO MCP Server to Claude Desktop

Edit `~/.claude/mcp.json`:

```json
{
  "obo": {
    "command": "node",
    "args": ["/Users/kyle/Projects/obo/packages/mcp/dist/index.js"],
    "env": {
      "OBO_API_URL": "http://localhost:3001"
    }
  }
}
```

### 2. Start the OBO API Server

```bash
cd /Users/kyle/Projects/obo/apps/api
pnpm dev
```

The API will start on `http://localhost:3001`.

### 3. Restart Claude Desktop

Quit and relaunch Claude Desktop to load the MCP server.

## Usage Examples

### Request GitHub Access

Ask Claude:

> "I need to read my GitHub repositories. Can you request access via OBO?"

Claude will use the `request_slip` tool:

```json
{
  "target": "github",
  "principal": "you@example.com",
  "requested_scope": ["repos:read"],
  "ttl": 3600
}
```

You'll receive a slip ID and authorization instructions.

### Complete GitHub OAuth

If using GitHub OAuth device flow:

> "Complete the OAuth flow for slip slip_obo_123456"

Claude will poll the completion endpoint and return your access token.

### List Active Slips

> "Show me all my active OBO slips"

Claude will use `list_slips` to show your active authorizations.

### Revoke Access

> "Revoke my GitHub access"

Claude will use `revoke_slip` to immediately invalidate the token.

## Configuration

### Local Development

```json
{
  "obo": {
    "command": "node",
    "args": ["/path/to/obo/packages/mcp/dist/index.js"],
    "env": {
      "OBO_API_URL": "http://localhost:3001"
    }
  }
}
```

### Production (Self-Hosted)

```json
{
  "obo": {
    "command": "node",
    "args": ["/path/to/obo/packages/mcp/dist/index.js"],
    "env": {
      "OBO_API_URL": "https://obo.yourdomain.com",
      "OBO_API_KEY": "your-api-key"
    }
  }
}
```

### Production (Managed OBO Cloud)

```json
{
  "obo": {
    "command": "node",
    "args": ["/path/to/obo/packages/mcp/dist/index.js"],
    "env": {
      "OBO_API_URL": "https://api.obo.dev"
    }
  }
}
```

## Supported Targets

| Target | Scopes | Notes |
|--------|--------|-------|
| `github` | `repos:read`, `repos:write`, `user:read`, `user:email` | OAuth or BYOC |
| `supabase` | `projects:read`, `database:read`, `functions:read` | BYOC only |
| `obo` | `slips:list`, `slips:create`, `slips:revoke`, `policies:read` | Self-referential |

## Bring Your Own Credential (BYOC)

For providers that support it, you can provide your own credential:

> "Request GitHub access using my personal access token ghp_..."

Pass the token in the `reason` field.

## Security

- **Principal Required:** All requests require a principal (email) for audit
- **Policy Evaluation:** Requests are checked against policies before issuance
- **Time-Bounded:** All slips have a TTL (default 1 hour, max 24 hours)
- **Revocable:** Any slip can be revoked immediately
- **Encrypted at Rest:** Tokens are encrypted before storage

## Troubleshooting

### MCP Server Not Starting

Check the MCP server is built:

```bash
cd /Users/kyle/Projects/obo/packages/mcp
pnpm build
```

### Connection Refused

Ensure the OBO API is running:

```bash
curl http://localhost:3001/health
```

### "Unknown Target" Error

The target may not be registered. Check the providers:

```bash
curl http://localhost:3001/trpc/provider.list
```

### "Request Denied" Error

Your request doesn't match any policy. Check with `/trpc/policy.check`:

```bash
curl -X POST http://localhost:3001/trpc/policy.check \
  -H "Content-Type: application/json" \
  -d '{
    "target": "github",
    "principal": "you@example.com",
    "requested_scope": ["repos:write"]
  }'
```

## For AI Tool Developers

Integrating OBO into your AI tool provides:

1. **Liability Reduction:** You never touch user credentials
2. **Unified Auth:** Single integration for multiple providers
3. **Audit Trail:** All access requests are logged
4. **User Control:** Users can revoke access anytime
5. **Policy Engine:** Enforce organizational rules

Contact us for integration support or see the GitHub repo.

## See Also

- [Security Guide](./SECURITY.md)
- [Provider Development](../packages/providers/README.md)
- [API Documentation](../apps/api/README.md)
