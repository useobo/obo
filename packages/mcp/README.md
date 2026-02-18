# @useobo/mcp-server

MCP (Model Context Protocol) server for OBO. Connects AI agents like Claude to the OBO governance system for scoped API access.

## Installation

```bash
npm install -g @useobo/mcp-server
# or locally
npm install @useobo/mcp-server
```

## MCP Configuration

Add to your Claude MCP config (`~/.claude/mcp.json`):

```json
{
  "obo": {
    "command": "node",
    "args": ["./node_modules/@useobo/mcp-server/dist/index.js"],
    "env": {
      "OBO_API_URL": "http://localhost:3001",
      "OBO_PRINCIPAL": "your-email@example.com"
    }
  }
}
```

For production with OBO Cloud:

```json
{
  "obo": {
    "command": "node",
    "args": ["./node_modules/@useobo/mcp-server/dist/index.js"],
    "env": {
      "OBO_API_URL": "https://api.useobo.com",
      "OBO_PRINCIPAL": "your-email@example.com"
    }
  }
}
```

## Available Tools

### request_slip

Request a new authorization slip for a target service.

```typescript
// Agent requests GitHub repo access
request_slip({
  target: "github",
  scopes: ["repo:read", "repo:write"],
  ttl: 3600
})
```

### complete_oauth_flow

Complete OAuth device flow for GitHub (and other OAuth providers).

```typescript
complete_oauth_flow({
  slipId: "slip_github_abc123",
  code: "device-code-from-user"
})
```

### list_slips

List all active slips for the current principal.

```typescript
list_slips()
```

### revoke_slip

Revoke an active slip by ID.

```typescript
revoke_slip({
  slipId: "slip_github_abc123",
  reason: "No longer needed"
})
```

### check_policy

Check what policies apply for a given request before making it.

```typescript
check_policy({
  target: "github",
  scopes: ["repo:read"]
})
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OBO_API_URL` | Yes | OBO API endpoint URL |
| `OBO_PRINCIPAL` | Yes | Principal email for requests |
| `OBO_ACTOR` | No | Actor name (default: claude-mcp) |

## License

MIT
