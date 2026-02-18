/**
 * Vercel Provider
 *
 * Supports BYOC (Bring Your Own Credential) with Personal Access Tokens.
 *
 * Vercel PATs allow programmatic access to Vercel resources including:
 * - Projects and deployments
 * - Environment variables
 * - Edge config and logs
 *
 * Create a PAT at: https://vercel.com/account/tokens
 */

import type { Provider, SlipRequest, SlipResponse } from "@useobo/core";

const VERCEL_API_URL = "https://api.vercel.com/v2";

export const VercelProvider: Provider = {
  name: "vercel",
  description: "Vercel - Deploy frontend projects and serverless functions",
  tags: ["deployment", "frontend", "nextjs", "serverless", "vercel"],

  supports: {
    oauth: false, // OAuth not yet implemented
    genesis: false, // No public signup API
    byoc: true, // User can paste their own PAT
    rogue: false, // No rogue mode
  },

  /**
   * Provision Vercel access via BYOC mode
   */
  async provision(request: SlipRequest): Promise<SlipResponse> {
    // Check for Vercel PAT in reason field
    // Vercel PATs start with "vercel_pat_"
    const patMatch = request.reason?.match(/vercel_pat_[a-zA-Z0-9_-]{30,}/)?.[0];

    if (!patMatch) {
      throw new Error(
        "Vercel requires a Personal Access Token (PAT). " +
        "Create one at https://vercel.com/account/tokens " +
        "and provide it in the 'reason' field."
      );
    }

    // Validate the PAT
    const isValid = await this.validate(patMatch, request.principal);
    if (!isValid) {
      throw new Error("The provided Vercel token is invalid. Please check and try again.");
    }

    const slipId = `slip_vercel_byoc_${Date.now()}`;
    const tokenId = `vercel_token_${Date.now()}`;

    return {
      slip: {
        id: slipId,
        actor: request.actor,
        principal: request.principal,
        target: "vercel",
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
          policy_id: "vercel-byoc",
          reason: "Using user-provided Vercel PAT (BYOC)",
        },
      },
      token: {
        id: tokenId,
        slip_id: slipId,
        type: "oauth_access_token",
        secret: patMatch,
        reference: patMatch.substring(0, 20) + "...",
        metadata: {
          source: "byoc",
        },
      },
    };
  },

  /**
   * Validate a Vercel Personal Access Token
   */
  async validate(credential: string, principal: string): Promise<boolean> {
    try {
      const response = await fetch(`${VERCEL_API_URL}/user`, {
        headers: {
          Authorization: `Bearer ${credential}`,
        },
      });

      // Vercel returns 200 OK for valid tokens
      return response.ok;
    } catch {
      return false;
    }
  },

  /**
   * Revoke a Vercel slip
   *
   * Note: Vercel PATs must be revoked manually in the dashboard.
   * There is no API endpoint to revoke PATs programmatically.
   */
  async revoke(slip: import("@useobo/core").Slip): Promise<void> {
    console.error(
      `Vercel slip ${slip.id} revoked. ` +
      `Revoke the PAT manually at: https://vercel.com/account/tokens`
    );
  },
};

/**
 * Vercel scope mapping
 *
 * Map OBO scopes to Vercel permissions
 */
export const VERCEL_SCOPE_MAP: Record<string, string[]> = {
  "projects:read": ["read:projects"],
  "projects:write": ["write:projects", "create:projects"],
  "deployments:read": ["read:deployments"],
  "deployments:write": ["write:deployments", "create:deployments"],
  "deployment:trigger": ["trigger:deployments"],
  "environments:read": ["read:environments"],
  "environments:write": ["write:environments"],
  "logs:read": ["read:logs"],
  "teams:read": ["read:teams"],
};

/**
 * Convert OBO scopes to Vercel permissions
 */
export function toVercelScopes(scopes: string[]): string[] {
  const vercelScopes: string[] = [];

  for (const scope of scopes) {
    const mapped = VERCEL_SCOPE_MAP[scope];
    if (mapped) {
      vercelScopes.push(...mapped);
    }
  }

  return vercelScopes;
}
