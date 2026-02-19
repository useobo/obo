/**
 * Google Cloud Provider
 *
 * Supports BYOC (Bring Your Own Credential) with service account keys.
 * The provider validates GCP credentials by attempting to get the project ID.
 *
 * BYOC Mode:
 * Paste a service account key JSON in the reason field
 *
 * Future: Genesis flow to create service accounts via GCP APIs (requires Service Account Admin role)
 */

import type { Provider, SlipRequest, SlipResponse, Scope } from "@useobo/core";

export const GoogleCloudProvider: Provider = {
  name: "googlecloud",
  description: "Google Cloud Platform - Cloud infrastructure and services",
  tags: ["cloud", "infrastructure", "gcp", "compute", "storage", "iam"],

  supports: {
    oauth: false,
    genesis: false, // Future: create service accounts via API
    byoc: true,
    rogue: false,
  },

  /**
   * Provision Google Cloud access via BYOC
   */
  async provision(request: SlipRequest): Promise<SlipResponse> {
    // Try to detect a service account key JSON in the reason field
    let keyData: Record<string, unknown> | null = null;

    // Try parsing the reason as JSON directly
    try {
      const parsed = JSON.parse(request.reason || "");
      if (parsed.type === "service_account") {
        keyData = parsed;
      }
    } catch {
      // Not valid JSON, continue to other detection methods
    }

    // Look for JSON pattern in the reason text
    if (!keyData) {
      const jsonMatch = request.reason?.match(/\{[^{}]*"type"\s*:\s*"service_account"[^{}]*\}/);
      if (jsonMatch) {
        try {
          keyData = JSON.parse(jsonMatch[0]);
        } catch {
          // Invalid JSON
        }
      }
    }

    if (!keyData) {
      throw new Error(
        "Google Cloud provider requires a service account key. " +
        "Please provide a GCP service account key JSON in the 'reason' field. " +
        "The key must have type 'service_account'. " +
        "Create a service account key at: https://console.cloud.google.com/iam-admin/serviceaccounts"
      );
    }

    // BYOC mode - validate the service account key
    const isValid = await this.validate(JSON.stringify(keyData), request.principal);
    if (!isValid) {
      throw new Error("The provided Google Cloud service account key is invalid. Please check and try again.");
    }

    const slipId = `slip_gcp_byoc_${Date.now()}`;
    const projectId = keyData.project_id as string || "unknown";
    const clientEmail = keyData.client_email as string || "unknown";

    return {
      slip: {
        id: slipId,
        actor: request.actor,
        principal: request.principal,
        target: "googlecloud",
        granted_scope: request.requested_scope,
        issued_at: new Date(),
        expires_at: request.ttl
          ? new Date(Date.now() + request.ttl * 1000)
          : null,
        provisioning_method: "byoc",
        token_id: `gcp_key_${Date.now()}`,
        revocation_url: null,
        policy_result: {
          decision: "auto_approve",
          policy_id: "gcp-byoc",
          reason: "Using user-provided service account key (BYOC)",
        },
      },
      token: {
        id: `gcp_key_${Date.now()}`,
        slip_id: slipId,
        type: "api_key",
        secret: JSON.stringify(keyData),
        reference: clientEmail,
        metadata: {
          source: "byoc",
          project_id: projectId,
          client_email: clientEmail,
        },
      },
      instructions: `
Google Cloud Service Account Key Provisioned

Project: ${projectId}
Service Account: ${clientEmail}

The service account key has been validated and can be used with:
- Google Cloud SDK (gcloud)
- Terraform Google Provider
- Any google-cloud-* npm package
- Other GCP client libraries

Usage example with gcloud:
  gcloud auth activate-service-account --key-file=<(echo '${JSON.stringify(keyData).substring(0, 50)}...')

Note: Service account keys should be stored securely and rotated regularly.
When revoking this slip, manually delete the key from GCP console.
      `.trim(),
    };
  },

  /**
   * Validate a GCP service account key
   */
  async validate(credential: string, principal: string): Promise<boolean> {
    try {
      const keyData = JSON.parse(credential);
      if (keyData.type !== 'service_account') {
        return false;
      }

      // Try to validate by checking the required fields
      const requiredFields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email'];
      for (const field of requiredFields) {
        if (!keyData[field]) {
          return false;
        }
      }

      // Basic format validation for private key
      if (typeof keyData.private_key !== 'string' || !keyData.private_key.includes('-----BEGIN PRIVATE KEY-----')) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  },

  /**
   * Revoke a Google Cloud slip
   */
  async revoke(slip: import("@useobo/core").Slip): Promise<void> {
    console.error(`Google Cloud slip ${slip.id} revoked. Service account key should be revoked manually at GCP console.`);
  },
};

/**
 * GCP scope mapping to IAM roles (for documentation/policy purposes)
 * OBO scopes -> GCP IAM roles
 */
export const GCP_SCOPE_MAP: Record<string, string> = {
  "storage:read": "roles/storage.objectViewer",
  "storage:write": "roles/storage.objectAdmin",
  "storage:admin": "roles/storage.admin",
  "compute:read": "roles/compute.viewer",
  "compute:write": "roles/compute.instanceAdmin",
  "compute:admin": "roles/compute.admin",
  "logging:read": "roles/logging.viewer",
  "logging:write": "roles/logging.logWriter",
  "monitoring:read": "roles/monitoring.viewer",
  "monitoring:write": "roles/monitoring.metricWriter",
  "pubsub:read": "roles/pubsub.viewer",
  "pubsub:write": "roles/pubsub.editor",
  "bigquery:read": "roles/bigquery.dataViewer",
  "bigquery:write": "roles/bigquery.dataEditor",
  "bigquery:admin": "roles/bigquery.admin",
  "iam:read": "roles/iam.viewer",
  "iam:write": "roles/iam.roleAdmin",
};

/**
 * Convert OBO scopes to GCP IAM roles
 */
export function toIAMRoles(scopes: Scope): string[] {
  const roles = new Set<string>();

  for (const scope of scopes) {
    const mapped = GCP_SCOPE_MAP[scope];
    if (mapped) {
      roles.add(mapped);
    }
  }

  return Array.from(roles);
}
