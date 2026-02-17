/**
 * Policy Evaluator
 *
 * Evaluates slip requests against policies to determine:
 * - Auto-approve
 * - Manual approval required
 * - Deny
 */

import type { Policy, SlipRequest, Scope } from "@obo/core";
import { minimatch } from "minimatch";

/**
 * Evaluation result
 */
export interface Evaluation {
  decision: "auto_approve" | "manual_approve" | "deny";
  policy: Policy | null;
  reason: string;
  matchingScope: string[]; // Which scope patterns matched
}

/**
 * Evaluate a slip request against policies
 */
export function evaluateRequest(
  request: SlipRequest,
  policies: Policy[]
): Evaluation {
  // Find matching policies
  const matchingPolicies = policies.filter((p) =>
    policyMatches(p, request.principal, request.actor, request.target)
  );

  if (matchingPolicies.length === 0) {
    return {
      decision: "deny",
      policy: null,
      reason: "No matching policy found for principal, actor, and target",
      matchingScope: [],
    };
  }

  // Check TTL limits
  const requestedTtl = request.ttl ?? 3600; // Default 1 hour
  for (const policy of matchingPolicies) {
    if (policy.max_ttl !== null && requestedTtl > policy.max_ttl) {
      return {
        decision: "deny",
        policy,
        reason: `Requested TTL (${requestedTtl}s) exceeds policy max (${policy.max_ttl}s)`,
        matchingScope: [],
      };
    }
  }

  // Check each scope
  const deniedScopes: string[] = [];
  const manualApproveScopes: string[] = [];
  const autoApproveScopes: string[] = [];

  for (const scope of request.requested_scope) {
    let scopeDenied = false;
    let scopeManual = false;
    let scopeAuto = false;

    for (const policy of matchingPolicies) {
      // Check deny first (highest priority)
      if (matchesAnyPattern(scope, policy.deny)) {
        deniedScopes.push(scope);
        scopeDenied = true;
        break;
      }

      // Check manual approve
      if (matchesAnyPattern(scope, policy.manual_approve)) {
        manualApproveScopes.push(scope);
        scopeManual = true;
      }

      // Check auto approve
      if (matchesAnyPattern(scope, policy.auto_approve)) {
        autoApproveScopes.push(scope);
        scopeAuto = true;
      }
    }

    // If scope matched nothing, it's denied by default
    if (!scopeDenied && !scopeManual && !scopeAuto) {
      deniedScopes.push(scope);
    }
  }

  // If any scope is denied, entire request is denied
  if (deniedScopes.length > 0) {
    return {
      decision: "deny",
      policy: matchingPolicies[0],
      reason: `Scope(s) denied by policy: ${deniedScopes.join(", ")}`,
      matchingScope: deniedScopes,
    };
  }

  // If any scope requires manual approval, entire request requires it
  if (manualApproveScopes.length > 0) {
    return {
      decision: "manual_approve",
      policy: matchingPolicies[0],
      reason: `Scope(s) require manual approval: ${manualApproveScopes.join(", ")}`,
      matchingScope: manualApproveScopes,
    };
  }

  // All scopes auto-approved
  return {
    decision: "auto_approve",
    policy: matchingPolicies[0],
    reason: "All requested scopes auto-approved by policy",
    matchingScope: autoApproveScopes,
  };
}

/**
 * Check if a policy matches a principal, actor, and target
 */
function policyMatches(
  policy: Policy,
  principal: string,
  actor: string,
  target: string
): boolean {
  const principalMatch = policy.principals.some((p) => minimatch(principal, p));
  const actorMatch = policy.actors.some((a) => minimatch(actor, a));
  const targetMatch = policy.targets.some((t) => minimatch(target, t));

  return principalMatch && actorMatch && targetMatch;
}

/**
 * Check if a scope matches any pattern
 */
function matchesAnyPattern(scope: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    // Support both exact match and glob-like patterns
    if (pattern.includes("*")) {
      return minimatch(scope, pattern);
    }
    // Prefix match (e.g., "repos:" matches "repos:read")
    if (pattern.endsWith(":")) {
      return scope.startsWith(pattern);
    }
    return scope === pattern;
  });
}
