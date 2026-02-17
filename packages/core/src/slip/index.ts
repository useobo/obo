/**
 * OBO Slip Service
 *
 * Core service for creating, managing, and revoking slips.
 */

import type {
  Actor,
  Principal,
  Target,
  Scope,
  Slip,
  SlipRequest,
  SlipResponse,
  Provider,
  Policy,
  PolicyResult,
} from "../types.js";

const slipStore = new Map<string, Slip>();
const providerRegistry = new Map<Target, Provider>();
const policyRegistry = new Map<string, Policy>();

const defaultPolicies: Policy[] = [
  {
    id: "github-default",
    principals: ["*"],
    actors: ["*"],
    targets: ["github"],
    auto_approve: ["repos:read", "user:read", "user:email"],
    manual_approve: ["repos:write", "repos:delete", "admin:org"],
    deny: [],
    max_ttl: 86400,
  },
  {
    id: "supabase-default",
    principals: ["*"],
    actors: ["*"],
    targets: ["supabase"],
    auto_approve: ["projects:read", "database:read", "functions:read"],
    manual_approve: ["projects:write", "database:write", "functions:write"],
    deny: [],
    max_ttl: 3600,
  },
  {
    id: "obo-default",
    principals: ["*"],
    actors: ["*"],
    targets: ["obo"],
    auto_approve: ["slips:list", "slips:create", "slips:revoke", "policies:read", "dashboard:read"],
    manual_approve: ["policies:write"],
    deny: [],
    max_ttl: 3600,
  },
];

export class SlipService {
  constructor() {
    for (const policy of defaultPolicies) {
      policyRegistry.set(policy.id, policy);
    }
  }

  registerProvider(provider: Provider): void {
    providerRegistry.set(provider.name, provider);
  }

  getProvider(target: Target): Provider | undefined {
    return providerRegistry.get(target);
  }

  listProviders(): Provider[] {
    return Array.from(providerRegistry.values());
  }

  async requestSlip(request: SlipRequest): Promise<SlipResponse> {
    const provider = providerRegistry.get(request.target);
    if (!provider) {
      throw new Error(`Unknown target: ${request.target}`);
    }

    const policyResult = await this.evaluatePolicy(request);
    if (policyResult.decision === "deny") {
      throw new Error(`Request denied: ${policyResult.reason}`);
    }

    const response = await provider.provision(request);
    const slip = { ...response.slip, policy_result: policyResult };
    slipStore.set(slip.id, slip);

    if (response.token) {
      response.token.slip_id = slip.id;
    }

    return { slip, token: response.token, instructions: response.instructions };
  }

  listSlips(filter?: {
    principal?: Principal;
    target?: Target;
    active_only?: boolean;
  }): Slip[] {
    const now = new Date();
    let slips = Array.from(slipStore.values());

    if (filter?.principal) slips = slips.filter((s) => s.principal === filter.principal);
    if (filter?.target) slips = slips.filter((s) => s.target === filter.target);
    if (filter?.active_only) slips = slips.filter((s) => !s.expires_at || s.expires_at > now);

    return slips.sort((a, b) => b.issued_at.getTime() - a.issued_at.getTime());
  }

  getSlip(slipId: string): Slip | undefined {
    return slipStore.get(slipId);
  }

  async revokeSlip(slipId: string): Promise<void> {
    const slip = slipStore.get(slipId);
    if (!slip) throw new Error(`Slip not found: ${slipId}`);

    const provider = providerRegistry.get(slip.target);
    if (provider?.revoke) await provider.revoke(slip);

    slipStore.delete(slipId);
  }

  async checkPolicy(
    target: Target,
    principal: Principal,
    requestedScope: Scope
  ): Promise<PolicyResult> {
    const provider = providerRegistry.get(target);
    if (!provider) {
      return { decision: "deny", policy_id: null, reason: `Unknown target: ${target}` };
    }

    const request: SlipRequest = {
      actor: "policy-check",
      principal,
      target,
      requested_scope: requestedScope,
    };

    return this.evaluatePolicy(request);
  }

  private async evaluatePolicy(request: SlipRequest): Promise<PolicyResult> {
    const applicablePolicies = Array.from(policyRegistry.values()).filter(
      (policy) =>
        this.matchesPattern(policy.principals, request.principal) &&
        this.matchesPattern(policy.actors, request.actor) &&
        this.matchesPattern(policy.targets, request.target)
    );

    if (applicablePolicies.length === 0) {
      return { decision: "deny", policy_id: null, reason: "No applicable policy" };
    }

    for (const policy of applicablePolicies) {
      for (const scope of request.requested_scope) {
        if (this.matchesPattern(policy.deny, scope)) {
          return { decision: "deny", policy_id: policy.id, reason: `Scope ${scope} denied` };
        }
      }
    }

    for (const policy of applicablePolicies) {
      const allAuto = request.requested_scope.every((s) =>
        this.matchesPattern(policy.auto_approve, s)
      );
      if (allAuto) {
        if (policy.max_ttl && request.ttl && request.ttl > policy.max_ttl) {
          return {
            decision: "manual_approve",
            policy_id: policy.id,
            reason: `TTL exceeds maximum`,
          };
        }
        return { decision: "auto_approve", policy_id: policy.id };
      }
    }

    for (const policy of applicablePolicies) {
      if (request.requested_scope.some((s) => this.matchesPattern(policy.manual_approve, s))) {
        return { decision: "manual_approve", policy_id: policy.id };
      }
    }

    return { decision: "deny", policy_id: applicablePolicies[0].id, reason: "No match" };
  }

  private matchesPattern(patterns: string[], value: string): boolean {
    return patterns.some((p) => p === "*" || p === value || (p.endsWith("*") && value.startsWith(p.slice(0, -1))));
  }

  cleanupExpiredSlips(): number {
    const now = new Date();
    let cleaned = 0;
    for (const [id, slip] of slipStore.entries()) {
      if (slip.expires_at && slip.expires_at <= now) {
        slipStore.delete(id);
        cleaned++;
      }
    }
    return cleaned;
  }
}

export function createSlipService(): SlipService {
  return new SlipService();
}
