/**
 * Discord Provider
 *
 * Supports PKCE OAuth flow for Discord authorization.
 *
 * PKCE Flow:
 * 1. Generate code_verifier and code_challenge
 * 2. Redirect user to Discord authorization URL
 * 3. User authorizes, Discord redirects to callback
 * 4. Exchange code + verifier for access token
 *
 * Environment:
 * - DISCORD_CLIENT_ID: OAuth client ID
 * - DISCORD_CLIENT_SECRET: OAuth client secret
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

const DISCORD_AUTH_URL = "https://discord.com/oauth2/authorize";
const DISCORD_TOKEN_URL = "https://discord.com/api/oauth2/token";
const DISCORD_API_URL = "https://discord.com/api";

// Store pending PKCE flows for each slip
const pendingFlows = new Map<string, {
  slipId: string;
  state: string;
  codeVerifier: string;
  expiresAt: number;
  authUrl: string;
}>();

export const DiscordProvider: Provider = {
  name: "discord",
  description: "Discord - Chat, communities, and gaming platform",
  tags: ["chat", "gaming", "community", "bot"],

  supports: {
    oauth: true, // PKCE OAuth flow
    genesis: false,
    byoc: true,  // Bot tokens
    rogue: false,
  },

  /**
   * Provision Discord access via PKCE OAuth or BYOC
   */
  async provision(request: SlipRequest): Promise<SlipResponse> {
    const clientId = process.env.DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;

    // Check if user provided a Discord bot token directly (BYOC mode)
    const byocToken = request.reason?.match(/[MN][A-Za-z\d]{23}\.[\w-]{6}\.[\w-]{27}/)?.[0];

    if (byocToken) {
      // BYOC mode - validate and use the provided token
      const isValid = await this.validate(byocToken, request.principal);
      if (!isValid) {
        throw new Error("The provided Discord token is invalid. Please check and try again.");
      }

      const slipId = `slip_discord_byoc_${Date.now()}`;

      // Determine if bot or bearer token
      const isBotToken = byocToken.startsWith("M") || byocToken.startsWith("N");

      return {
        slip: {
          id: slipId,
          actor: request.actor,
          principal: request.principal,
          target: "discord",
          granted_scope: request.requested_scope,
          issued_at: new Date(),
          expires_at: request.ttl
            ? new Date(Date.now() + request.ttl * 1000)
            : null,
          provisioning_method: "byoc",
          token_id: `discord_token_${Date.now()}`,
          revocation_url: null,
          policy_result: {
            decision: "auto_approve",
            policy_id: "discord-byoc",
            reason: `Using user-provided ${isBotToken ? "bot" : "bearer"} token (BYOC)`,
          },
        },
        token: {
          id: `discord_token_${Date.now()}`,
          slip_id: slipId,
          type: "oauth_access_token",
          secret: byocToken,
          reference: byocToken.substring(0, 15) + "...",
          metadata: {
            source: "byoc",
            token_type: isBotToken ? "bot" : "bearer",
          },
        },
        instructions: `
Discord Token Provisioned

Token Type: ${isBotToken ? "Bot" : "Bearer"}
Token Reference: ${byocToken.substring(0, 15)}...
Requested scopes: ${request.requested_scope.join(", ")}

This token can be used with the Discord API:

  curl https://discord.com/api/v10/users/@me \\
    -H "Authorization: Bearer ${byocToken}"

Note: Discord tokens have access based on the scopes they were created with.
Use caution when sharing. Revoke in Discord Developer Portal when done.
        `.trim(),
      };
    }

    // PKCE OAuth flow
    if (!clientId || !clientSecret) {
      throw new Error(
        "DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET environment variables are required for OAuth flow. " +
        "Alternatively, provide a Discord bot token in the 'reason' field. " +
        "Create a Discord application at https://discord.com/developers/applications"
      );
    }

    // Build callback URL
    const callbackBaseUrl = process.env.OBO_CALLBACK_URL || "";
    // Remove trailing slash and append callback/discord if not already present
    const baseUrl = callbackBaseUrl.endsWith('/') ? callbackBaseUrl.slice(0, -1) : callbackBaseUrl;
    const callbackUrl = baseUrl.includes('/callback') ? `${baseUrl}/discord` : `${baseUrl}/callback/discord`;

    console.log('[Discord Provider] OBO_CALLBACK_URL:', callbackBaseUrl);
    console.log('[Discord Provider] Final callbackUrl:', callbackUrl);

    // Convert OBO scopes to Discord OAuth scopes
    const discordScopes = toDiscordScopes(request.requested_scope);
    console.log('[Discord Provider] Requested scopes:', request.requested_scope);
    console.log('[Discord Provider] Mapped Discord scopes:', discordScopes);

    // Generate PKCE state and verifier
    const state = generateState();
    const slipId = `slip_discord_${Date.now()}`;

    // Start PKCE flow
    const pkceResponse: PKCEStartResponse = startPKCEFlow({
      service: "discord",
      clientId,
      clientSecret,
      authUrl: DISCORD_AUTH_URL,
      tokenUrl: DISCORD_TOKEN_URL,
      scopes: discordScopes,
      callbackUrl,
      state,
    });

    // Store pending flow for callback verification
    pendingFlows.set(slipId, {
      slipId,
      state,
      codeVerifier: pkceResponse.codeVerifier,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      authUrl: pkceResponse.authorizationUrl,
    });

    return {
      slip: {
        id: slipId,
        actor: request.actor,
        principal: request.principal,
        target: "discord",
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
          policy_id: "discord-oauth",
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
Discord OAuth Authorization Required

Visit the following link to authorize access:

${pkceResponse.authorizationUrl}

After authorizing, Discord will redirect back to OBO and your access will be ready.
Requested scopes: ${discordScopes.join(", ")}

This authorization will allow OBO to access your Discord account with the requested permissions.
      `.trim(),
    };
  },

  /**
   * Validate a Discord bot or bearer token
   */
  async validate(credential: string, principal: string): Promise<boolean> {
    try {
      // Discord tokens: Bot tokens start with M or N, Bearer tokens vary
      // Basic format check
      if (!credential.match(/^[MN][A-Za-z\d]{23}\.[\w-]{6}\.[\w-]{27}/)) {
        return false;
      }

      // Try to validate with a simple API call
      const response = await fetch(`${DISCORD_API_URL}/v10/users/@me`, {
        headers: {
          Authorization: `Bearer ${credential}`,
        },
      });

      // For bot tokens, try the bot endpoint
      if (response.status === 401) {
        const botResponse = await fetch(`${DISCORD_API_URL}/v10/users/@me/guilds`, {
          headers: {
            Authorization: `Bot ${credential}`,
          },
        });
        return botResponse.status === 200;
      }

      return response.status === 200;
    } catch {
      return false;
    }
  },

  /**
   * Revoke a Discord slip
   */
  async revoke(slip: import("@useobo/core").Slip): Promise<void> {
    // Discord doesn't provide a direct API to revoke OAuth tokens
    // Users must revoke via their Discord Developer Portal
    console.error(`Discord slip ${slip.id} revoked. Token should be revoked manually at Discord Developer Portal.`);
  },
};

/**
 * Get pending PKCE flow info for callback
 */
export function getDiscordPendingFlow(slipId: string): { state: string; codeVerifier: string } | undefined {
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
export function cleanupDiscordPendingFlow(slipId: string): void {
  pendingFlows.delete(slipId);
}

/**
 * Discord scope mapping
 * OBO scopes -> Discord OAuth scopes
 */
export const DISCORD_SCOPE_MAP: Record<string, string> = {
  "identify": "identify",
  "email": "email",
  "guilds:read": "guilds",
  "guilds:join": "guilds.join",
  "guilds:write": "guilds.join",
  "bot": "bot",
  "connections": "connections",
  "messages:read": "messages.read",
  "messages:write": "messages.read",
  "webhooks:read": "webhook.read",
  "webhooks:write": "webhook.read",
};

/**
 * Convert OBO scopes to Discord OAuth scopes
 */
export function toDiscordScopes(scopes: Scope): string[] {
  const discordScopes = new Set<string>();

  for (const scope of scopes) {
    const mapped = DISCORD_SCOPE_MAP[scope];
    if (mapped) {
      discordScopes.add(mapped);
    }
  }

  // If no scopes matched, use identify as default
  if (discordScopes.size === 0) {
    discordScopes.add("identify");
  }

  return Array.from(discordScopes);
}
