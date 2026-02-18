/**
 * Linear Provider
 *
 * Supports BYOC (Bring Your Own Credential) with API Keys.
 *
 * Linear API keys allow programmatic access to Linear workspaces including:
 * - Issues and projects
 * - Teams and workflows
 * - Comments and labels
 *
 * Create an API key at: https://linear.app/settings/api
 */

import type { Provider, SlipRequest, SlipResponse } from "@useobo/core";

const LINEAR_API_URL = "https://api.linear.app/graphql";

interface LinearViewerResponse {
  data?: {
    viewer?: {
      id: string;
      name?: string;
      email?: string;
    };
  };
  errors?: Array<{ message: string }>;
}

export const LinearProvider: Provider = {
  name: "linear",
  description: "Linear - Project management and issue tracking",
  tags: ["project-management", "issues", "tracking", "linear", "agile"],

  supports: {
    oauth: false, // OAuth not yet implemented
    genesis: false, // No public signup API
    byoc: true, // User can paste their own API key
    rogue: false, // No rogue mode
  },

  /**
   * Provision Linear access via BYOC mode
   */
  async provision(request: SlipRequest): Promise<SlipResponse> {
    // Check for Linear API key in reason field
    // Linear API keys start with "lin_api_"
    const apiKeyMatch = request.reason?.match(/lin_api_[a-zA-Z0-9_-]{30,}/)?.[0];

    if (!apiKeyMatch) {
      throw new Error(
        "Linear requires an API Key. " +
        "Create one at https://linear.app/settings/api " +
        "and provide it in the 'reason' field."
      );
    }

    // Validate the API key
    const isValid = await this.validate(apiKeyMatch, request.principal);
    if (!isValid) {
      throw new Error("The provided Linear API key is invalid. Please check and try again.");
    }

    const slipId = `slip_linear_byoc_${Date.now()}`;
    const tokenId = `linear_token_${Date.now()}`;

    return {
      slip: {
        id: slipId,
        actor: request.actor,
        principal: request.principal,
        target: "linear",
        granted_scope: request.requested_scope,
        issued_at: new Date(),
        expires_at: request.ttl
          ? new Date(Date.now() + request.ttl * 1000)
          : null,
        provisioning_method: "byoc",
        token_id: tokenId,
        revocation_url: null,
        policy_result: {
          decision: "auto_approve",
          policy_id: "linear-byoc",
          reason: "Using user-provided Linear API key (BYOC)",
        },
      },
      token: {
        id: tokenId,
        slip_id: slipId,
        type: "api_key",
        secret: apiKeyMatch,
        reference: apiKeyMatch.substring(0, 16) + "...",
        metadata: {
          source: "byoc",
        },
      },
    };
  },

  /**
   * Validate a Linear API key
   */
  async validate(credential: string, principal: string): Promise<boolean> {
    try {
      const response = await fetch(LINEAR_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: credential,
        },
        body: JSON.stringify({
          query: `
            query {
              viewer {
                id
              }
            }
          `,
        }),
      });

      const data = await response.json() as LinearViewerResponse;

      // If we have a viewer ID, the token is valid
      return data.data?.viewer?.id !== undefined;
    } catch {
      return false;
    }
  },

  /**
   * Revoke a Linear slip
   *
   * Note: Linear API keys must be revoked manually in settings.
   */
  async revoke(slip: import("@useobo/core").Slip): Promise<void> {
    console.error(
      `Linear slip ${slip.id} revoked. ` +
      `Revoke the API key manually at: https://linear.app/settings/api`
    );
  },
};

/**
 * Linear scope mapping
 *
 * Map OBO scopes to Linear permissions
 * Linear uses fine-grained permissions per resource type
 */
export const LINEAR_SCOPE_MAP: Record<string, string> = {
  "issues:read": "read",
  "issues:write": "write",
  "issues:delete": "delete",
  "issues:create": "create",
  "teams:read": "read",
  "teams:write": "write",
  "projects:read": "read",
  "projects:write": "write",
  "comments:read": "read",
  "comments:write": "write",
  "labels:read": "read",
  "labels:write": "write",
  "workflows:read": "read",
  "workflows:write": "write",
  "roadmaps:read": "read",
  "roadmaps:write": "write",
  "views:read": "read",
  "views:write": "write",
  "cycles:read": "read",
  "cycles:write": "write",
};

/**
 * Convert OBO scopes to Linear permissions
 *
 * Note: Linear doesn't use OAuth-style scopes in the same way.
 * Permissions are determined by the API key's access level.
 * This mapping is for documentation and future use.
 */
export function toLinearScopes(scopes: string[]): string[] {
  const linearScopes = new Set<string>();

  for (const scope of scopes) {
    const mapped = LINEAR_SCOPE_MAP[scope];
    if (mapped) {
      linearScopes.add(mapped);
    }
  }

  return Array.from(linearScopes);
}

/**
 * Build a GraphQL query for Linear operations
 *
 * This helper constructs appropriate GraphQL queries based on requested scopes.
 */
export function buildLinearQuery(operation: string, scopes: string[]): string {
  // Base fields for common operations
  const baseFields = ["id", "createdAt", "updatedAt"];

  switch (operation) {
    case "issues":
      return `
        query {
          issues(first: 10) {
            nodes {
              ${baseFields}
              title
              state { name }
              assignee { name }
            }
          }
        }
      `;

    case "teams":
      return `
        query {
          teams {
            nodes {
              ${baseFields}
              name
              key
            }
          }
        }
      `;

    case "projects":
      return `
        query {
          projects {
            nodes {
              ${baseFields}
              name
              state
            }
          }
        }
      `;

    default:
      return `
        query {
          viewer {
            id
            name
            email
          }
        }
      `;
  }
}
