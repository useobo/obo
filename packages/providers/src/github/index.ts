/**
 * GitHub Provider
 *
 * Supports OAuth device flow for native credential provisioning.
 *
 * OAuth Device Flow:
 * 1. Request device code
 * 2. Show user code + verification URL
 * 3. Poll for access token
 * 4. Return token to actor
 */

import type { Provider, SlipRequest, SlipResponse, Scope, Token } from "@obo/core";

const GITHUB_DEVICE_CODE_URL = "https://github.com/login/device/code";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";

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
  scope: string;
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

export const GitHubProvider: Provider = {
  name: "github",
  description: "GitHub - Git hosting and code collaboration",
  tags: ["git", "hosting", "code", "repos", "ci"],

  supports: {
    oauth: true,
    genesis: true,
    byoc: true,
    rogue: false,
  },

  /**
   * Provision GitHub access via OAuth device flow or BYOC
   */
  async provision(request: SlipRequest): Promise<SlipResponse> {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    // Check if user provided a GitHub token directly (BYOC mode)
    const byocToken = request.reason?.match(/github_pat_[a-zA-Z0-9_]{36,}/)?.[0] 
      || request.reason?.match(/ghp_[a-zA-Z0-9]{36,}/)?.[0];

    if (byocToken) {
      // BYOC mode - validate and use the provided token
      const isValid = await this.validate(byocToken, request.principal);
      if (!isValid) {
        throw new Error("The provided GitHub token is invalid. Please check and try again.");
      }

      const slipId = `slip_github_byoc_${Date.now()}`;
      return {
        slip: {
          id: slipId,
          actor: request.actor,
          principal: request.principal,
          target: "github",
          granted_scope: request.requested_scope,
          issued_at: new Date(),
          expires_at: request.ttl
            ? new Date(Date.now() + request.ttl * 1000)
            : null,
          provisioning_method: "byoc",
          token_id: `gh_token_${Date.now()}`,
          revocation_url: null,
          policy_result: {
            decision: "auto_approve",
            policy_id: "github-byoc",
            reason: "Using user-provided token (BYOC)",
          },
        },
        token: {
          id: `gh_token_${Date.now()}`,
          slip_id: slipId,
          type: "oauth_access_token",
          secret: byocToken,
          reference: byocToken.substring(0, 20) + "...",
          metadata: {
            source: "byoc",
          },
        },
      };
    }

    // OAuth device flow
    if (!clientId || !clientSecret) {
      throw new Error(
        "GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables are required for OAuth flow. " +
        "Alternatively, provide a GitHub Personal Access Token in the 'reason' field. " +
        "Create a GitHub OAuth App at https://github.com/settings/developers"
      );
    }

    // Convert OBO scopes to GitHub OAuth scopes
    const githubScopes = toGitHubScopes(request.requested_scope);

    // Step 1: Request device code
    const deviceCodeResponse = await requestDeviceCode(clientId, githubScopes);

    const slipId = `slip_github_${Date.now()}`;

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
        target: "github",
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
          policy_id: "github-oauth",
          reason: "OAuth device flow initiated",
        },
      },
      // Return device code info for the caller to store
      deviceCodeInfo: {
        deviceCode: deviceCodeResponse.device_code,
        userCode: deviceCodeResponse.user_code,
        verificationUri: deviceCodeResponse.verification_uri,
        expiresIn: deviceCodeResponse.expires_in,
        interval: deviceCodeResponse.interval,
        expiresInAt: Date.now() + deviceCodeResponse.expires_in * 1000,
      },
      instructions: `
GitHub OAuth Device Flow:

1. Visit: ${deviceCodeResponse.verification_uri}
2. Enter code: ${deviceCodeResponse.user_code}
3. Authorize access for ${request.principal}

Requested scopes: ${githubScopes.join(", ")}

After authorizing, use complete_oauth_flow with your slip ID to get the token.
      `.trim(),
    };
  },

  /**
   * Validate a GitHub personal access token
   */
  async validate(credential: string, principal: string): Promise<boolean> {
    try {
      const response = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${credential}`,
          Accept: "application/vnd.github+json",
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  /**
   * Revoke a GitHub slip
   */
  async revoke(slip: import("@obo/core").Slip): Promise<void> {
    // GitHub doesn't provide a direct API to revoke OAuth tokens
    // Users must revoke via their GitHub settings
    console.error(`GitHub slip ${slip.id} revoked. Token should be revoked manually at GitHub settings.`);
  },
};

/**
 * Complete OAuth flow by polling for the access token
 * Call this after the user has authorized the device
 */
export async function completeOAuthFlow(slipId: string): Promise<Token> {
  const pending = pendingDeviceCodes.get(slipId);

  if (!pending) {
    throw new Error(`No pending OAuth flow found for slip ${slipId}. It may have expired.`);
  }

  if (Date.now() > pending.expiresAt) {
    pendingDeviceCodes.delete(slipId);
    throw new Error("OAuth flow has expired. Please request a new slip.");
  }

  try {
    const token = await pollForAccessToken(
      pending.clientId,
      pending.clientSecret,
      pending.deviceCode,
      pending.interval
    );

    // Clean up
    pendingDeviceCodes.delete(slipId);

    return token;
  } catch (error) {
    pendingDeviceCodes.delete(slipId);
    throw error;
  }
}

/**
 * Request a device code from GitHub
 */
async function requestDeviceCode(
  clientId: string,
  scopes: string[]
): Promise<DeviceCodeResponse> {
  const params = new URLSearchParams({
    client_id: clientId,
    scope: scopes.join(" "),
  });

  const response = await fetch(GITHUB_DEVICE_CODE_URL, {
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
 * Poll for access token
 */
async function pollForAccessToken(
  clientId: string,
  clientSecret: string,
  deviceCode: string,
  interval: number,
  maxAttempts = 60
): Promise<Token> {
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(interval * 1000);

    const params = new URLSearchParams({
      client_id: clientId,
      device_code: deviceCode,
      grant_type: "urn:ietf:params:oauth:grant-type:device_code",
    });

    const response = await fetch(GITHUB_TOKEN_URL, {
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
      return {
        id: `gh_token_${Date.now()}`,
        slip_id: "",
        type: "oauth_access_token",
        secret: data.access_token,
        reference: data.access_token.substring(0, 20) + "...",
        metadata: {
          token_type: data.token_type,
          scope: data.scope,
        },
      };
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
 * GitHub scope mapping
 */
export const GITHUB_SCOPE_MAP: Record<string, string> = {
  "repos:read": "repo",
  "repos:write": "repo",
  "repos:create": "public_repo",
  "repos:delete": "delete_repo",
  "user:read": "read:user",
  "user:email": "user:email",
  "admin:org": "admin:org",
  "admin:org:read": "admin:org:read",
  "admin:org:write": "admin:org:write",
};

/**
 * Convert OBO scopes to GitHub OAuth scopes
 */
export function toGitHubScopes(scopes: Scope): string[] {
  const githubScopes = new Set<string>();

  for (const scope of scopes) {
    const mapped = GITHUB_SCOPE_MAP[scope];
    if (mapped) {
      githubScopes.add(mapped);
    }
  }

  return Array.from(githubScopes);
}
