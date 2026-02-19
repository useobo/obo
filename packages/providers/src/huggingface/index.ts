/**
 * Hugging Face Provider
 *
 * Supports OAuth device flow for native credential provisioning.
 * Also supports BYOC (Bring Your Own Credential) with HF API tokens.
 *
 * OAuth Device Flow:
 * 1. Request device code
 * 2. Show user code + verification URL
 * 3. Poll for access token
 * 4. Return token to actor
 *
 * BYOC Mode:
 * Paste a HF token (starts with hf_) in the reason field
 */

import type { Provider, SlipRequest, SlipResponse, Token, Scope } from "@useobo/core";

const HF_DEVICE_CODE_URL = "https://huggingface.co/oauth/authorize/device";
const HF_TOKEN_URL = "https://huggingface.co/oauth/token";
const HF_API_URL = "https://huggingface.co/api";

interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

interface TokenErrorResponse {
  error: string;
  error_description?: string;
}

// Store pending device codes for polling
const pendingDeviceCodes = new Map<string, {
  deviceCode: string;
  clientId: string;
  clientSecret: string;
  interval: number;
  expiresAt: number;
}>();

export const HuggingFaceProvider: Provider = {
  name: "huggingface",
  description: "Hugging Face - ML models, datasets, and AI platform",
  tags: ["ai", "ml", "models", "datasets", "inference"],

  supports: {
    oauth: true,
    genesis: false,
    byoc: true,
    rogue: false,
  },

  /**
   * Provision Hugging Face access via OAuth device flow or BYOC
   */
  async provision(request: SlipRequest): Promise<SlipResponse> {
    const clientId = process.env.HUGGINGFACE_CLIENT_ID;
    const clientSecret = process.env.HUGGINGFACE_CLIENT_SECRET;

    // Check if user provided an HF token directly (BYOC mode)
    const byocToken = request.reason?.match(/hf_[a-zA-Z0-9]{34,}/)?.[0];

    if (byocToken) {
      // BYOC mode - validate and use the provided token
      const isValid = await this.validate(byocToken, request.principal);
      if (!isValid) {
        throw new Error("The provided Hugging Face token is invalid. Please check and try again.");
      }

      const slipId = `slip_hf_byoc_${Date.now()}`;
      return {
        slip: {
          id: slipId,
          actor: request.actor,
          principal: request.principal,
          target: "huggingface",
          granted_scope: request.requested_scope,
          issued_at: new Date(),
          expires_at: request.ttl
            ? new Date(Date.now() + request.ttl * 1000)
            : null,
          provisioning_method: "byoc",
          token_id: `hf_token_${Date.now()}`,
          revocation_url: null,
          policy_result: {
            decision: "auto_approve",
            policy_id: "huggingface-byoc",
            reason: "Using user-provided token (BYOC)",
          },
        },
        token: {
          id: `hf_token_${Date.now()}`,
          slip_id: slipId,
          type: "bearer_token",
          secret: byocToken,
          reference: byocToken.substring(0, 12) + "...",
          metadata: {
            source: "byoc",
          },
        },
      };
    }

    // OAuth device flow
    if (!clientId || !clientSecret) {
      throw new Error(
        "HUGGINGFACE_CLIENT_ID and HUGGINGFACE_CLIENT_SECRET environment variables are required for OAuth flow. " +
        "Alternatively, provide a Hugging Face access token in the 'reason' field. " +
        "Create a HF OAuth App at https://huggingface.co/settings/connected-applications"
      );
    }

    // Convert OBO scopes to HF OAuth scopes
    const hfScopes = toHFScopes(request.requested_scope);

    // Step 1: Request device code
    const deviceCodeResponse = await requestDeviceCode(clientId, hfScopes);

    const slipId = `slip_hf_${Date.now()}`;

    // Store device code for later polling
    pendingDeviceCodes.set(slipId, {
      deviceCode: deviceCodeResponse.device_code,
      clientId,
      clientSecret,
      interval: deviceCodeResponse.interval,
      expiresAt: Date.now() + deviceCodeResponse.expires_in * 1000,
    });

    // Step 2: Return instructions to user
    return {
      slip: {
        id: slipId,
        actor: request.actor,
        principal: request.principal,
        target: "huggingface",
        granted_scope: request.requested_scope,
        issued_at: new Date(),
        expires_at: request.ttl
          ? new Date(Date.now() + request.ttl * 1000)
          : new Date(Date.now() + deviceCodeResponse.expires_in * 1000),
        provisioning_method: "oauth",
        token_id: null,
        revocation_url: null,
        policy_result: {
          decision: "auto_approve",
          policy_id: "huggingface-oauth",
          reason: "OAuth device flow initiated",
        },
      },
      deviceCodeInfo: {
        deviceCode: deviceCodeResponse.device_code,
        userCode: deviceCodeResponse.user_code,
        verificationUri: deviceCodeResponse.verification_uri,
        expiresIn: deviceCodeResponse.expires_in,
        interval: deviceCodeResponse.interval,
        expiresInAt: Date.now() + deviceCodeResponse.expires_in * 1000,
      },
      instructions: `
Hugging Face OAuth Device Flow:

1. Visit: ${deviceCodeResponse.verification_uri}
2. Enter code: ${deviceCodeResponse.user_code}
3. Authorize access for ${request.principal}

Requested scopes: ${hfScopes.join(", ")}

After authorizing, use complete_oauth_flow with your slip ID to get the token.
      `.trim(),
    };
  },

  /**
   * Validate a Hugging Face API token
   */
  async validate(credential: string, principal: string): Promise<boolean> {
    try {
      const response = await fetch(`${HF_API_URL}/whoami-v2`, {
        headers: {
          Authorization: `Bearer ${credential}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  /**
   * Revoke a Hugging Face slip
   */
  async revoke(slip: import("@useobo/core").Slip): Promise<void> {
    // Hugging Face doesn't provide a direct API to revoke OAuth tokens
    // Users must revoke via their HF settings
    console.error(`Hugging Face slip ${slip.id} revoked. Token should be revoked manually at Hugging Face settings.`);
  },
};

/**
 * Complete OAuth flow by polling for the access token
 */
export async function completeHuggingFaceOAuth(slipId: string): Promise<Token> {
  const pending = pendingDeviceCodes.get(slipId);

  if (!pending) {
    throw new Error(`No pending OAuth flow found for slip ${slipId}. It may have expired.`);
  }

  if (Date.now() > pending.expiresAt) {
    pendingDeviceCodes.delete(slipId);
    throw new Error("OAuth flow has expired. Please request a new slip.");
  }

  try {
    const tokenResponse = await pollForAccessToken(
      pending.clientId,
      pending.clientSecret,
      pending.deviceCode,
      pending.interval
    );

    // Clean up
    pendingDeviceCodes.delete(slipId);

    return {
      id: `hf_token_${Date.now()}`,
      slip_id: "",
      type: "bearer_token",
      secret: tokenResponse.access_token,
      reference: tokenResponse.access_token.substring(0, 12) + "...",
      metadata: {
        token_type: tokenResponse.token_type,
        scope: tokenResponse.scope,
        expires_in: tokenResponse.expires_in?.toString(),
      },
    };
  } catch (error) {
    pendingDeviceCodes.delete(slipId);
    throw error;
  }
}

/**
 * Request a device code from Hugging Face
 */
async function requestDeviceCode(
  clientId: string,
  scopes: string[]
): Promise<DeviceCodeResponse> {
  const params = new URLSearchParams({
    client_id: clientId,
    scope: scopes.join(" "),
  });

  const response = await fetch(HF_DEVICE_CODE_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
    body: params,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to request device code: ${response.status} ${text}`);
  }

  return response.json();
}

/**
 * Poll for access token from Hugging Face
 */
async function pollForAccessToken(
  clientId: string,
  clientSecret: string,
  deviceCode: string,
  interval: number,
  maxAttempts = 60
): Promise<TokenResponse> {
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(interval * 1000);

    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      device_code: deviceCode,
      grant_type: "urn:ietf:params:oauth:grant-type:device_code",
    });

    const response = await fetch(HF_TOKEN_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: params,
    });

    if (!response.ok) {
      throw new Error(`Token request failed: ${response.status}`);
    }

    const data = (await response.json()) as TokenResponse | TokenErrorResponse;

    if ("access_token" in data) {
      return data;
    }

    if (data.error === "authorization_pending") {
      continue;
    }

    if (data.error === "slow_down") {
      interval *= 2;
      continue;
    }

    throw new Error(`Token error: ${data.error}${data.error_description ? ` - ${data.error_description}` : ""}`);
  }

  throw new Error("Authorization timed out. Please try again.");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Hugging Face scope mapping
 * OBO scopes -> HF OAuth scopes
 */
export const HF_SCOPE_MAP: Record<string, string> = {
  "repos:read": "repo-read",
  "repos:write": "repo-write",
  "inference:read": "inference-read",
  "inference:manage": "inference-manage",
  "models:read": "model-read",
  "models:write": "model-write",
  "datasets:read": "dataset-read",
  "datasets:write": "dataset-write",
  "spaces:read": "space-read",
  "spaces:write": "space-write",
};

/**
 * Convert OBO scopes to Hugging Face OAuth scopes
 */
export function toHFScopes(scopes: Scope): string[] {
  const hfScopes = new Set<string>();

  for (const scope of scopes) {
    const mapped = HF_SCOPE_MAP[scope];
    if (mapped) {
      hfScopes.add(mapped);
    }
  }

  return Array.from(hfScopes);
}
