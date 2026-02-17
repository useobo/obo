# OBO Testing Guide

## Quick Test (MCP Server Direct)

```bash
cd /Users/kyle/Projects/obo/packages/mcp
pnpm build
./test.sh
```

This sends JSON-RPC requests directly to the MCP server via stdin/stdout.

---

## Configure with Claude Code

Create or edit `~/.claude/mcp.json`:

```json
{
  "mcpServers": {
    "obo": {
      "command": "node",
      "args": ["/Users/kyle/Projects/obo/packages/mcp/dist/index.js"],
      "disabled": false
    }
  }
}
```

Then restart Claude Code. The OBO tools will be available to all sessions.

---

## Test in Claude Code

Once configured, ask Claude:

> "Use OBO to check if I can get GitHub repo read access for kaarch@gmail.com"

> "Request a slip for Supabase projects:read on behalf of kaarch@gmail.com"

> "List all active slips for kaarch@gmail.com"

---

## Testing Policy Evaluation

```bash
cd /Users/kyle/Projects/obo/packages/policy
pnpm test
```

---

## Testing Providers

Each provider can be tested independently:

```bash
# Test GitHub provider
cd /Users/kyle/Projects/obo/packages/providers
pnpm test github

# Test Supabase provider
pnpm test supabase
```

---

## Manual MCP Testing (without Claude)

Use `mcp-client-cli` or similar:

```bash
npx @modelcontextprotocol/inspector /Users/kyle/Projects/obo/packages/mcp/dist/index.js
```

This opens a web UI to test all MCP tools.
