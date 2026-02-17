/**
 * OBO Core Types
 *
 * The vocabulary of OBO:
 * - Principal: The authority owner
 * - Actor: The AI agent
 * - Target: The service
 * - Slip: The authorization
 * - Policy: The rules
 * - Token: The credential
 */

/**
 * A Principal is the authority owner.
 * Typically an email address or user ID.
 *
 * Example: "kaarch@gmail.com" or "user_123"
 */
export type Principal = string;

/**
 * An Actor is the agent making requests.
 * Typically an agent ID or process identifier.
 *
 * Example: "claude-opus-4" or "agent-ci-worker"
 */
export type Actor = string;

/**
 * A Target is the service being accessed.
 *
 * Example: "github", "supabase", "stripe"
 */
export type Target = string;

/**
 * Scope defines what permissions are being requested.
 * Target-specific format.
 *
 * Examples:
 * - GitHub: ["repos:read", "repos:write"]
 * - Supabase: ["projects:read", "functions:write"]
 */
export type Scope = string[];

/**
 * A Slip is the authorization record.
 * It represents permission granted to an Actor, on behalf of a Principal, against a Target.
 */
export interface Slip {
  /** Unique slip identifier */
  id: string;

  /** Who is acting */
  actor: Actor;

  /** On whose behalf */
  principal: Principal;

  /** Which service */
  target: Target;

  /** What was granted */
  granted_scope: Scope;

  /** When issued */
  issued_at: Date;

  /** When expires (null = never) */
  expires_at: Date | null;

  /** How this was provisioned */
  provisioning_method: ProvisioningMethod;

  /** Token reference (if stored) */
  token_id: string | null;

  /** Revocation URL (if supported by Target) */
  revocation_url: string | null;

  /** Policy evaluation result */
  policy_result: PolicyResult;
}

/**
 * How the slip was provisioned
 */
export type ProvisioningMethod =
  | "oauth"        // Native OAuth flow
  | "genesis"      // Account created via API
  | "byoc"         // Bring Your Own Credential
  | "rogue";       // OBO's master account + scoped JWT

/**
 * Policy evaluation result
 */
export interface PolicyResult {
  /** How the decision was made */
  decision: "auto_approve" | "manual_approve" | "deny";

  /** Which policy was evaluated */
  policy_id: string | null;

  /** Reason for decision */
  reason?: string;

  /** Who approved (if manual) */
  approved_by?: string;
}

/**
 * A Token is the actual credential presented to the Target.
 */
export interface Token {
  /** Unique token identifier */
  id: string;

  /** Associated slip */
  slip_id: string;

  /** Token type */
  type: TokenType;

  /** The actual secret (null if not stored/retrievable) */
  secret: string | null;

  /** Reference for revocation */
  reference: string | null;

  /** Metadata from Target */
  metadata?: Record<string, unknown>;
}

export type TokenType =
  | "bearer_token"
  | "api_key"
  | "oauth_client"
  | "jwt"
  | "oauth_access_token";

/**
 * Request to create a slip
 */
export interface SlipRequest {
  /** Who is requesting */
  actor: Actor;

  /** On whose behalf */
  principal: Principal;

  /** Which service */
  target: Target;

  /** What scope is requested */
  requested_scope: Scope;

  /** Optional TTL (seconds) */
  ttl?: number;

  /** Reason for request */
  reason?: string;
}

/**
 * Response when a slip is created
 */
export interface SlipResponse {
  /** The created slip */
  slip: Slip;

  /** The token (if immediately available) */
  token?: Token;

  /** Instructions for Actor */
  instructions?: string;
}

/**
 * Policy definition
 */
export interface Policy {
  /** Policy identifier */
  id: string;

  /** Which principals this applies to (glob patterns supported) */
  principals: string[];

  /** Which actors this applies to (glob patterns supported) */
  actors: string[];

  /** Which targets this applies to (glob patterns supported) */
  targets: string[];

  /** Scope patterns that are auto-approved */
  auto_approve: string[];

  /** Scope patterns that require manual approval */
  manual_approve: string[];

  /** Scope patterns that are denied */
  deny: string[];

  /** Max TTL (seconds, null = unlimited) */
  max_ttl: number | null;
}

/**
 * Provider interface
 * All Targets must implement this
 */
export interface Provider {
  /** Target name */
  name: Target;

  /** Human-readable description */
  description: string;

  /** Tags for discovery */
  tags: string[];

  /** What provisioning methods are supported */
  supports: {
    oauth: boolean;
    genesis: boolean;
    byoc: boolean;
    rogue: boolean;
  };

  /**
   * Attempt to provision credentials
   * Returns a slip (with or without token)
   */
  provision(request: SlipRequest): Promise<SlipResponse>;

  /**
   * Validate an existing credential (for BYOC)
   */
  validate(credential: string, principal: Principal): Promise<boolean>;

  /**
   * Revoke a slip/token
   */
  revoke(slip: Slip): Promise<void>;
}
