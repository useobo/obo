#!/bin/bash

# Test OBO MCP Server directly via stdio

cd /Users/kyle/Projects/obo/packages/mcp

# Test 1: List available tools
echo "=== Test: List Tools ==="
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/index.js 2>/dev/null | jq .

echo ""

# Test 2: Call request_slip tool
echo "=== Test: Request Slip ==="
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"request_slip","arguments":{"target":"github","principal":"kaarch@gmail.com","requested_scope":["repos:read"],"reason":"Testing OBO MCP server"}}}' | node dist/index.js 2>/dev/null | jq .

echo ""

# Test 3: Call check_policy tool
echo "=== Test: Check Policy ==="
echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"check_policy","arguments":{"target":"supabase","principal":"kaarch@gmail.com","requested_scope":["projects:read"]}}}' | node dist/index.js 2>/dev/null | jq .

echo ""
echo "✅ MCP server tests complete!"
