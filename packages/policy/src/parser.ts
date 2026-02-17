/**
 * Policy Parser
 *
 * Parse policies from YAML config files
 */

import type { Policy } from "@obo/core";

/**
 * Policy file format
 */
export interface PolicyFile {
  version: string;
  policies: Array<{
    id: string;
    name: string;
    description?: string;
    principals: string[];
    actors: string[];
    targets: string[];
    auto_approve: string[];
    manual_approve: string[];
    deny: string[];
    max_ttl?: number;
  }>;
}

/**
 * Parse policy from YAML string
 */
export function parsePolicy(yaml: string): PolicyFile {
  // Simple YAML parser for now - in production, use a proper YAML library
  const lines = yaml.split("\n");
  const result: any = { version: "1", policies: [] };
  let currentPolicy: any = null;
  let inPolicies = false;
  let indent = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    if (trimmed.startsWith("version:")) {
      result.version = trimmed.split(":")[1].trim().replace(/"/g, "");
      continue;
    }

    if (trimmed.startsWith("policies:")) {
      inPolicies = true;
      continue;
    }

    if (inPolicies) {
      const lineIndent = line.search(/\S/);
      if (lineIndent === 0 && trimmed.startsWith("- ")) {
        if (currentPolicy) result.policies.push(currentPolicy);
        currentPolicy = {};
      } else if (currentPolicy !== null) {
        const [key, ...valueParts] = trimmed.split(":");
        if (valueParts.length > 0) {
          const value = valueParts.join(":").trim();
          const k = key.trim().replace(/-/g, "_");
          if (value.startsWith("[")) {
            currentPolicy[k] = JSON.parse(value);
          } else if (value === "''") {
            currentPolicy[k] = "";
          } else if (value.startsWith('"') || value.startsWith("'")) {
            currentPolicy[k] = value.slice(1, -1);
          } else {
            currentPolicy[k] = value;
          }
        }
      }
    }
  }

  if (currentPolicy) result.policies.push(currentPolicy);

  return result as PolicyFile;
}

/**
 * Convert policy file to Policy objects
 */
export function policyFileToPolicies(file: PolicyFile): Policy[] {
  return file.policies.map(
    (p) =>
      ({
        id: p.id,
        principals: p.principals,
        actors: p.actors,
        targets: p.targets,
        auto_approve: p.auto_approve,
        manual_approve: p.manual_approve,
        deny: p.deny,
        max_ttl: p.max_ttl ?? null,
      }) as Policy
  );
}

/**
 * Example policy file content
 */
export const EXAMPLE_POLICY = `# OBO Policy Configuration
version: "1"

policies:
  # Default policy for all principals, all actors
  - id: "default"
    name: "Default Policy"
    description: "Default policy for all principals and actors"
    principals: ["*"]
    actors: ["*"]
    targets: ["*"]
    # Read-only access is auto-approved
    auto_approve:
      - "*:read"
      - "*:list"
    # Write access requires manual approval
    manual_approve:
      - "*:write"
      - "*:create"
      - "*:delete"
      - "*:update"
    # Dangerous operations are denied
    deny:
      - "*:admin"
      - "*:destroy"
      - "billing:*"
    max_ttl: 3600  # 1 hour

  # GitHub-specific policy
  - id: "github-read-only"
    name: "GitHub Read-Only"
    principals: ["*"]
    actors: ["claude-*", "gpt-*"]
    targets: ["github"]
    auto_approve:
      - "repos:read"
      - "repos:list"
      - "user:read"
    manual_approve:
      - "repos:write"
      - "repos:create"
      - "repos:delete"
    deny:
      - "admin:*"
      - "org:*"
    max_ttl: 7200

  # Supabase policy (rogue mode)
  - id: "supabase-limited"
    name: "Supabase Limited Access"
    principals: ["*"]
    actors: ["*"]
    targets: ["supabase"]
    auto_approve:
      - "projects:read"
      - "functions:read"
    manual_approve:
      - "projects:write"
      - "functions:write"
      - "functions:create"
    deny:
      - "billing:*"
      - "org:*"
      - "settings:*"
    max_ttl: 1800  # 30 minutes
`;
