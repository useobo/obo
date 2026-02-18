/**
 * Notion Provider
 *
 * Supports BYOC (Bring Your Own Credential) with Integration tokens.
 *
 * Notion integration tokens allow programmatic access to Notion workspaces including:
 * - Pages and blocks
 * - Databases
 * - Search and queries
 *
 * Create an integration at: https://www.notion.so/my-integrations
 */

import type { Provider, SlipRequest, SlipResponse } from "@useobo/core";

const NOTION_API_URL = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

interface NotionSearchResponse {
  object?: string;
  results?: Array<{
    object: string;
    id: string;
  }>;
}

interface NotionError {
  code: string;
  message: string;
}

export const NotionProvider: Provider = {
  name: "notion",
  description: "Notion - Docs, databases, and wikis",
  tags: ["docs", "database", "wiki", "notion", "knowledge"],

  supports: {
    oauth: false, // OAuth not yet implemented
    genesis: false, // No public signup API
    byoc: true, // User can paste their own integration token
    rogue: false, // No rogue mode
  },

  /**
   * Provision Notion access via BYOC mode
   */
  async provision(request: SlipRequest): Promise<SlipResponse> {
    // Check for Notion integration token in reason field
    // Notion tokens are typically 32+ character secret-like strings
    // Common patterns: secret_* or just a long random string
    const tokenMatch = request.reason?.match(/secret_[a-zA-Z0-9_-]{30,}/)?.[0]
      || request.reason?.match(/[a-zA-Z0-9_]{32,}/)?.[0];

    if (!tokenMatch) {
      throw new Error(
        "Notion requires an Integration Token. " +
        "Create one at https://www.notion.so/my-integrations " +
        "and provide it in the 'reason' field."
      );
    }

    // Validate the token
    const isValid = await this.validate(tokenMatch, request.principal);
    if (!isValid) {
      throw new Error("The provided Notion token is invalid. Please check and try again.");
    }

    const slipId = `slip_notion_byoc_${Date.now()}`;
    const tokenId = `notion_token_${Date.now()}`;

    return {
      slip: {
        id: slipId,
        actor: request.actor,
        principal: request.principal,
        target: "notion",
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
          policy_id: "notion-byoc",
          reason: "Using user-provided Notion integration token (BYOC)",
        },
      },
      token: {
        id: tokenId,
        slip_id: slipId,
        type: "api_key",
        secret: tokenMatch,
        reference: tokenMatch.substring(0, 16) + "...",
        metadata: {
          source: "byoc",
        },
      },
    };
  },

  /**
   * Validate a Notion integration token
   *
   * Uses the search endpoint with limit=1 to validate
   */
  async validate(credential: string, principal: string): Promise<boolean> {
    try {
      const response = await fetch(`${NOTION_API_URL}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${credential}`,
          "Notion-Version": NOTION_VERSION,
        },
        body: JSON.stringify({
          query: "",
          limit: 1,
        }),
      });

      const data = await response.json() as NotionSearchResponse & { error?: NotionError };

      // Valid tokens return a response with "object" or "results"
      // Invalid tokens return { code: "unauthorized", message: "..." }
      if (data.error) {
        return false;
      }

      return data.object === "list" || Array.isArray(data.results);
    } catch {
      return false;
    }
  },

  /**
   * Revoke a Notion slip
   *
   * Note: Notion integration tokens must be revoked manually in settings.
   */
  async revoke(slip: import("@useobo/core").Slip): Promise<void> {
    console.error(
      `Notion slip ${slip.id} revoked. ` +
      `Revoke the integration manually at: https://www.notion.so/my-integrations`
    );
  },
};

/**
 * Notion scope mapping
 *
 * Map OBO scopes to Notion capabilities
 * Notion uses capability-based access rather than OAuth scopes
 */
export const NOTION_SCOPE_MAP: Record<string, string> = {
  "pages:read": "read:pages",
  "pages:write": "write:pages",
  "databases:read": "read:databases",
  "databases:write": "write:databases",
  "search": "search",
  "comments:read": "read:comments",
  "comments:write": "write:comments",
  "users:read": "read:users",
  "blocks:read": "read:blocks",
  "blocks:write": "write:blocks",
};

/**
 * Convert OBO scopes to Notion capabilities
 *
 * Note: Notion capabilities are determined by the integration's
 * access level to specific workspaces/pages. This mapping is
 * for documentation and policy evaluation.
 */
export function toNotionScopes(scopes: string[]): string[] {
  const notionScopes: string[] = [];

  for (const scope of scopes) {
    const mapped = NOTION_SCOPE_MAP[scope];
    if (mapped) {
      notionScopes.push(mapped);
    }
  }

  return notionScopes;
}

/**
 * Build a Notion API request headers
 *
 * Helper for making authenticated requests to Notion
 */
export function buildNotionHeaders(token: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
    "Notion-Version": NOTION_VERSION,
  };
}

/**
 * Common Notion API query builders
 */
export const NotionQueries = {
  /**
   * Search query for finding pages and databases
   */
  search: (query: string, filter?: { property: string; value: string }) => ({
    query,
    filter: filter ? {
      property: "object",
      value: filter.value,
    } : undefined,
  }),

  /**
   * Query database for structured data
   */
  queryDatabase: (databaseId: string, filter?: Record<string, unknown>) => ({
    database_id: databaseId,
    filter,
  }),

  /**
   * Create a new page
   */
  createPage: (parentId: string, properties: Record<string, unknown>) => ({
    parent: { database_id: parentId },
    properties,
  }),

  /**
   * Append block content to a page
   */
  appendBlocks: (blockId: string, children: Array<unknown>) => ({
    block_id: blockId,
    children,
  }),
};
