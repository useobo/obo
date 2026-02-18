/**
 * Supabase Provider
 *
 * The "poster child" for rogue mode.
 *
 * Supabase doesn't support:
 * - OAuth device flow
 * - Public signup API
 * - Programmatic credential creation
 *
 * So we use rogue mode:
 * 1. OBO has a master Supabase account
 * 2. We issue scoped JWTs to actors
 * 3. We proxy all requests through our infrastructure
 * 4. We log everything for audit
 */

import type { Provider, SlipRequest, SlipResponse } from "@useobo/core";
import { SignJWT } from "jose";

export const SupabaseProvider: Provider = {
  name: "supabase",
  description: "Supabase - Open source Firebase alternative",
  tags: ["auth", "database", "postgres", "realtime", "storage"],

  supports: {
    oauth: false, // Supabase doesn't support this
    genesis: false, // No public signup API
    byoc: true, // User can paste their own key
    rogue: true, // Use OBO's master account
  },

  /**
   * Provision Supabase access via rogue mode
   */
  async provision(request: SlipRequest): Promise<SlipResponse> {
    // Generate a scoped JWT that represents this slip
    const jwt = await generateSlipJWT({
      actor: request.actor,
      principal: request.principal,
      target: "supabase",
      scope: request.requested_scope,
      ttl: request.ttl ?? 3600,
    });

    return {
      slip: {
        id: `slip_supabase_${Date.now()}`,
        actor: request.actor,
        principal: request.principal,
        target: "supabase",
        granted_scope: request.requested_scope,
        issued_at: new Date(),
        expires_at: request.ttl
          ? new Date(Date.now() + request.ttl * 1000)
          : null,
        provisioning_method: "rogue",
        token_id: jwt.id,
        revocation_url: `https://useobo.com/revoke/${jwt.id}`,
        policy_result: {
          decision: "auto_approve",
          policy_id: "supabase-rogue",
          reason: "Provisioned via OBO master account",
        },
      },
      token: {
        id: jwt.id,
        slip_id: "", // Will be set by caller
        type: "jwt",
        secret: jwt.token,
        reference: jwt.id,
        metadata: {
          proxy_url: "https://proxy.useobo.com/supabase",
        },
      },
    };
  },

  /**
   * Validate a Supabase API key
   */
  async validate(credential: string, principal: string): Promise<boolean> {
    // TODO: Call Supabase API to validate
    // GET https://{project_ref}.supabase.co/rest/v1/
    // If 200 OK, key is valid
    return false;
  },

  /**
   * Revoke a Supabase slip
   */
  async revoke(slip: import("@useobo/core").Slip): Promise<void> {
    // TODO: Add JWT ID to revocation list
    // Our proxy will check this list before accepting tokens
  },
};

/**
 * Supabase scope mapping
 *
 * Map OBO scopes to Supabase permissions
 */
export const SUPABASE_SCOPE_MAP: Record<string, string[]> = {
  "projects:read": ["projects:read"],
  "projects:write": ["projects:write", "projects:create"],
  "functions:read": ["functions:read"],
  "functions:write": ["functions:write", "functions:create"],
  "database:read": ["database:read"],
  "database:write": ["database:write"],
  "storage:read": ["storage:read"],
  "storage:write": ["storage:write"],
};

/**
 * Convert OBO scopes to Supabase permissions
 */
export function toSupabaseScopes(scopes: string[]): string[] {
  const supabaseScopes: string[] = [];

  for (const scope of scopes) {
    const mapped = SUPABASE_SCOPE_MAP[scope];
    if (mapped) {
      supabaseScopes.push(...mapped);
    }
  }

  return supabaseScopes;
}

/**
 * Generate a JWT for a slip
 *
 * This JWT is presented to the OBO proxy, which validates it
 * and forwards the request to Supabase using master credentials.
 */
async function generateSlipJWT(params: {
  actor: string;
  principal: string;
  target: string;
  scope: string[];
  ttl: number;
}): Promise<{ id: string; token: string }> {
  const secret = new TextEncoder().encode(
    process.env.OBO_JWT_SECRET || "dev-secret-change-me"
  );

  const id = `slip_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const jwt = await new SignJWT({
    actor: params.actor,
    principal: params.principal,
    target: params.target,
    scope: params.scope,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setJti(id)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + params.ttl)
    .setIssuer("obo")
    .setAudience("obo-proxy")
    .sign(secret);

  return { id, token: jwt };
}
