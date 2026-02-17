/**
 * OBO Database Schema
 *
 * PostgreSQL schema for storing slips, tokens, policies, and audit logs.
 */

import { pgTable, text, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";

/**
 * Principals — the authority owners (users agents act on behalf of)
 */
export const principals = pgTable("principals", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Actors — the agents that make requests (could be AI agents, workers, or dashboard users)
 */
export const actors = pgTable("actors", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'agent', 'worker', 'user', 'service'
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Targets — the services being accessed (GitHub, Supabase, etc.)
 */
export const targets = pgTable("targets", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  tags: jsonb("tags").$type<string[]>(),
  supports: jsonb("supports").$type<{
    oauth: boolean;
    genesis: boolean;
    byoc: boolean;
    rogue: boolean;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Policies — the rules governing slip requests
 */
export const policies = pgTable("policies", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  principals: jsonb("principals").$type<string[]>(), // Glob patterns
  actors: jsonb("actors").$type<string[]>(),
  targets: jsonb("targets").$type<string[]>(),
  autoApprove: jsonb("auto_approve").$type<string[]>(),
  manualApprove: jsonb("manual_approve").$type<string[]>(),
  deny: jsonb("deny").$type<string[]>(),
  maxTtl: integer("max_ttl"), // Seconds, null = unlimited
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Slips — the authorization records
 */
export const slips = pgTable("slips", {
  id: text("id").primaryKey(),
  actorId: text("actor_id").notNull().references(() => actors.id),
  principalId: text("principal_id").notNull().references(() => principals.id),
  targetId: text("target_id").notNull().references(() => targets.id),
  requestedScope: jsonb("requested_scope").$type<string[]>(),
  grantedScope: jsonb("granted_scope").$type<string[]>().notNull(),
  issuedAt: timestamp("issued_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  provisioningMethod: text("provisioning_method").notNull(), // 'oauth', 'genesis', 'byoc', 'rogue'
  tokenId: text("token_id").references(() => tokens.id),
  revocationUrl: text("revocation_url"),
  policyResult: jsonb("policy_result").$type<{
    decision: "auto_approve" | "manual_approve" | "deny";
    policyId: string | null;
    reason?: string;
    approvedBy?: string;
  }>().notNull(),
  reason: text("reason"),
  status: text("status").notNull().default("active"), // 'active', 'revoked', 'expired'
  revokedAt: timestamp("revoked_at"),
  revokedBy: text("revoked_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Tokens — the actual credentials
 */
export const tokens = pgTable("tokens", {
  id: text("id").primaryKey(),
  slipId: text("slip_id").notNull().references(() => slips.id),
  type: text("type").notNull(), // 'bearer_token', 'api_key', 'oauth_client', 'jwt'
  secret: text("secret"), // TODO: Encrypt this
  reference: text("reference"), // For revocation, lookup
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  expiresAt: timestamp("expires_at"),
  status: text("status").notNull().default("active"), // 'active', 'revoked', 'expired'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Audit log — all actions for compliance
 */
export const auditLog = pgTable("audit_log", {
  id: text("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  action: text("action").notNull(), // 'slip_requested', 'slip_granted', 'slip_revoked', etc.
  actorId: text("actor_id").references(() => actors.id),
  principalId: text("principal_id").references(() => principals.id),
  targetId: text("target_id").references(() => targets.id),
  slipId: text("slip_id").references(() => slips.id),
  details: jsonb("details").$type<Record<string, unknown>>(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

/**
 * BYOC credentials — user-provided credentials
 */
export const byocCredentials = pgTable("byoc_credentials", {
  id: text("id").primaryKey(),
  principalId: text("principal_id").notNull().references(() => principals.id),
  targetId: text("target_id").notNull().references(() => targets.id),
  credential: text("credential").notNull(), // TODO: Encrypt this
  validatedAt: timestamp("validated_at"),
  lastUsedAt: timestamp("last_used_at"),
  status: text("status").notNull().default("active"), // 'active', 'revoked', 'expired'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Pending OAuth flows — store device codes for OAuth completion
 */
export const pendingOAuthFlows = pgTable("pending_oauth_flows", {
  slipId: text("slip_id").primaryKey().references(() => slips.id),
  deviceCode: text("device_code").notNull(),
  userCode: text("user_code").notNull(),
  verificationUri: text("verification_uri").notNull(),
  expiresIn: integer("expires_in").notNull(),
  interval: integer("interval").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

// Types for inserts
export type NewPrincipal = typeof principals.$inferInsert;
export type NewActor = typeof actors.$inferInsert;
export type NewTarget = typeof targets.$inferInsert;
export type NewPolicy = typeof policies.$inferInsert;
export type NewSlip = typeof slips.$inferInsert;
export type NewToken = typeof tokens.$inferInsert;
export type NewAuditLog = typeof auditLog.$inferInsert;
export type NewByocCredential = typeof byocCredentials.$inferInsert;
export type NewPendingOAuthFlow = typeof pendingOAuthFlows.$inferInsert;
