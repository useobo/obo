/**
 * OBO Database Schema
 *
 * Stores slips, tokens, policies, and audit logs.
 */

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/**
 * Principals — the authority owners
 */
export const principals = sqliteTable("principals", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  metadata: text("metadata", { mode: "json" }).$type(),
});

/**
 * Actors — the agents that make requests
 */
export const actors = sqliteTable("actors", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'agent', 'worker', 'service'
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  metadata: text("metadata", { mode: "json" }).$type(),
});

/**
 * Targets — the services being accessed
 */
export const targets = sqliteTable("targets", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  tags: text("tags").$type<string[]>(),
  supports: text("supports", { mode: "json" }).$type<{
    oauth: boolean;
    genesis: boolean;
    byoc: boolean;
    rogue: boolean;
  }>(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

/**
 * Policies — the rules governing slip requests
 */
export const policies = sqliteTable("policies", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  principals: text("principals").$type<string[]>(), // Glob patterns
  actors: text("actors").$type<string[]>(), // Glob patterns
  targets: text("targets").$type<string[]>(), // Glob patterns
  autoApprove: text("auto_approve").$type<string[]>(), // Scope patterns
  manualApprove: text("manual_approve").$type<string[]>(),
  deny: text("deny").$type<string[]>(),
  maxTtl: integer("max_ttl"), // Seconds, null = unlimited
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

/**
 * Slips — the authorization records
 */
export const slips = sqliteTable("slips", {
  id: text("id").primaryKey(),
  actorId: text("actor_id").notNull().references(() => actors.id),
  principalId: text("principal_id").notNull().references(() => principals.id),
  targetId: text("target_id").notNull().references(() => targets.id),
  requestedScope: text("requested_scope").$type<string[]>(),
  grantedScope: text("granted_scope").$type<string[]>().notNull(),
  issuedAt: integer("issued_at", { mode: "timestamp" }).notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  provisioningMethod: text("provisioning_method").notNull(), // 'oauth', 'genesis', 'byoc', 'rogue'
  tokenId: text("token_id").references(() => tokens.id),
  revocationUrl: text("revocation_url"),
  policyResult: text("policy_result", { mode: "json" }).$type<{
    decision: "auto_approve" | "manual_approve" | "deny";
    policyId: string | null;
    reason?: string;
    approvedBy?: string;
  }>().notNull(),
  reason: text("reason"), // Why the actor requested it
  status: text("status").notNull(), // 'active', 'revoked', 'expired'
  revokedAt: integer("revoked_at", { mode: "timestamp" }),
  revokedBy: text("revoked_by"),
});

/**
 * Tokens — the actual credentials
 */
export const tokens = sqliteTable("tokens", {
  id: text("id").primaryKey(),
  slipId: text("slip_id").notNull().references(() => slips.id),
  type: text("type").notNull(), // 'bearer_token', 'api_key', 'oauth_client', 'jwt'
  secret: text("secret"), // Encrypted
  reference: text("reference"), // For revocation, lookup
  metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  status: text("status").notNull(), // 'active', 'revoked', 'expired'
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

/**
 * Audit log — all actions for compliance
 */
export const auditLog = sqliteTable("audit_log", {
  id: text("id").primaryKey(),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
  action: text("action").notNull(), // 'slip_requested', 'slip_granted', 'slip_revoked', etc.
  actorId: text("actor_id").references(() => actors.id),
  principalId: text("principal_id").references(() => principals.id),
  targetId: text("target_id").references(() => targets.id),
  slipId: text("slip_id").references(() => slips.id),
  details: text("details", { mode: "json" }).$type<Record<string, unknown>>(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

/**
 * BYOC credentials — user-provided credentials
 */
export const byocCredentials = sqliteTable("byoc_credentials", {
  id: text("id").primaryKey(),
  principalId: text("principal_id").notNull().references(() => principals.id),
  targetId: text("target_id").notNull().references(() => targets.id),
  credential: text("credential").notNull(), // Encrypted
  validatedAt: integer("validated_at", { mode: "timestamp" }),
  lastUsedAt: integer("last_used_at", { mode: "timestamp" }),
  status: text("status").notNull(), // 'active', 'revoked', 'expired'
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
