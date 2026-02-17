#!/bin/bash

cd "$(dirname "$0")"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m'

echo -e "${BLUE}=== OBO MCP Server Test Suite ===${NC}\n"

# Test 1: List tools
echo -e "${BLUE}Test 1: List Tools${NC}"
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/index.js 2>/dev/null | jq -r '.result.tools[].name' | while read tool; do
  echo "  ✓ $tool"
done

echo ""

# Test 2: Check policy for auto-approve scope
echo -e "${BLUE}Test 2: Check Policy (repos:read - auto-approve)${NC}"
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"check_policy","arguments":{"target":"github","principal":"kaarch@gmail.com","requested_scope":["repos:read"]}}}' | node dist/index.js 2>/dev/null | jq -r '.result.content[0].text'

echo ""

# Test 3: Check policy for manual approval scope
echo -e "${BLUE}Test 3: Check Policy (repos:write - manual approve)${NC}"
echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"check_policy","arguments":{"target":"github","principal":"kaarch@gmail.com","requested_scope":["repos:write"]}}}' | node dist/index.js 2>/dev/null | jq -r '.result.content[0].text'

echo ""

# Test 4: Request GitHub slip without credentials (should show helpful error)
echo -e "${BLUE}Test 4: Request GitHub Slip (no credentials - shows options)${NC}"
echo '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"request_slip","arguments":{"target":"github","principal":"kaarch@gmail.com","requested_scope":["repos:read"]}}}' | node dist/index.js 2>&1 | jq -r '.error.message // .result.content[0].text' | head -5

echo ""

# Test 5: Request Supabase slip (rogue mode - works without credentials)
echo -e "${BLUE}Test 5: Request Supabase Slip (rogue mode)${NC}"
echo '{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"request_slip","arguments":{"target":"supabase","principal":"kaarch@gmail.com","requested_scope":["projects:read"]}}}' | node dist/index.js 2>/dev/null | jq -r '.result.content[0].text'

echo ""

# Test 6: Complete OAuth flow with invalid slip ID (should handle gracefully)
echo -e "${BLUE}Test 6: Complete OAuth Flow (invalid slip)${NC}"
echo '{"jsonrpc":"2.0","id":6,"method":"tools/call","params":{"name":"complete_oauth_flow","arguments":{"slip_id":"invalid_slip_id"}}}' | node dist/index.js 2>/dev/null | jq -r '.result.content[0].text'

echo ""

echo -e "${GREEN}=== All Tests Complete ===${NC}"
echo ""
echo -e "${YELLOW}NOTE:${NC} For full GitHub OAuth testing, set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET"
echo "For BYOC testing, pass a GitHub PAT in the 'reason' field"
