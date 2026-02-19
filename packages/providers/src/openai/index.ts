/**
 * OpenAI Provider
 *
 * Supports BYOC (Bring Your Own Credential) with API key validation.
 * Future support for Genesis flow to create API keys via OpenAI's API.
 *
 * BYOC Mode:
 * Paste an OpenAI API key (starts with sk-) in the reason field
 */

import type { Provider, SlipRequest, SlipResponse, Scope } from "@useobo/core";

const OPENAI_API_URL = "https://api.openai.com/v1";

export const OpenAIProvider: Provider = {
  name: "openai",
  description: "OpenAI - GPT models, fine-tuning, and AI API",
  tags: ["ai", "ml", "gpt", "llm", "api"],

  supports: {
    oauth: false,
    genesis: false, // Future: create API keys via org API
    byoc: true,
    rogue: false,
  },

  /**
   * Provision OpenAI access via BYOC
   */
  async provision(request: SlipRequest): Promise<SlipResponse> {
    // Check if user provided an OpenAI API key (BYOC mode)
    const byocKey = request.reason?.match(/sk-[a-zA-Z0-9]{48}/)?.[0]
      || request.reason?.match(/sk-proj-[a-zA-Z0-9-]{48,}/)?.[0];

    if (!byocKey) {
      throw new Error(
        "OpenAI provider requires an API key. " +
        "Please provide your OpenAI API key in the 'reason' field. " +
        "API keys start with 'sk-' or 'sk-proj-'. " +
        "Get your API key at https://platform.openai.com/api-keys"
      );
    }

    // BYOC mode - validate and use the provided key
    const isValid = await this.validate(byocKey, request.principal);
    if (!isValid) {
      throw new Error("The provided OpenAI API key is invalid. Please check and try again.");
    }

    const slipId = `slip_openai_byoc_${Date.now()}`;

    return {
      slip: {
        id: slipId,
        actor: request.actor,
        principal: request.principal,
        target: "openai",
        granted_scope: request.requested_scope,
        issued_at: new Date(),
        expires_at: request.ttl
          ? new Date(Date.now() + request.ttl * 1000)
          : null,
        provisioning_method: "byoc",
        token_id: `openai_token_${Date.now()}`,
        revocation_url: null,
        policy_result: {
          decision: "auto_approve",
          policy_id: "openai-byoc",
          reason: "Using user-provided API key (BYOC)",
        },
      },
      token: {
        id: `openai_token_${Date.now()}`,
        slip_id: slipId,
        type: "api_key",
        secret: byocKey,
        reference: byocKey.substring(0, 10) + "...",
        metadata: {
          source: "byoc",
        },
      },
      instructions: `
OpenAI API Key Provisioned

Your API key has been validated and is ready to use.

API Key Reference: ${byocKey.substring(0, 10)}...
Requested scopes: ${request.requested_scope.join(", ")}

Usage example:
  curl https://api.openai.com/v1/models \\
    -H "Authorization: Bearer ${byocKey}"

Note: OpenAI API keys have access to all capabilities for your organization.
Use caution when sharing.
      `.trim(),
    };
  },

  /**
   * Validate an OpenAI API key
   */
  async validate(credential: string, principal: string): Promise<boolean> {
    try {
      const response = await fetch(`${OPENAI_API_URL}/models`, {
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
   * Revoke an OpenAI slip
   */
  async revoke(slip: import("@useobo/core").Slip): Promise<void> {
    // OpenAI doesn't provide an API to revoke API keys
    // Users must revoke via their OpenAI dashboard
    console.error(`OpenAI slip ${slip.id} revoked. API key should be revoked manually at https://platform.openai.com/api-keys`);
  },
};

/**
 * OpenAI scope mapping (for documentation/policy purposes)
 * Note: OpenAI API keys have all permissions - scopes are for organizational policy
 */
export const OPENAI_SCOPE_MAP: Record<string, string> = {
  "models:read": "models.read",
  "models:write": "models.write",
  "chat:create": "chat.completions.create",
  "assistants:read": "assistants.read",
  "assistants:write": "assistants.write",
  "files:read": "files.read",
  "files:write": "files.write",
  "fine-tunes:read": "fine_tuning.read",
  "fine-tunes:write": "fine_tuning.create",
  "embeddings:create": "embeddings.create",
  "images:create": "images.generate",
  "audio:read": "audio.read",
  "audio:write": "audio.create",
};

/**
 * Convert OBO scopes to OpenAI scope descriptions (for documentation)
 */
export function toOpenAIScopes(scopes: Scope): string[] {
  const openaiScopes: string[] = [];

  for (const scope of scopes) {
    const mapped = OPENAI_SCOPE_MAP[scope];
    if (mapped) {
      openaiScopes.push(mapped);
    }
  }

  return openaiScopes;
}
