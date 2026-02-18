/**
 * Slack Provider
 *
 * Supports BYOC (Bring Your Own Credential) with Bot and User tokens.
 *
 * Slack tokens allow programmatic access to Slack workspaces including:
 * - Sending messages
 * - Reading channels and messages
 * - Managing files
 * - User and team information
 *
 * Create a bot token at: https://api.slack.com/apps
 */

import type { Provider, SlipRequest, SlipResponse } from "@useobo/core";

const SLACK_API_URL = "https://slack.com/api";

export const SlackProvider: Provider = {
  name: "slack",
  description: "Slack - Messaging and notifications for teams",
  tags: ["messaging", "chat", "notifications", "slack", "team"],

  supports: {
    oauth: false, // OAuth not yet implemented
    genesis: false, // No public signup API
    byoc: true, // User can paste their own token
    rogue: false, // No rogue mode
  },

  /**
   * Provision Slack access via BYOC mode
   */
  async provision(request: SlipRequest): Promise<SlipResponse> {
    // Check for Slack token in reason field
    // Bot tokens start with "xoxb-", User tokens start with "xoxp-"
    const botTokenMatch = request.reason?.match(/xoxb-[a-zA-Z0-9-]{10,50}/)?.[0];
    const userTokenMatch = request.reason?.match(/xoxp-[a-zA-Z0-9-]{10,50}/)?.[0];
    const token = botTokenMatch || userTokenMatch;

    if (!token) {
      throw new Error(
        "Slack requires a Bot Token (xoxb-*) or User Token (xoxp-*). " +
        "Create one at https://api.slack.com/apps " +
        "and provide it in the 'reason' field."
      );
    }

    // Validate the token
    const isValid = await this.validate(token, request.principal);
    if (!isValid) {
      throw new Error("The provided Slack token is invalid. Please check and try again.");
    }

    const slipId = `slip_slack_byoc_${Date.now()}`;
    const tokenId = `slack_token_${Date.now()}`;

    return {
      slip: {
        id: slipId,
        actor: request.actor,
        principal: request.principal,
        target: "slack",
        granted_scope: request.requested_scope,
        issued_at: new Date(),
        expires_at: request.ttl
          ? new Date(Date.now() + request.ttl * 1000)
          : null,
        provisioning_method: "byoc",
        token_id: tokenId,
        revocation_url: null,
        policy_result: {
          decision: "auto_approve",
          policy_id: "slack-byoc",
          reason: `Using user-provided Slack ${botTokenMatch ? "Bot" : "User"} token (BYOC)`,
        },
      },
      token: {
        id: tokenId,
        slip_id: slipId,
        type: "oauth_access_token",
        secret: token,
        reference: token.substring(0, 12) + "...",
        metadata: {
          source: "byoc",
          tokenType: botTokenMatch ? "bot" : "user",
        },
      },
    };
  },

  /**
   * Validate a Slack token
   */
  async validate(credential: string, principal: string): Promise<boolean> {
    try {
      const response = await fetch(`${SLACK_API_URL}/auth.test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          token: credential,
        }),
      });

      const data = await response.json() as { ok: boolean };
      return data.ok === true;
    } catch {
      return false;
    }
  },

  /**
   * Revoke a Slack slip
   *
   * Note: Slack tokens must be revoked manually in the app settings.
   * Bot tokens can be revoked at: https://api.slack.com/apps
   */
  async revoke(slip: import("@useobo/core").Slip): Promise<void> {
    console.error(
      `Slack slip ${slip.id} revoked. ` +
      `Revoke the token manually at: https://api.slack.com/apps`
    );
  },
};

/**
 * Slack scope mapping
 *
 * Map OBO scopes to Slack OAuth scopes
 */
export const SLACK_SCOPE_MAP: Record<string, string> = {
  "chat:write": "chat:write",
  "chat:write:public": "chat:write.public",
  "chat:write:customize": "chat:write.customize",
  "channels:read": "channels:read",
  "channels:write": "channels:write",
  "channels:history": "channels:history",
  "channels:join": "channels:join",
  "files:read": "files:read",
  "files:write": "files:write",
  "users:read": "users:read",
  "users:read:email": "users:read:email",
  "users:write": "users:write",
  "teams:read": "team:read",
  "reactions:read": "reactions:read",
  "reactions:write": "reactions:write",
  "groups:read": "groups:read",
  "groups:write": "groups:write",
  "im:read": "im:read",
  "im:write": "im:write",
  "mpim:read": "mpim:read",
  "mpim:write": "mpim:write",
  "pins:read": "pins:read",
  "pins:write": "pins:write",
  "links:read": "links:read",
  "links:write": "links:write",
  "reminders:read": "reminders:read",
  "reminders:write": "reminders:write",
};

/**
 * Convert OBO scopes to Slack scopes
 */
export function toSlackScopes(scopes: string[]): string[] {
  const slackScopes = new Set<string>();

  for (const scope of scopes) {
    const mapped = SLACK_SCOPE_MAP[scope];
    if (mapped) {
      slackScopes.add(mapped);
    }
  }

  return Array.from(slackScopes);
}
