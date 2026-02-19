/**
 * Shared OAuth Device Flow Utilities
 *
 * Reusable OAuth device flow implementation for providers that support
 * the RFC 8628 OAuth 2.0 Device Authorization Grant.
 */

export interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

export interface DeviceTokenResponse {
  access_token: string;
  token_type?: string;
  scope?: string;
  refresh_token?: string;
  expires_in?: number;
  expires_at?: number; // For providers like Strava that return timestamp
}

export interface DeviceTokenErrorResponse {
  error: string;
  error_description?: string;
}

/**
 * Request a device code from the OAuth provider
 */
export async function requestDeviceCode(
  deviceCodeUrl: string,
  clientId: string,
  scopes: string[]
): Promise<DeviceCodeResponse> {
  const params = new URLSearchParams({
    client_id: clientId,
    scope: scopes.join(" "),
  });

  const response = await fetch(deviceCodeUrl, {
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
 * Poll for access token from the OAuth provider
 */
export async function pollForAccessToken(
  tokenUrl: string,
  clientId: string,
  clientSecret: string,
  deviceCode: string,
  interval: number,
  maxAttempts = 60,
  extraParams: Record<string, string> = {}
): Promise<DeviceTokenResponse> {
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(interval * 1000);

    const params = new URLSearchParams({
      client_id: clientId,
      device_code: deviceCode,
      grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      ...extraParams,
    });

    // Add client_secret if provided (some providers require it in POST body)
    if (clientSecret) {
      params.append("client_secret", clientSecret);
    }

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: params,
    });

    if (!response.ok) {
      throw new Error(`Token request failed: ${response.status}`);
    }

    const data = (await response.json()) as DeviceTokenResponse | DeviceTokenErrorResponse;

    if ("access_token" in data) {
      return data;
    }

    if (data.error === "authorization_pending") {
      continue;
    }

    if (data.error === "slow_down") {
      await sleep(interval * 1000);
      continue;
    }

    throw new Error(`Token error: ${data.error}${data.error_description ? ` - ${data.error_description}` : ""}`);
  }

  throw new Error("Authorization timed out. Please try again.");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
