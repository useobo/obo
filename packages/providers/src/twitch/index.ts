/**
 * Twitch Provider
 *
 * Supports OAuth device flow for native credential provisioning.
 *
 * OAuth Device Flow:
 * 1. Request device code
 * 2. Show user code + verification URL
 * 3. Poll for access token
 * 4. Return token to actor
 */

import type { Provider, SlipRequest, SlipResponse, Token, Scope } from "@useobo/core";

const TWITCH_DEVICE_CODE_URL = "https://id.twitch.tv/oauth2/device";
const TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const TWITCH_API_URL = "https://api.twitch.tv/helix";

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
  refresh_token?: string;
  expires_in: number;
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

export const TwitchProvider: Provider = {
  name: "twitch",
  description: "Twitch - Live streaming and chat platform",
  tags: ["streaming", "gaming", "chat", "live"],

  supports: {
    oauth: true,
    genesis: false,
    byoc: false,
    rogue: false,
  },

  /**
   * Provision Twitch access via OAuth device flow
   */
  async provision(request: SlipRequest): Promise<SlipResponse> {
    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error(
        "TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET environment variables are required. " +
        "Create a Twitch application at https://dev.twitch.tv/console"
      );
    }

    // Convert OBO scopes to Twitch OAuth scopes
    const twitchScopes = toTwitchScopes(request.requested_scope);

    // Step 1: Request device code
    const deviceCodeResponse = await requestDeviceCode(clientId, twitchScopes);

    const slipId = `slip_twitch_${Date.now()}`;

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
        target: "twitch",
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
          policy_id: "twitch-oauth",
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
Twitch OAuth Device Flow:

1. Visit: ${deviceCodeResponse.verification_uri}
2. Enter code: ${deviceCodeResponse.user_code}
3. Authorize access for ${request.principal}

Requested scopes: ${twitchScopes.join(", ")}

After authorizing, use complete_oauth_flow with your slip ID to get the token.
      `.trim(),
    };
  },

  /**
   * Validate a Twitch OAuth token
   */
  async validate(credential: string, principal: string): Promise<boolean> {
    try {
      const clientId = process.env.TWITCH_CLIENT_ID;
      if (!clientId) {
        return false;
      }

      const response = await fetch(`${TWITCH_API_URL}/users`, {
        headers: {
          "Client-ID": clientId,
          Authorization: `Bearer ${credential}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  /**
   * Revoke a Twitch slip
   */
  async revoke(slip: import("@useobo/core").Slip): Promise<void> {
    // Twitch supports token revocation via their API
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;
    if (slip.token_id && clientSecret) {
      try {
        // In a full implementation, we'd store the token and revoke it here
        console.error(`Twitch slip ${slip.id} revoked. Token should be revoked manually at https://www.twitch.tv/settings/connections`);
      } catch {
        // Ignore revocation errors
      }
    }
  },
};

/**
 * Complete OAuth flow by polling for the access token
 */
export async function completeTwitchOAuth(slipId: string): Promise<Token> {
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
      id: `twitch_token_${Date.now()}`,
      slip_id: "",
      type: "oauth_access_token",
      secret: tokenResponse.access_token,
      reference: tokenResponse.access_token.substring(0, 15) + "...",
      metadata: {
        token_type: tokenResponse.token_type,
        scope: tokenResponse.scope,
        refresh_token: tokenResponse.refresh_token,
        expires_in: tokenResponse.expires_in?.toString(),
      },
    };
  } catch (error) {
    pendingDeviceCodes.delete(slipId);
    throw error;
  }
}

/**
 * Request a device code from Twitch
 */
async function requestDeviceCode(
  clientId: string,
  scopes: string[]
): Promise<DeviceCodeResponse> {
  const params = new URLSearchParams({
    client_id: clientId,
    scopes: scopes.join(" "),
  });

  const response = await fetch(TWITCH_DEVICE_CODE_URL, {
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
 * Poll for access token from Twitch
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

    const response = await fetch(TWITCH_TOKEN_URL, {
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
 * Twitch scope mapping
 * OBO scopes -> Twitch OAuth scopes
 */
export const TWITCH_SCOPE_MAP: Record<string, string> = {
  "channel:read": "channel:read:subscriptions",
  "channel:write": "channel:edit",
  "chat:read": "chat:read",
  "chat:write": "chat:edit",
  "whispers:read": "whispers:read",
  "whispers:write": "whispers:edit",
  "moderator:read": "moderation:read",
  "moderator:write": "moderation:manage",
  "followers:read": "channel:read:subscriptions",
  "stream:read": "channel:read:stream",
};

/**
 * Convert OBO scopes to Twitch OAuth scopes
 */
export function toTwitchScopes(scopes: Scope): string[] {
  const twitchScopes = new Set<string>();

  for (const scope of scopes) {
    const mapped = TWITCH_SCOPE_MAP[scope];
    if (mapped) {
      twitchScopes.add(mapped);
    }
  }

  return Array.from(twitchScopes);
}
