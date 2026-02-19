/**
 * Stripe Provider
 *
 * Supports PKCE OAuth flow for Stripe Connect.
 *
 * PKCE Flow:
 * 1. Generate code_verifier and code_challenge
 * 2. Redirect user to Stripe authorization URL
 * 3. User authorizes, Stripe redirects to callback
 * 4. Exchange code + verifier for access token
 *
 * Environment:
 * - STRIPE_CLIENT_ID: OAuth client ID
 * - STRIPE_CLIENT_SECRET: OAuth client secret
 * - STRIPE_PUBLISHABLE_KEY: For validating API keys (BYOC)
 *
 * Callback URL configuration:
 * - Set OBO_CALLBACK_URL environment variable (e.g., https://useobo.com/callback)
 * - Or uses current request origin
 */

import type { Provider, SlipRequest, SlipResponse, Token, Scope } from "@useobo/core";
import {
  startPKCEFlow,
  generateState,
  type PKCEStartResponse,
} from "../shared/pkce";

const STRIPE_AUTH_URL = "https://connect.stripe.com/oauth/authorize";
const STRIPE_TOKEN_URL = "https://connect.stripe.com/oauth/token";
const STRIPE_API_URL = "https://api.stripe.com";

// Store pending PKCE flows for each slip
const pendingFlows = new Map<string, {
  slipId: string;
  state: string;
  codeVerifier: string;
  expiresAt: number;
  authUrl: string;
}>();

export const StripeProvider: Provider = {
  name: "stripe",
  description: "Stripe - Payments infrastructure and billing",
  tags: ["payments", "billing", "finance", "api"],

  supports: {
    oauth: true, // PKCE OAuth flow
    genesis: false,
    byoc: true,  // API keys
    rogue: false,
  },

  /**
   * Provision Stripe access via PKCE OAuth or BYOC
   */
  async provision(request: SlipRequest): Promise<SlipResponse> {
    const clientId = process.env.STRIPE_CLIENT_ID;
    const clientSecret = process.env.STRIPE_CLIENT_SECRET;

    // Check if user provided a Stripe API key directly (BYOC mode)
    const byocKey = request.reason?.match(/(sk_live|sk_test)_[a-zA-Z0-9]{24,}/)?.[0];

    if (byocKey) {
      // BYOC mode - validate and use the provided key
      const isValid = await this.validate(byocKey, request.principal);
      if (!isValid) {
        throw new Error("The provided Stripe API key is invalid. Please check and try again.");
      }

      const slipId = `slip_stripe_byoc_${Date.now()}`;

      // Determine if live or test key
      const isLiveKey = byocKey.startsWith("sk_live_");

      return {
        slip: {
          id: slipId,
          actor: request.actor,
          principal: request.principal,
          target: "stripe",
          granted_scope: request.requested_scope,
          issued_at: new Date(),
          expires_at: request.ttl
            ? new Date(Date.now() + request.ttl * 1000)
            : null,
          provisioning_method: "byoc",
          token_id: `stripe_token_${Date.now()}`,
          revocation_url: null,
          policy_result: {
            decision: "auto_approve",
            policy_id: "stripe-byoc",
            reason: `Using user-provided ${isLiveKey ? "live" : "test"} API key (BYOC)`,
          },
        },
        token: {
          id: `stripe_token_${Date.now()}`,
          slip_id: slipId,
          type: "api_key",
          secret: byocKey,
          reference: byocKey.substring(0, 10) + "...",
          metadata: {
            source: "byoc",
            key_type: isLiveKey ? "live" : "test",
          },
        },
        instructions: `
Stripe API Key Provisioned

API Key Type: ${isLiveKey ? "Live" : "Test"}
Key Reference: ${byocKey.substring(0, 10)}...
Requested scopes: ${request.requested_scope.join(", ")}

This API key can be used with the Stripe API:

  curl https://api.stripe.com/v1/charges \\
    -u ${byocKey}: \\
    -d amount=2000 \\
    -d currency=usd \\
    -d source=tok_visa

Note: Stripe API keys have access to all capabilities for your account.
Use caution when sharing. Revoke in Stripe Dashboard when done.
        `.trim(),
      };
    }

    // PKCE OAuth flow
    if (!clientId || !clientSecret) {
      throw new Error(
        "STRIPE_CLIENT_ID and STRIPE_CLIENT_SECRET environment variables are required for OAuth flow. " +
        "Alternatively, provide a Stripe API key in the 'reason' field. " +
        "Create a Stripe OAuth application at https://dashboard.stripe.com/settings/applications"
      );
    }

    // Build callback URL
    const callbackBaseUrl = process.env.OBO_CALLBACK_URL || ""; // Will be resolved in callback handler
    const callbackUrl = `${callbackBaseUrl}/callback/stripe`;

    // Convert OBO scopes to Stripe OAuth scopes
    const stripeScopes = toStripeScopes(request.requested_scope);

    // Generate PKCE state and verifier
    const state = generateState();
    const slipId = `slip_stripe_${Date.now()}`;

    // Start PKCE flow
    const pkceResponse: PKCEStartResponse = startPKCEFlow({
      service: "stripe",
      clientId,
      clientSecret,
      authUrl: STRIPE_AUTH_URL,
      tokenUrl: STRIPE_TOKEN_URL,
      scopes: stripeScopes,
      callbackUrl,
      state,
      // Stripe-specific: always prompt for consent
      extraAuthParams: {
        prompt: "consent",
      },
    });

    // Store pending flow for callback verification
    pendingFlows.set(slipId, {
      slipId,
      state,
      codeVerifier: pkceResponse.codeVerifier,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      authUrl: pkceResponse.authorizationUrl,
    });

    // Also store in database for API server callback handler access
    // (This will be done by the API server when it calls this provider)

    return {
      slip: {
        id: slipId,
        actor: request.actor,
        principal: request.principal,
        target: "stripe",
        granted_scope: request.requested_scope,
        issued_at: new Date(),
        expires_at: request.ttl
          ? new Date(Date.now() + request.ttl * 1000)
          : null,
        provisioning_method: "oauth",
        token_id: null,
        revocation_url: null,
        policy_result: {
          decision: "auto_approve",
          policy_id: "stripe-oauth",
          reason: "PKCE OAuth flow initiated",
        },
      },
      // Store PKCE state for callback (use deviceCodeInfo as generic oauth info container)
      deviceCodeInfo: {
        deviceCode: state,
        userCode: pkceResponse.codeVerifier,
        verificationUri: pkceResponse.authorizationUrl,
        expiresIn: 600, // 10 minutes
        interval: 0,
        expiresInAt: Date.now() + 10 * 60 * 1000,
      },
      instructions: `
Stripe OAuth Authorization Required

Visit the following link to authorize access:

${pkceResponse.authorizationUrl}

After authorizing, Stripe will redirect back to OBO and your access will be ready.
Requested scopes: ${stripeScopes.join(", ")}

This authorization will allow OBO to access your Stripe account with the requested permissions.
        `.trim(),
    };
  },

  /**
   * Validate a Stripe API key
   */
  async validate(credential: string, principal: string): Promise<boolean> {
    try {
      // Stripe API keys start with sk_live_ or sk_test_
      if (!credential.match(/^(sk_live|sk_test)_/)) {
        return false;
      }

      // Try to make a simple API call
      const response = await fetch(`${STRIPE_API_URL}/v1/charges`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${credential}`,
        },
      });

      // Stripe returns 401 for invalid keys, 200 for valid keys (even with no charges)
      return response.status === 200;
    } catch {
      return false;
    }
  },

  /**
   * Revoke a Stripe slip
   */
  async revoke(slip: import("@useobo/core").Slip): Promise<void> {
    // Stripe doesn't provide an API to revoke OAuth tokens
    // Users must revoke via their Stripe Dashboard
    console.error(`Stripe slip ${slip.id} revoked. OAuth token should be revoked manually at Stripe Dashboard.`);
  },
};

/**
 * Get pending PKCE flow info for callback
 */
export function getStripePendingFlow(slipId: string): { state: string; codeVerifier: string } | undefined {
  const flow = pendingFlows.get(slipId);
  if (!flow) return undefined;

  // Check if expired
  if (Date.now() > flow.expiresAt) {
    pendingFlows.delete(slipId);
    return undefined;
  }

  return {
    state: flow.state,
    codeVerifier: flow.codeVerifier,
  };
}

/**
 * Clean up pending flow after callback
 */
export function cleanupStripePendingFlow(slipId: string): void {
  pendingFlows.delete(slipId);
}

/**
 * Stripe scope mapping
 * OBO scopes -> Stripe OAuth scopes
 */
export const STRIPE_SCOPE_MAP: Record<string, string> = {
  "charges:read": "read_charges",
  "charges:write": "write_charges",
  "customers:read": "read_customers",
  "customers:write": "write_customers",
  "products:read": "read_products",
  "products:write": "write_products",
  "subscriptions:read": "read_subscription_items",
  "subscriptions:write": "write_subscription_items",
  "refunds:read": "read_refunds",
  "refunds:write": "write_refunds",
  "webhooks:read": "read_webhooks",
  "webhooks:write": "write_webhooks",
  // Convenience scopes
  "read": "read_only",
  "write": "read_write",
};

/**
 * Convert OBO scopes to Stripe OAuth scopes
 */
export function toStripeScopes(scopes: Scope): string[] {
  const stripeScopes = new Set<string>();

  for (const scope of scopes) {
    const mapped = STRIPE_SCOPE_MAP[scope];
    if (mapped) {
      stripeScopes.add(mapped);
    }
  }

  // If no scopes matched, use read_write as default
  if (stripeScopes.size === 0) {
    stripeScopes.add("read_write");
  }

  return Array.from(stripeScopes);
}
