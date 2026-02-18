/**
 * OBO Provider - Self-Referential Provider
 *
 * This provider allows OBO to manage itself.
 * Agents can request slips to:
 * - List their own slips
 * - Create new slips (meta!)
 * - Revoke slips
 * - View policies
 *
 * This proves the OBO protocol works by using OBO to manage OBO.
 */

import type { Provider, SlipRequest, SlipResponse, Token } from "@useobo/core";

// The scopes that OBO itself supports
export const OBO_SCOPES = {
  // Slips
  "slips:list": "List slips you own",
  "slips:create": "Request new slips",
  "slips:revoke": "Revoke your slips",

  // Policies
  "policies:read": "View policies",
  "policies:write": "Modify policies",

  // Principals
  "principals:read": "View principal info",

  // Dashboard
  "dashboard:read": "Access dashboard",
} as const;

export type OBOScope = keyof typeof OBO_SCOPES;

/**
 * Check if a scope is valid for OBO
 */
export function isValidOBOScope(scope: string): boolean {
  return scope in OBO_SCOPES;
}

/**
 * Get description for a scope
 */
export function getScopeDescription(scope: string): string {
  return OBO_SCOPES[scope as OBOScope] || "Unknown scope";
}

/**
 * Generate a JWT token for OBO internal API access
 */
async function generateOBOToken(params: {
  principal: string;
  scopes: string[];
  slipId: string;
  ttl: number;
}): Promise<{ id: string; token: string }> {
  // Use the crypto package's JWT utilities (supports key rotation)
  const { signJWT } = await import("@useobo/crypto");

  const token = await signJWT({
    principal: params.principal,
    scopes: params.scopes,
    slipId: params.slipId,
  }, params.ttl);

  const id = `obo_token_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

  return { id, token };
}

export const OboProvider: Provider = {
  name: "obo",
  description: "obo - Self-referential access management",
  tags: ["internal", "self-hosted", "api", "meta"],

  supports: {
    oauth: false,
    genesis: false,
    byoc: true, // Can bring your own OBO API key
    rogue: false, // We're the source, not a proxy
  },

  /**
   * Provision OBO access
   */
  async provision(request: SlipRequest): Promise<SlipResponse> {
    // Check for BYOC mode - user can provide an existing OBO API key
    const byocToken = request.reason?.match(/^obo_api_[a-zA-Z0-9_]{20,}/)?.[0];

    if (byocToken) {
      // Validate the token (in production, would call OBO API to validate)
      // For now, just check format
      const isValid = byocToken.startsWith("obo_api_");

      if (!isValid) {
        throw new Error("Invalid OBO API token. Format: obo_api_...");
      }

      const slipId = `slip_obo_byoc_${Date.now()}`;
      const tokenId = `obo_token_${Date.now()}`;

      return {
        slip: {
          id: slipId,
          actor: request.actor,
          principal: request.principal,
          target: "obo",
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
            policy_id: "obo-byoc",
            reason: "Using user-provided OBO API token (BYOC)",
          },
        },
        token: {
          id: tokenId,
          slip_id: slipId,
          type: "api_key",
          secret: byocToken,
          reference: byocToken.substring(0, 20) + "...",
          metadata: {
            source: "byoc",
          },
        },
      };
    }

    // Default: Generate an internal OBO JWT token
    const slipId = `slip_obo_${Date.now()}`;
    const tokenId = `obo_token_${Date.now()}`;

    const jwt = await generateOBOToken({
      principal: request.principal,
      scopes: request.requested_scope,
      slipId,
      ttl: request.ttl || 3600,
    });

    return {
      slip: {
        id: slipId,
        actor: request.actor,
        principal: request.principal,
        target: "obo",
        granted_scope: request.requested_scope,
        issued_at: new Date(),
        expires_at: request.ttl
          ? new Date(Date.now() + request.ttl * 1000)
          : null,
        provisioning_method: "genesis", // Creating a new credential
        token_id: tokenId,
        revocation_url: null,
        policy_result: {
          decision: "auto_approve",
          policy_id: "obo-default",
          reason: "OBO internal access for agent operations",
        },
      },
      token: {
        id: tokenId,
        slip_id: slipId,
        type: "jwt",
        secret: jwt.token,
        reference: jwt.id,
        metadata: {
          algorithm: "HS256",
          issuer: "obo",
        },
      },
    };
  },

  /**
   * Validate an OBO API key or JWT
   */
  async validate(credential: string, principal: string): Promise<boolean> {
    // Check if it's a JWT
    if (credential.includes(".")) {
      try {
        const parts = credential.split(".");
        if (parts.length !== 3) return false;

        const payload = JSON.parse(
          Buffer.from(parts[1], "base64").toString()
        );

        // Check if token is for the right principal and not expired
        return (
          payload.sub === principal &&
          payload.exp &&
          payload.exp > Date.now() / 1000
        );
      } catch {
        return false;
      }
    }

    // Check if it's an API key
    if (credential.startsWith("obo_api_")) {
      // In production, validate against database
      return credential.length >= 30;
    }

    return false;
  },

  /**
   * Revoke an OBO slip/token
   */
  async revoke(slip: import("@useobo/core").Slip): Promise<void> {
    // Add the slip/token to a revocation list
    // In production, this would be checked by the OBO API
    console.log(`OBO slip ${slip.id} revoked. Token should be added to revocation list.`);
  },
};

/**
 * Get a list of available scopes for OBO
 */
export function getAvailableScopes(): string[] {
  return Object.keys(OBO_SCOPES);
}

/**
 * Validate a list of scopes against available OBO scopes
 */
export function validateScopes(scopes: string[]): { valid: string[]; invalid: string[] } {
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const scope of scopes) {
    if (isValidOBOScope(scope)) {
      valid.push(scope);
    } else {
      invalid.push(scope);
    }
  }

  return { valid, invalid };
}
