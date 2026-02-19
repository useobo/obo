import { config } from "dotenv";
config({ path: new URL("../.env", import.meta.url) });

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { eq, desc, and, type SQL } from "drizzle-orm";
import { createSlipService } from "@useobo/core/slip";
import { GitHubProvider } from "@useobo/providers/github";
import { SupabaseProvider } from "@useobo/providers/supabase";
import { OboProvider } from "@useobo/providers/obo";
import { VercelProvider } from "@useobo/providers/vercel";
import { SlackProvider } from "@useobo/providers/slack";
import { LinearProvider } from "@useobo/providers/linear";
import { NotionProvider } from "@useobo/providers/notion";
import { HuggingFaceProvider } from "@useobo/providers/huggingface";
import { OpenAIProvider } from "@useobo/providers/openai";
import { TwitchProvider } from "@useobo/providers/twitch";
import { GoogleCloudProvider } from "@useobo/providers/googlecloud";
import { StravaProvider } from "@useobo/providers/strava";
import { StripeProvider } from "@useobo/providers/stripe";
import { DiscordProvider } from "@useobo/providers/discord";
import { getDb, schema, genId } from "@obo/db";
import { encrypt, decrypt, isEncrypted, getDefaultStorageConfig, type TokenStorageConfig } from "@useobo/crypto";
import { handleCallback, generateCallbackHtml } from "./callback";

const db = getDb();

// Token storage configuration
const tokenConfig = getDefaultStorageConfig();
console.log(`Token storage: encryptAtRest=${tokenConfig.encryptAtRest}, oneTimeDelivery=${tokenConfig.oneTimeDelivery}`);

// All available providers with their configurations
const allProviders = [
  {
    name: "github",
    description: "GitHub - Git hosting and code collaboration",
    tags: ["git", "hosting", "code", "repos"],
    supports: { oauth: true, genesis: true, byoc: true, rogue: false },
  },
  {
    name: "supabase",
    description: "Supabase - Open source Firebase alternative",
    tags: ["database", "auth", "storage"],
    supports: { oauth: false, genesis: false, byoc: true, rogue: true },
  },
  {
    name: "obo",
    description: "obo - Self-referential access management",
    tags: ["internal", "self-hosted", "api"],
    supports: { oauth: false, genesis: true, byoc: true, rogue: false },
  },
  {
    name: "vercel",
    description: "Vercel - Deploy frontend projects and serverless functions",
    tags: ["deployment", "frontend", "nextjs", "serverless"],
    supports: { oauth: false, genesis: false, byoc: true, rogue: false },
  },
  {
    name: "slack",
    description: "Slack - Messaging and notifications for teams",
    tags: ["messaging", "chat", "notifications", "team"],
    supports: { oauth: false, genesis: false, byoc: true, rogue: false },
  },
  {
    name: "linear",
    description: "Linear - Project management and issue tracking",
    tags: ["project-management", "issues", "tracking", "agile"],
    supports: { oauth: false, genesis: false, byoc: true, rogue: false },
  },
  {
    name: "notion",
    description: "Notion - Docs, databases, and wikis",
    tags: ["docs", "database", "wiki", "knowledge"],
    supports: { oauth: false, genesis: false, byoc: true, rogue: false },
  },
  {
    name: "huggingface",
    description: "Hugging Face - ML models, datasets, and AI platform",
    tags: ["ai", "ml", "models", "datasets", "inference"],
    supports: { oauth: true, genesis: false, byoc: true, rogue: false },
  },
  {
    name: "openai",
    description: "OpenAI - GPT models, fine-tuning, and AI API",
    tags: ["ai", "ml", "gpt", "llm", "api"],
    supports: { oauth: false, genesis: false, byoc: true, rogue: false },
  },
  {
    name: "twitch",
    description: "Twitch - Live streaming and chat platform",
    tags: ["streaming", "gaming", "chat", "live"],
    supports: { oauth: true, genesis: false, byoc: false, rogue: false },
  },
  {
    name: "googlecloud",
    description: "Google Cloud Platform - Cloud infrastructure and services",
    tags: ["cloud", "infrastructure", "gcp", "compute", "storage", "iam"],
    supports: { oauth: false, genesis: false, byoc: true, rogue: false },
  },
  {
    name: "strava",
    description: "Strava - Fitness tracking and social network for athletes",
    tags: ["fitness", "sports", "running", "cycling", "activities"],
    supports: { oauth: true, genesis: false, byoc: false, rogue: false },
  },
  {
    name: "stripe",
    description: "Stripe - Payments infrastructure and billing",
    tags: ["payments", "billing", "finance", "api"],
    supports: { oauth: true, genesis: false, byoc: true, rogue: false },
  },
  {
    name: "discord",
    description: "Discord - Chat, communities, and gaming platform",
    tags: ["chat", "gaming", "community", "bot"],
    supports: { oauth: true, genesis: false, byoc: true, rogue: false },
  },
];

async function initializeDefaultData() {
  const existingTargets = await db.select().from(schema.targets);
  const existingTargetNames = new Set(existingTargets.map((t) => t.name));

  // Insert any missing providers
  for (const provider of allProviders) {
    if (!existingTargetNames.has(provider.name)) {
      await db.insert(schema.targets).values({
        id: genId(),
        ...provider,
      });
      console.log(`Added missing provider: ${provider.name}`);
    }
  }

  const existingPolicies = await db.select().from(schema.policies);
  const existingPolicyNames = new Set(existingPolicies.map((p) => p.name));

  // All available policies with their configurations
  const allPolicies = [
    {
      name: "GitHub Default",
      description: "Default policy for GitHub access",
      principals: ["*"],
      actors: ["*"],
      targets: ["github"],
      autoApprove: ["repos:read", "user:read", "user:email"],
      manualApprove: ["repos:write", "repos:delete", "admin:org"],
      deny: [],
      maxTtl: 86400,
    },
    {
      name: "Supabase Default",
      description: "Default policy for Supabase access",
      principals: ["*"],
      actors: ["*"],
      targets: ["supabase"],
      autoApprove: ["projects:read", "database:read", "functions:read"],
      manualApprove: ["projects:write", "database:write", "functions:write"],
      deny: [],
      maxTtl: 3600,
    },
    {
      name: "OBO Default",
      description: "Default policy for OBO self-referential access",
      principals: ["*"],
      actors: ["*"],
      targets: ["obo"],
      autoApprove: ["slips:list", "slips:create", "slips:revoke", "policies:read", "dashboard:read"],
      manualApprove: ["policies:write"],
      deny: [],
      maxTtl: 3600,
    },
    {
      name: "Vercel Default",
      description: "Default policy for Vercel access",
      principals: ["*"],
      actors: ["*"],
      targets: ["vercel"],
      autoApprove: ["projects:read", "deployments:read"],
      manualApprove: ["projects:write", "deployments:write", "deployment:trigger"],
      deny: [],
      maxTtl: 3600,
    },
    {
      name: "Slack Default",
      description: "Default policy for Slack access",
      principals: ["*"],
      actors: ["*"],
      targets: ["slack"],
      autoApprove: ["chat:write", "channels:read", "users:read"],
      manualApprove: ["channels:write", "files:write", "users:write"],
      deny: [],
      maxTtl: 3600,
    },
    {
      name: "Linear Default",
      description: "Default policy for Linear access",
      principals: ["*"],
      actors: ["*"],
      targets: ["linear"],
      autoApprove: ["issues:read", "teams:read", "projects:read"],
      manualApprove: ["issues:write", "issues:create", "projects:write"],
      deny: [],
      maxTtl: 3600,
    },
    {
      name: "Notion Default",
      description: "Default policy for Notion access",
      principals: ["*"],
      actors: ["*"],
      targets: ["notion"],
      autoApprove: ["pages:read", "databases:read", "search"],
      manualApprove: ["pages:write", "databases:write", "blocks:write"],
      deny: [],
      maxTtl: 3600,
    },
    {
      name: "Hugging Face Default",
      description: "Default policy for Hugging Face access",
      principals: ["*"],
      actors: ["*"],
      targets: ["huggingface"],
      autoApprove: ["repos:read", "models:read", "datasets:read"],
      manualApprove: ["repos:write", "models:write", "inference:manage"],
      deny: [],
      maxTtl: 3600,
    },
    {
      name: "OpenAI Default",
      description: "Default policy for OpenAI access",
      principals: ["*"],
      actors: ["*"],
      targets: ["openai"],
      autoApprove: ["models:read", "chat:create", "embeddings:create"],
      manualApprove: ["assistants:write", "fine-tunes:write"],
      deny: [],
      maxTtl: 3600,
    },
    {
      name: "Twitch Default",
      description: "Default policy for Twitch access",
      principals: ["*"],
      actors: ["*"],
      targets: ["twitch"],
      autoApprove: ["channel:read", "chat:read"],
      manualApprove: ["channel:write", "chat:write", "moderator:write"],
      deny: [],
      maxTtl: 3600,
    },
    {
      name: "Google Cloud Default",
      description: "Default policy for Google Cloud access",
      principals: ["*"],
      actors: ["*"],
      targets: ["googlecloud"],
      autoApprove: ["storage:read", "logging:read", "monitoring:read"],
      manualApprove: ["storage:write", "compute:write", "bigquery:write"],
      deny: [],
      maxTtl: 7200,
    },
    {
      name: "Strava Default",
      description: "Default policy for Strava access",
      principals: ["*"],
      actors: ["*"],
      targets: ["strava"],
      autoApprove: ["activities:read", "profile:read"],
      manualApprove: ["activities:write", "profile:write"],
      deny: [],
      maxTtl: 3600,
    },
    {
      name: "Stripe Default",
      description: "Default policy for Stripe access",
      principals: ["*"],
      actors: ["*"],
      targets: ["stripe"],
      autoApprove: ["charges:read", "customers:read", "products:read"],
      manualApprove: ["charges:write", "customers:write", "refunds:write"],
      deny: [],
      maxTtl: 3600,
    },
    {
      name: "Discord Default",
      description: "Default policy for Discord access",
      principals: ["*"],
      actors: ["*"],
      targets: ["discord"],
      autoApprove: ["identify", "guilds:read"],
      manualApprove: ["guilds:join", "messages:write", "guilds:write"],
      deny: [],
      maxTtl: 3600,
    },
  ];

  // Insert any missing policies
  for (const policy of allPolicies) {
    if (!existingPolicyNames.has(policy.name)) {
      await db.insert(schema.policies).values({
        id: genId(),
        ...policy,
      });
      console.log(`Added missing policy: ${policy.name}`);
    }
  }

  const existingActors = await db.select().from(schema.actors);
  if (existingActors.length === 0) {
    await db.insert(schema.actors).values({
      id: genId(),
      name: "API",
      type: "service",
    }).onConflictDoNothing();
    console.log("Initialized default actor");
  }
}

const t = initTRPC.create();

/**
 * Authentication middleware for JWT-protected routes
 */
const protectedProcedure = t.procedure.use(async ({ next, ctx }) => {
  // Extract JWT from Authorization header
  // For now, this is a placeholder - actual header parsing would happen
  // in the HTTP layer and passed via context
  return next({ ctx });
});

const slipService = createSlipService();
slipService.registerProvider(GitHubProvider);
slipService.registerProvider(SupabaseProvider);
slipService.registerProvider(OboProvider);
slipService.registerProvider(VercelProvider);
slipService.registerProvider(SlackProvider);
slipService.registerProvider(LinearProvider);
slipService.registerProvider(NotionProvider);
slipService.registerProvider(HuggingFaceProvider);
slipService.registerProvider(OpenAIProvider);
slipService.registerProvider(TwitchProvider);
slipService.registerProvider(GoogleCloudProvider);
slipService.registerProvider(StravaProvider);
slipService.registerProvider(StripeProvider);
slipService.registerProvider(DiscordProvider);

// Load policies from database into SlipService
async function loadPoliciesFromDatabase() {
  const policies = await db.select().from(schema.policies);
  for (const policy of policies) {
    slipService.registerPolicy({
      id: policy.id,
      principals: policy.principals,
      actors: policy.actors,
      targets: policy.targets,
      auto_approve: policy.autoApprove,
      manual_approve: policy.manualApprove,
      deny: policy.deny,
      max_ttl: policy.maxTtl,
    });
  }
  console.log(`Loaded ${policies.length} policies from database`);
}

interface Context {
  db: typeof db;
}

const createContext = async (): Promise<Context> => {
  return { db };
};

const slipRouter = t.router({
  request: t.procedure
    .input(z.object({
      target: z.string(),
      principal: z.string(),
      requested_scope: z.array(z.string()),
      ttl: z.number().optional(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const existingPrincipal = await ctx.db.select().from(schema.principals).where(
        eq(schema.principals.email, input.principal)
      ).limit(1);

      let principalId = existingPrincipal[0]?.id;

      if (!principalId) {
        const [newPrincipal] = await ctx.db.insert(schema.principals).values({
          id: genId(),
          email: input.principal,
        }).returning();
        principalId = newPrincipal.id;
      }

      const target = await ctx.db.select().from(schema.targets).where(
        eq(schema.targets.name, input.target)
      ).limit(1);

      if (!target[0]) {
        throw new Error(`Unknown target: ${input.target}`);
      }

      let actor = await ctx.db.select().from(schema.actors).where(
        eq(schema.actors.name, "API")
      ).limit(1);

      if (!actor[0]) {
        const [newActor] = await ctx.db.insert(schema.actors).values({
          id: genId(),
          name: "API",
          type: "service",
        }).returning();
        actor = [newActor];
      }

      const result = await slipService.requestSlip({
        actor: actor[0].id,
        principal: principalId,
        target: input.target,
        requested_scope: input.requested_scope,
        ttl: input.ttl,
        reason: input.reason,
      });

      console.log('[API] slipService.requestSlip result keys:', Object.keys(result));
      console.log('[API] result.slip.keys:', Object.keys(result.slip));
      console.log('[API] Has deviceCodeInfo?', 'deviceCodeInfo' in result);

      if ((result as any).deviceCodeInfo) {
        console.log('[API] deviceCodeInfo found!');
      } else {
        console.log('[API] No deviceCodeInfo. Full result:', JSON.stringify(result, null, 2));
      }

      const [slip] = await ctx.db.insert(schema.slips).values({
        id: result.slip.id,
        actorId: actor[0].id,
        principalId,
        targetId: target[0].id,
        requestedScope: input.requested_scope,
        grantedScope: result.slip.granted_scope,
        issuedAt: result.slip.issued_at,
        expiresAt: result.slip.expires_at,
        provisioningMethod: result.slip.provisioning_method,
        policyResult: result.slip.policy_result,
        reason: input.reason,
        status: "active",
      }).returning();

      if (result.token) {
        // Encrypt secret before storing (if enabled and secret exists)
        let storedSecret = result.token.secret || null;
        if (tokenConfig.encryptAtRest && storedSecret && !isEncrypted(storedSecret)) {
          storedSecret = encrypt(storedSecret);
        }

        await ctx.db.insert(schema.tokens).values({
          id: result.token.id,
          slipId: slip.id,
          type: result.token.type,
          secret: storedSecret,
          reference: result.token.reference || null,
          metadata: {
            ...(result.token.metadata || {}),
            // Track whether secret is encrypted
            encrypted: tokenConfig.encryptAtRest && storedSecret !== null,
          },
          expiresAt: result.slip.expires_at,
        });

        // Update the slip with the token ID
        const [updatedSlip] = await ctx.db.update(schema.slips)
          .set({ tokenId: result.token.id })
          .where(eq(schema.slips.id, slip.id))
          .returning();

        if (updatedSlip) {
          Object.assign(slip, updatedSlip);
        }
      }

      // Store OAuth device code info if present
      // For GitHub OAuth flow, request and store the device code directly
      if (result.slip.provisioning_method === "oauth" && target[0].name === "github") {
        const clientId = process.env.GITHUB_CLIENT_ID;
        if (!clientId) {
          throw new Error("GITHUB_CLIENT_ID not configured");
        }

        // Map OBO scopes to GitHub scopes
        const scopeMap: Record<string, string> = {
          "repos:read": "repo",
          "repos:write": "repo",
          "user:read": "read:user",
          "user:email": "user:email",
        };
        const githubScopes = [...new Set(input.requested_scope.map(s => scopeMap[s] || s))];

        // Request device code from GitHub
        const deviceCodeResponse = await fetch("https://github.com/login/device/code", {
          method: "POST",
          headers: { Accept: "application/json" },
          body: new URLSearchParams({
            client_id: clientId,
            scope: githubScopes.join(" "),
          }),
        }).then(r => r.json());

        if (deviceCodeResponse.error) {
          throw new Error(`GitHub device code error: ${deviceCodeResponse.error}`);
        }

        // Store device code info for completion
        await ctx.db.insert(schema.pendingOAuthFlows).values({
          slipId: slip.id,
          deviceCode: deviceCodeResponse.device_code,
          userCode: deviceCodeResponse.user_code,
          verificationUri: deviceCodeResponse.verification_uri,
          expiresIn: deviceCodeResponse.expires_in,
          interval: deviceCodeResponse.interval || 5,
          expiresAt: new Date(Date.now() + deviceCodeResponse.expires_in * 1000),
        });

        // Update instructions with the actual device code
        (result as any).instructions = `GitHub OAuth Device Flow:

1. Visit: ${deviceCodeResponse.verification_uri}
2. Enter code: ${deviceCodeResponse.user_code}
3. Authorize access for ${input.principal}

Requested scopes: ${githubScopes.join(", ")}

After authorizing, call complete_oauth_flow with slip ID: ${slip.id}`;
      }

      // For providers that do return deviceCodeInfo (Discord, etc.)
      if ((result as any).deviceCodeInfo) {
        const dc = (result as any).deviceCodeInfo;
        console.log('[API] deviceCodeInfo found for target:', target[0].name);
        console.log('[API] deviceCodeInfo.deviceCode:', dc.deviceCode?.substring(0, 20) + '...');
        console.log('[API] slip.id:', slip.id);
        await ctx.db.insert(schema.pendingOAuthFlows).values({
          slipId: slip.id,
          deviceCode: dc.deviceCode,
          userCode: dc.userCode,
          verificationUri: dc.verificationUri,
          expiresIn: dc.expiresIn,
          interval: dc.interval,
          expiresAt: new Date(dc.expiresInAt),
        }).onConflictDoNothing();
        console.log('[API] Pending OAuth flow stored successfully');
      } else {
        console.log('[API] No deviceCodeInfo in result. Available keys:', Object.keys(result));
        console.log('[API] result.slip:', { ...result.slip });
      }

      await ctx.db.insert(schema.auditLog).values({
        id: genId(),
        action: "slip_created",
        actorId: actor[0].id,
        principalId,
        targetId: target[0].id,
        slipId: slip.id,
        details: { requested_scope: input.requested_scope },
      });

      return {
        ...slip,
        target: target[0].name,
        principal: input.principal,
        policy_result: result.slip.policy_result,
        granted_scope: result.slip.granted_scope,
        // Pass through provider instructions (e.g., OAuth device flow)
        instructions: (result as any).instructions || null,
      };
    }),

  list: t.procedure
    .input(z.object({
      principal: z.string().optional(),
      target: z.string().optional(),
      active_only: z.boolean().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const conditions: SQL[] = [];

      if (input.principal) {
        conditions.push(eq(schema.principals.email, input.principal));
      }

      if (input.target) {
        conditions.push(eq(schema.targets.name, input.target));
      }

      if (input.active_only) {
        conditions.push(eq(schema.slips.status, "active"));
      }

      const results = await ctx.db
        .select({
          slip: schema.slips,
          target: schema.targets.name,
          principal: schema.principals.email,
        })
        .from(schema.slips)
        .innerJoin(schema.targets, eq(schema.slips.targetId, schema.targets.id))
        .innerJoin(schema.principals, eq(schema.slips.principalId, schema.principals.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(schema.slips.createdAt))
        .limit(100);

      return results.map((r) => ({
        ...r.slip,
        target: r.target,
        principal: r.principal,
      }));
    }),

  completeOAuth: t.procedure
    .input(z.object({
      slipId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const [pendingFlow] = await ctx.db.select().from(schema.pendingOAuthFlows)
        .where(eq(schema.pendingOAuthFlows.slipId, input.slipId));

      if (!pendingFlow) {
        throw new Error("No pending OAuth flow found for this slip. It may have expired or already been completed.");
      }

      // Check if expired
      if (new Date() > pendingFlow.expiresAt) {
        await ctx.db.delete(schema.pendingOAuthFlows).where(eq(schema.pendingOAuthFlows.slipId, input.slipId));
        throw new Error("OAuth flow has expired. Please request a new slip.");
      }

      // Get the slip for expiresAt
      const [slip] = await ctx.db.select().from(schema.slips)
        .where(eq(schema.slips.id, input.slipId))
        .limit(1);

      if (!slip) {
        throw new Error("Slip not found");
      }

      const clientId = process.env.GITHUB_CLIENT_ID;
      const clientSecret = process.env.GITHUB_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new Error("GitHub OAuth not configured");
      }

      // Poll GitHub for the access token
      const maxAttempts = 30; // 30 attempts
      const interval = pendingFlow.interval || 5;

      for (let i = 0; i < maxAttempts; i++) {
        await new Promise(resolve => setTimeout(resolve, interval * 1000));

        const params = new URLSearchParams({
          client_id: clientId,
          device_code: pendingFlow.deviceCode,
          grant_type: "urn:ietf:params:oauth:grant-type:device_code",
        });

        const response = await fetch("https://github.com/login/oauth/access_token", {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
          body: params,
        });

        if (!response.ok) {
          throw new Error(`Token request failed: ${response.status}`);
        }

        const data = await response.json();

        if (data.access_token) {
          // Success! Store the token and clean up
          const tokenId = `gh_token_${Date.now()}`;

          // Encrypt secret before storing
          const storedSecret = tokenConfig.encryptAtRest
            ? encrypt(data.access_token)
            : data.access_token;

          await ctx.db.insert(schema.tokens).values({
            id: tokenId,
            slipId: input.slipId,
            type: "oauth_access_token",
            secret: storedSecret,
            reference: data.access_token.substring(0, 20) + "...",
            metadata: {
              token_type: data.token_type,
              scope: data.scope,
              encrypted: tokenConfig.encryptAtRest,
            },
            expiresAt: slip.expiresAt,
          });

          // Update slip with token reference
          await ctx.db.update(schema.slips)
            .set({ tokenId })
            .where(eq(schema.slips.id, input.slipId));

          // Clean up pending flow
          await ctx.db.delete(schema.pendingOAuthFlows)
            .where(eq(schema.pendingOAuthFlows.slipId, input.slipId));

          // Log the completion
          await ctx.db.insert(schema.auditLog).values({
            id: genId(),
            action: "oauth_completed",
            slipId: input.slipId,
            details: { tokenId },
          });

          return {
            success: true,
            token: {
              id: tokenId,
              type: "oauth_access_token",
              secret: data.access_token, // Return the actual token secret so agent can use it
              reference: data.access_token.substring(0, 20) + "...",
              scopes: data.scope?.split(",") || [],
            },
          };
        }

        if (data.error === "authorization_pending") {
          continue; // Keep polling
        }

        if (data.error === "slow_down") {
          await new Promise(resolve => setTimeout(resolve, 5000));
          continue;
        }

        // Any other error is fatal
        await ctx.db.delete(schema.pendingOAuthFlows)
          .where(eq(schema.pendingOAuthFlows.slipId, input.slipId));

        throw new Error(`OAuth error: ${data.error}${data.error_description ? ` - ${data.error_description}` : ""}`);
      }

      throw new Error("Authorization timed out. Please try again.");
    }),

  cleanup: t.procedure
    .mutation(async ({ ctx }) => {
      // Delete all slips that are not active (revoked, expired, etc.)
      const result = await ctx.db.delete(schema.slips)
        .where(ne(schema.slips.status, "active"));

      // Also delete orphaned tokens
      await ctx.db.delete(schema.tokens)
        .where(sql`slip_id NOT IN (SELECT id FROM slips)`);

      return { success: true, deleted: Number(result.rowCount || 0) };
    }),

  revoke: t.procedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const now = new Date();

      await ctx.db.update(schema.slips)
        .set({
          status: "revoked",
          revokedAt: now,
        })
        .where(eq(schema.slips.id, input.id));

      await ctx.db.update(schema.tokens)
        .set({ status: "revoked" })
        .where(eq(schema.tokens.slipId, input.id));

      return { success: true };
    }),

  getToken: t.procedure
    .input(z.object({ slipId: z.string() }))
    .query(async ({ input, ctx }) => {
      const [slip] = await ctx.db.select({
        tokenId: schema.slips.tokenId,
        status: schema.slips.status,
        expiresAt: schema.slips.expiresAt,
      })
      .from(schema.slips)
      .where(eq(schema.slips.id, input.slipId))
      .limit(1);

      if (!slip) {
        throw new Error("Slip not found");
      }

      if (slip.status !== "active") {
        throw new Error(`Slip is not active (status: ${slip.status})`);
      }

      if (slip.expiresAt && new Date() > slip.expiresAt) {
        throw new Error("Slip has expired");
      }

      if (!slip.tokenId) {
        return {
          hasToken: false,
          message: "No token yet. Complete the OAuth flow first.",
        };
      }

      const [token] = await ctx.db.select({
        id: schema.tokens.id,
        type: schema.tokens.type,
        secret: schema.tokens.secret,
        reference: schema.tokens.reference,
        metadata: schema.tokens.metadata,
      })
      .from(schema.tokens)
      .where(eq(schema.tokens.id, slip.tokenId))
      .limit(1);

      if (!token) {
        throw new Error("Token not found in database");
      }

      // Decrypt secret if it's encrypted
      let secret = token.secret;
      const isTokenEncrypted = (token.metadata?.encrypted as boolean) || false;
      if (token.secret && isTokenEncrypted && isEncrypted(token.secret)) {
        secret = decrypt(token.secret);
      }

      return {
        hasToken: true,
        token: {
          id: token.id,
          type: token.type,
          secret: secret,
          reference: token.reference,
          metadata: token.metadata,
        },
      };
    }),
});

const jwtRouter = t.router({
  verify: t.procedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const { verifyJWT } = await import("@useobo/crypto");
      try {
        const result = await verifyJWT(input.token);
        return {
          valid: true,
          payload: {
            principal: result.principal,
            scopes: result.scopes,
            slipId: result.slipId,
            issuer: result.iss,
            expiresAt: result.exp,
          },
        };
      } catch (e) {
        return {
          valid: false,
          error: (e as Error).message,
        };
      }
    }),

  revoke: t.procedure
    .input(z.object({
      jti: z.string().describe("JWT ID or slip ID to revoke"),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { revokeToken } = await import("@useobo/crypto");
      revokeToken(input.jti, input.reason);
      return { success: true, revoked: input.jti };
    }),

  checkRevoked: t.procedure
    .input(z.object({ jti: z.string() }))
    .query(async ({ input }) => {
      const { isTokenRevoked, getRevocationInfo } = await import("@useobo/crypto");
      const revoked = isTokenRevoked(input.jti);
      return {
        revoked,
        info: revoked ? getRevocationInfo(input.jti) : null,
      };
    }),

  keyInfo: t.procedure
    .query(async () => {
      const { getKeyInfo, hasKeyRotationConfigured } = await import("@useobo/crypto");
      return {
        keys: getKeyInfo(),
        rotationEnabled: hasKeyRotationConfigured(),
      };
    }),
});

const policyRouter = t.router({
  check: t.procedure
    .input(z.object({
      target: z.string(),
      principal: z.string(),
      requested_scope: z.array(z.string()),
    }))
    .query(async ({ input }) => {
      return slipService.checkPolicy(
        input.target,
        input.principal,
        input.requested_scope
      );
    }),
});

const providerRouter = t.router({
  list: t.procedure
    .query(async ({ ctx }) => {
      return ctx.db.select().from(schema.targets);
    }),
});

const appRouter = t.router({
  slips: slipRouter,
  policies: policyRouter,
  providers: providerRouter,
  jwt: jwtRouter,
});

export type AppRouter = typeof appRouter;

const app = new Hono();

app.use("*", logger());
app.use("*", cors({
  origin: ["http://localhost:3000", "http://localhost:3001"],
  credentials: true,
}));

app.get("/health", (c) => c.json({ status: "ok", timestamp: Date.now() }));

app.use("/trpc/*", async (c) => {
  const req = c.req.raw;
  const resHeaders = new Headers();

  const response = await fetchRequestHandler({
    endpoint: "/trpc",
    req,
    resHeaders,
    router: appRouter,
    createContext,
  });

  response.headers.forEach((value, key) => {
    c.header(key, value);
  });

  return c.body(response.body, response.status);
});

app.get("/", (c) => c.json({
  name: "OBO API",
  version: "0.0.1",
  endpoints: {
    health: "/health",
    trpc: "/trpc",
    callback: "/callback/:service",
  },
}));

// Universal OAuth PKCE callback handler
app.get("/callback/:service", async (c) => {
  const service = c.req.param("service") || "";
  const query = {
    code: c.req.query("code"),
    state: c.req.query("state"),
    error: c.req.query("error"),
    error_description: c.req.query("error_description"),
  };

  // Build origin URL for callback
  const proto = c.req.header("x-forwarded-proto") || "http";
  const host = c.req.header("host") || "localhost:3001";
  const originUrl = `${proto}://${host}`;

  const result = await handleCallback(service, query, originUrl);

  return c.html(generateCallbackHtml(result));
});

const port = parseInt(process.env.PORT || "3001");

(async () => {
  await initializeDefaultData();
  await loadPoliciesFromDatabase();

  console.log(`OBO API server starting on port ${port}`);

  serve({
    fetch: app.fetch,
    port,
  });

  console.log(`OBO API server ready at http://localhost:${port}`);
})();
