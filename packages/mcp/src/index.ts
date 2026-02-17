#!/usr/bin/env node

/**
 * OBO MCP Server
 *
 * Model Context Protocol server that lets AI agents:
 * - Request slips (credentials)
 * - List active slips
 * - Revoke slips
 * - Check policy before making requests
 * - Complete OAuth flows
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { createSlipService } from "@obo/core/dist/slip/index.js";
import { GitHubProvider, completeOAuthFlow } from "@obo/providers/dist/github/index.js";
import { SupabaseProvider } from "@obo/providers/dist/supabase/index.js";

// ---------------------------------------------------------------------
// Slip Service Setup
// ---------------------------------------------------------------------

const slipService = createSlipService();

// Register providers
slipService.registerProvider(GitHubProvider);
slipService.registerProvider(SupabaseProvider);

// ---------------------------------------------------------------------
// Tool Schemas
// ---------------------------------------------------------------------

const RequestSlipSchema = z.object({
  target: z.string().describe("The service to access (e.g., 'github', 'supabase')"),
  principal: z.string().describe("Your email or user ID"),
  requested_scope: z.array(z.string()).describe("Permissions requested (e.g., ['repos:read'])"),
  ttl: z.number().optional().describe("Time to live in seconds"),
  reason: z.string().optional().describe("Why you need access (for GitHub, you can paste a PAT here starting with 'github_pat_' or 'ghp_')"),
});

const ListSlipsSchema = z.object({
  principal: z.string().optional().describe("Filter by principal"),
  target: z.string().optional().describe("Filter by target"),
  active_only: z.boolean().optional().describe("Only show non-expired slips"),
});

const RevokeSlipSchema = z.object({
  slip_id: z.string().describe("The slip ID to revoke"),
});

const CheckPolicySchema = z.object({
  target: z.string().describe("The service to check"),
  principal: z.string().describe("Your email or user ID"),
  requested_scope: z.array(z.string()).describe("Permissions to check"),
});

const CompleteOAuthSchema = z.object({
  slip_id: z.string().describe("The slip ID from request_slip that initiated OAuth"),
});

// ---------------------------------------------------------------------
// Server Setup
// ---------------------------------------------------------------------

const server = new Server(
  {
    name: "obo",
    version: "0.0.1",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ---------------------------------------------------------------------
// Tool Handlers
// ---------------------------------------------------------------------

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "request_slip",
        description: `Request a slip (credential) for a service.

This allows you to act on behalf of a principal (user) to access a target service.
OBO evaluates policy and returns a token if approved.

GitHub supports two modes:
1. OAuth Device Flow: Requires GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET env vars
2. BYOC (Bring Your Own Credential): Paste a GitHub Personal Access Token in the 'reason' field

Example: request_slip with target="github", principal="you@example.com", requested_scope=["repos:read"]`,
        inputSchema: {
          type: "object",
          properties: {
            target: {
              type: "string",
              description: "The service to access (e.g., 'github', 'supabase')",
            },
            principal: {
              type: "string",
              description: "Your email or user ID (e.g., 'kaarch@gmail.com')",
            },
            requested_scope: {
              type: "array",
              items: { type: "string" },
              description: "Permissions requested (e.g., ['repos:read', 'repos:write'])",
            },
            ttl: {
              type: "number",
              description: "Time to live in seconds (optional)",
            },
            reason: {
              type: "string",
              description: "Why you need access. For GitHub, you can paste a Personal Access Token here (BYOC mode)",
            },
          },
          required: ["target", "principal", "requested_scope"],
        },
      },
      {
        name: "complete_oauth_flow",
        description: `Complete an OAuth flow after the user has authorized.

After calling request_slip for GitHub OAuth, the user will visit a URL and enter a code.
Once they've authorized, call this tool to poll for and retrieve the access token.

This should be called after the user confirms they've completed authorization.`,
        inputSchema: {
          type: "object",
          properties: {
            slip_id: {
              type: "string",
              description: "The slip ID returned by request_slip",
            },
          },
          required: ["slip_id"],
        },
      },
      {
        name: "list_slips",
        description: "List active slips (credentials) for a principal",
        inputSchema: {
          type: "object",
          properties: {
            principal: {
              type: "string",
              description: "Filter by principal (optional)",
            },
            target: {
              type: "string",
              description: "Filter by target service (optional)",
            },
            active_only: {
              type: "boolean",
              description: "Only show non-expired slips (optional)",
            },
          },
        },
      },
      {
        name: "revoke_slip",
        description: "Revoke an active slip",
        inputSchema: {
          type: "object",
          properties: {
            slip_id: {
              type: "string",
              description: "The slip ID to revoke",
            },
          },
          required: ["slip_id"],
        },
      },
      {
        name: "check_policy",
        description: `Check if a request would be approved by policy before requesting.

Use this to avoid requesting a slip that would be denied.`,
        inputSchema: {
          type: "object",
          properties: {
            target: {
              type: "string",
              description: "The service to check",
            },
            principal: {
              type: "string",
              description: "Your email or user ID",
            },
            requested_scope: {
              type: "array",
              items: { type: "string" },
              description: "Permissions to check",
            },
          },
          required: ["target", "principal", "requested_scope"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "request_slip": {
        const input = RequestSlipSchema.parse(args);
        const result = await slipService.requestSlip({
          actor: "claude-code",
          principal: input.principal,
          target: input.target,
          requested_scope: input.requested_scope,
          ttl: input.ttl,
          reason: input.reason,
        });

        const tokenInfo = result.token
          ? `\n\nToken Type: ${result.token.type}\nToken Reference: ${result.token.reference}`
          : "";

        return {
          content: [
            {
              type: "text",
              text: `Slip created successfully!\n\n` +
                    `Slip ID: ${result.slip.id}\n` +
                    `Target: ${result.slip.target}\n` +
                    `Principal: ${result.slip.principal}\n` +
                    `Granted Scope: ${result.slip.granted_scope.join(", ")}\n` +
                    `Expires: ${result.slip.expires_at?.toISOString() || "never"}\n` +
                    `Policy: ${result.slip.policy_result.decision} (${result.slip.policy_result.policy_id})` +
                    tokenInfo +
                    (result.instructions ? `\n\n--- Instructions ---\n${result.instructions}` : ""),
            },
          ],
        };
      }

      case "complete_oauth_flow": {
        const input = CompleteOAuthSchema.parse(args);

        try {
          const token = await completeOAuthFlow(input.slip_id);

          return {
            content: [
              {
                type: "text",
                text: `OAuth flow completed successfully!\n\n` +
                      `Token ID: ${token.id}\n` +
                      `Token Type: ${token.type}\n` +
                      `Token: ${token.secret}\n` +
                      `\nThis token can now be used to make GitHub API requests.`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Failed to complete OAuth flow: ${error instanceof Error ? error.message : String(error)}\n\n` +
                      `Make sure:\n` +
                      `1. You've visited the verification URL and entered the code\n` +
                      `2. You've authorized the application\n` +
                      `3. The slip hasn't expired (slips are valid for ~90 seconds)`,
              },
            ],
          };
        }
      }

      case "list_slips": {
        const input = ListSlipsSchema.parse(args);
        const slips = slipService.listSlips({
          principal: input.principal,
          target: input.target,
          active_only: input.active_only,
        });

        if (slips.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No slips found${input.principal ? ` for ${input.principal}` : ""}${input.target ? ` on ${input.target}` : ""}.`,
              },
            ],
          };
        }

        const slipList = slips.map((s: typeof slips[0]) =>
          `- ${s.id}\n  Target: ${s.target}\n  Principal: ${s.principal}\n  Scope: ${s.granted_scope.join(", ")}\n  Expires: ${s.expires_at?.toISOString() || "never"}\n  Policy: ${s.policy_result.decision}`
        ).join("\n\n");

        return {
          content: [
            {
              type: "text",
              text: `Found ${slips.length} slip(s):\n\n${slipList}`,
            },
          ],
        };
      }

      case "revoke_slip": {
        const input = RevokeSlipSchema.parse(args);
        await slipService.revokeSlip(input.slip_id);

        return {
          content: [
            {
              type: "text",
              text: `Slip ${input.slip_id} revoked successfully.`,
            },
          ],
        };
      }

      case "check_policy": {
        const input = CheckPolicySchema.parse(args);
        const result = await slipService.checkPolicy(
          input.target,
          input.principal,
          input.requested_scope
        );

        return {
          content: [
            {
              type: "text",
              text: `Policy check result:\n\n` +
                    `Decision: ${result.decision}\n` +
                    `Policy: ${result.policy_id || "none"}\n` +
                    `Reason: ${result.reason || "N/A"}`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid input: ${error.errors.map((e) => e.message).join(", ")}`);
    }
    throw error;
  }
});

// ---------------------------------------------------------------------
// Start Server
// ---------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("OBO MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
