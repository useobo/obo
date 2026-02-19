/**
 * Universal OAuth PKCE Callback Handler
 *
 * Handles OAuth callbacks for all PKCE-based providers.
 * Route: /callback/{service}
 *
 * Flow:
 * 1. Provider redirects here with ?code=xxx&state=yyy
 * 2. We look up the pending OAuth flow by state
 * 3. Exchange code for access token using stored verifier
 * 4. Store token and mark slip as ready
 * 5. Return success page to user
 */

import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb, schema, genId } from "@obo/db";
import { exchangeCodeForToken } from "@useobo/providers/shared/pkce";

// Provider-specific configurations
const PROVIDER_CONFIGS: Record<string, {
  tokenUrl: string;
  clientIdEnv: string;
  clientSecretEnv: string;
  scopesSeparator: string;
}> = {
  stripe: {
    tokenUrl: "https://connect.stripe.com/oauth/token",
    clientIdEnv: "STRIPE_CLIENT_ID",
    clientSecretEnv: "STRIPE_CLIENT_SECRET",
    scopesSeparator: " ",
  },
  atlassian: {
    tokenUrl: "https://auth.atlassian.com/oauth/token",
    clientIdEnv: "ATLASSIAN_CLIENT_ID",
    clientSecretEnv: "ATLASSIAN_CLIENT_SECRET",
    scopesSeparator: " ",
  },
  discord: {
    tokenUrl: "https://discord.com/api/oauth2/token",
    clientIdEnv: "DISCORD_CLIENT_ID",
    clientSecretEnv: "DISCORD_CLIENT_SECRET",
    scopesSeparator: " ",
  },
  spotify: {
    tokenUrl: "https://accounts.spotify.com/api/token",
    clientIdEnv: "SPOTIFY_CLIENT_ID",
    clientSecretEnv: "SPOTIFY_CLIENT_SECRET",
    scopesSeparator: " ",
  },
  slack: {
    tokenUrl: "https://slack.com/api/oauth.v2.access",
    clientIdEnv: "SLACK_CLIENT_ID",
    clientSecretEnv: "SLACK_CLIENT_SECRET",
    scopesSeparator: ",",
  },
  notion: {
    tokenUrl: "https://api.notion.com/v1/oauth/token",
    clientIdEnv: "NOTION_CLIENT_ID",
    clientSecretEnv: "NOTION_CLIENT_SECRET",
    scopesSeparator: ",",
  },
};

export const CallbackQuerySchema = z.object({
  code: z.string(),
  state: z.string(),
  error: z.string().optional(),
  error_description: z.string().optional(),
});

/**
 * Generate the callback URL for a given service
 */
export function getCallbackUrl(service: string, baseUrl: string = process.env.OBO_CALLBACK_URL || ""): string {
  if (baseUrl) {
    return `${baseUrl}/callback/${service}`;
  }
  // Default to using the current request's origin (set in the handler)
  return `/callback/${service}`;
}

/**
 * Handle OAuth callback
 */
export async function handleCallback(
  service: string,
  query: { code?: string; state?: string; error?: string; error_description?: string },
  originUrl: string
): Promise<{ success: boolean; message: string; slipId?: string }> {
  const db = getDb();

  // Check for error response from provider
  if (query.error) {
    return {
      success: false,
      message: `Authorization failed: ${query.error}${query.error_description ? ` - ${query.error_description}` : ""}`,
    };
  }

  // Validate required params
  if (!query.code || !query.state) {
    return {
      success: false,
      message: "Invalid callback: missing code or state parameter",
    };
  }

  // Look up pending OAuth flow
  // For PKCE flows (Discord, etc.), state is stored in deviceCode field
  // For GitHub device flow, device_code is the actual device code
  console.log('[Callback] Looking for pending flow with state:', query.state?.substring(0, 20) + '...');
  const [pendingFlow] = await db.select().from(schema.pendingOAuthFlows)
    .where(eq(schema.pendingOAuthFlows.deviceCode, query.state))
    .limit(1);

  console.log('[Callback] Pending flow found:', !!pendingFlow, pendingFlow ? {
    slipId: pendingFlow.slipId?.substring(0, 20) + '...',
    expiresAt: pendingFlow.expiresAt
  } : null);

  if (!pendingFlow) {
    // Debug: show what flows exist
    const allFlows = await db.select().from(schema.pendingOAuthFlows).limit(5);
    console.log('[Callback] No pending flow found. Existing flows:', allFlows.map(f => ({ slipId: f.slip_id?.substring(0, 20), deviceCode: f.device_code?.substring(0, 20) })));
    return {
      success: false,
      message: "Invalid or expired authorization state. Please try requesting access again.",
    };
  }

  // Check if expired
  if (new Date() > pendingFlow.expiresAt) {
    await db.delete(schema.pendingOAuthFlows)
      .where(eq(schema.pendingOAuthFlows.deviceCode, query.state));
    return {
      success: false,
      message: "Authorization has expired. Please try requesting access again.",
    };
  }

  // Get provider config
  const providerConfig = PROVIDER_CONFIGS[service];
  if (!providerConfig) {
    return {
      success: false,
      message: `Unknown provider: ${service}`,
    };
  }

  const clientId = process.env[providerConfig.clientIdEnv];
  const clientSecret = process.env[providerConfig.clientSecretEnv];

  if (!clientId) {
    return {
      success: false,
      message: `Provider not configured: missing ${providerConfig.clientIdEnv}`,
    };
  }

  try {
    // For PKCE flows (Discord, etc.), the codeVerifier is stored in userCode
    // For GitHub device flow, userCode is the actual user code
    const codeVerifier = service === 'github'
      ? '' // GitHub device flow doesn't use code verifier
      : (pendingFlow.userCode || '');

    console.log('[Callback] Using codeVerifier from userCode:', codeVerifier ? codeVerifier.substring(0, 10) + '...' : 'none');

    // Exchange code for token
    const tokenResponse = await exchangeCodeForToken({
      tokenUrl: providerConfig.tokenUrl,
      code: query.code,
      codeVerifier,
      clientId,
      clientSecret,
      callbackUrl: `${originUrl}/callback/${service}`,
    });

    // Get the slip for this flow
    const [slip] = await db.select().from(schema.slips)
      .where(eq(schema.slips.id, pendingFlow.slipId))
      .limit(1);

    if (!slip) {
      throw new Error("Slip not found");
    }

    // Determine token type based on provider
    const tokenType = service === 'stripe' ? 'api_key' : 'oauth_access_token';

    // Create or update token
    const tokenId = `${service}_token_${Date.now()}`;

    const { encrypt, isEncrypted } = await import("@useobo/crypto");
    const encryptAtRest = process.env.OBO_ENCRYPT_AT_REST !== 'false';
    let storedSecret = tokenResponse.access_token;
    if (encryptAtRest && !isEncrypted(storedSecret)) {
      storedSecret = encrypt(storedSecret);
    }

    // Delete any existing token for this slip
    if (slip.tokenId) {
      await db.delete(schema.tokens)
        .where(eq(schema.tokens.id, slip.tokenId));
    }

    // Insert new token
    await db.insert(schema.tokens).values({
      id: tokenId,
      slipId: pendingFlow.slipId,
      type: tokenType,
      secret: storedSecret,
      reference: tokenResponse.access_token.substring(0, 20) + "...",
      metadata: {
        token_type: tokenResponse.token_type,
        scope: tokenResponse.scope,
        refresh_token: tokenResponse.refresh_token,
        expires_in: tokenResponse.expires_in?.toString(),
        encrypted: encryptAtRest,
        provider: service,
      },
      expiresAt: slip.expiresAt,
    });

    // Update slip with token reference
    await db.update(schema.slips)
      .set({ tokenId })
      .where(eq(schema.slips.id, pendingFlow.slipId));

    // Clean up pending flow
    await db.delete(schema.pendingOAuthFlows)
      .where(eq(schema.pendingOAuthFlows.deviceCode, query.state));

    // Log the completion
    await db.insert(schema.auditLog).values({
      id: genId(),
      action: "oauth_completed",
      slipId: pendingFlow.slipId,
      details: { tokenId, provider: service },
    });

    return {
      success: true,
      message: `Successfully authorized ${service}! You can return to your agent.`,
      slipId: pendingFlow.slipId,
    };
  } catch (error) {
    console.error(`OAuth callback error for ${service}:`, error);

    // Clean up pending flow on error
    await db.delete(schema.pendingOAuthFlows)
      .where(eq(schema.pendingOAuthFlows.deviceCode, query.state));

    return {
      success: false,
      message: `Failed to complete authorization: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Generate HTML response for callback page
 */
export function generateCallbackHtml(result: { success: boolean; message: string }): string {
  const bgColor = result.success ? 'bg-emerald-50' : 'bg-red-50';
  const textColor = result.success ? 'text-emerald-900' : 'text-red-900';
  const icon = result.success ? '✓' : '✕';
  const title = result.success ? 'Authorization Successful' : 'Authorization Failed';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen ${bgColor} flex items-center justify-center p-4">
  <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
    <div class="w-16 h-16 ${result.success ? 'bg-emerald-100' : 'bg-red-100'} rounded-full flex items-center justify-center mx-auto mb-4">
      <span class="text-3xl ${textColor}">${icon}</span>
    </div>
    <h1 class="text-xl font-semibold ${textColor} mb-2">${title}</h1>
    <p class="text-gray-600 mb-6">${result.message}</p>
    <p class="text-sm text-gray-500">You can close this window and return to your agent.</p>
  </div>
</body>
</html>`;
}
