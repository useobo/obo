/**
 * Strava Provider
 *
 * Supports OAuth device flow for native credential provisioning.
 *
 * OAuth Device Flow:
 * 1. Request device code
 * 2. Show user code + verification URL
 * 3. Poll for access token
 * 4. Return token to actor
 *
 * Note: Strava returns expires_at (timestamp) not expires_in (seconds)
 */

import type { Provider, SlipRequest, SlipResponse, Token, Scope } from "@useobo/core";

const STRAVA_DEVICE_CODE_URL = "https://www.strava.com/oauth/device/authorize";
const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";
const STRAVA_API_URL = "https://www.strava.com/api/v3";

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
  refresh_token: string;
  expires_at: number; // Strava returns timestamp, not seconds
  athlete: Record<string, unknown>;
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

export const StravaProvider: Provider = {
  name: "strava",
  description: "Strava - Fitness tracking and social network for athletes",
  tags: ["fitness", "sports", "running", "cycling", "activities"],

  supports: {
    oauth: true,
    genesis: false,
    byoc: false,
    rogue: false,
  },

  /**
   * Provision Strava access via OAuth device flow
   */
  async provision(request: SlipRequest): Promise<SlipResponse> {
    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error(
        "STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET environment variables are required. " +
        "Create a Strava application at https://www.strava.com/settings/api"
      );
    }

    // Convert OBO scopes to Strava OAuth scopes
    const stravaScopes = toStravaScopes(request.requested_scope);

    // Step 1: Request device code
    const deviceCodeResponse = await requestDeviceCode(clientId, stravaScopes);

    const slipId = `slip_strava_${Date.now()}`;

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
        target: "strava",
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
          policy_id: "strava-oauth",
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
Strava OAuth Device Flow:

1. Visit: ${deviceCodeResponse.verification_uri}
2. Enter code: ${deviceCodeResponse.user_code}
3. Authorize access for ${request.principal}

Requested scopes: ${stravaScopes.join(", ")}

After authorizing, use complete_oauth_flow with your slip ID to get the token.
      `.trim(),
    };
  },

  /**
   * Validate a Strava OAuth token
   */
  async validate(credential: string, principal: string): Promise<boolean> {
    try {
      const response = await fetch(`${STRAVA_API_URL}/athlete`, {
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
   * Revoke a Strava slip
   */
  async revoke(slip: import("@useobo/core").Slip): Promise<void> {
    // Strava doesn't provide a direct API to revoke OAuth tokens
    // Users must revoke via their Strava settings
    console.error(`Strava slip ${slip.id} revoked. Token should be revoked manually at Strava settings.`);
  },
};

/**
 * Complete OAuth flow by polling for the access token
 */
export async function completeStravaOAuth(slipId: string): Promise<Token> {
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

    // Calculate expires_in from expires_at (timestamp)
    const expiresIn = tokenResponse.expires_at ? tokenResponse.expires_at - Math.floor(Date.now() / 1000) : undefined;

    return {
      id: `strava_token_${Date.now()}`,
      slip_id: "",
      type: "oauth_access_token",
      secret: tokenResponse.access_token,
      reference: tokenResponse.access_token.substring(0, 15) + "...",
      metadata: {
        token_type: tokenResponse.token_type,
        scope: tokenResponse.scope,
        refresh_token: tokenResponse.refresh_token,
        expires_at: tokenResponse.expires_at?.toString(),
        expires_in: expiresIn?.toString(),
      },
    };
  } catch (error) {
    pendingDeviceCodes.delete(slipId);
    throw error;
  }
}

/**
 * Request a device code from Strava
 */
async function requestDeviceCode(
  clientId: string,
  scopes: string[]
): Promise<DeviceCodeResponse> {
  const params = new URLSearchParams({
    client_id: clientId,
    scope: scopes.join(","),
  });

  const response = await fetch(STRAVA_DEVICE_CODE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
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
 * Poll for access token from Strava
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
      code: deviceCode,
      grant_type: "urn:ietf:params:oauth:grant-type:device_code",
    });

    const response = await fetch(STRAVA_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
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
 * Strava scope mapping
 * OBO scopes -> Strava OAuth scopes
 */
export const STRAVA_SCOPE_MAP: Record<string, string> = {
  "activities:read": "read:activity",
  "activities:write": "write:activity",
  "profile:read": "profile:read_all",
  "profile:write": "profile:write",
  "routes:read": "read:routes",
  "routes:write": "write:routes",
  "segments:read": "read:segment",
};

/**
 * Convert OBO scopes to Strava OAuth scopes
 */
export function toStravaScopes(scopes: Scope): string[] {
  const stravaScopes = new Set<string>();

  for (const scope of scopes) {
    const mapped = STRAVA_SCOPE_MAP[scope];
    if (mapped) {
      stravaScopes.add(mapped);
    }
  }

  return Array.from(stravaScopes);
}
