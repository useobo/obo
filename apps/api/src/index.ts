import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { eq, desc, and, type SQL } from "drizzle-orm";
import { createSlipService } from "@obo/core/dist/slip/index.js";
import { GitHubProvider } from "@obo/providers/dist/github/index.js";
import { SupabaseProvider } from "@obo/providers/dist/supabase/index.js";
import { getDb, schema } from "@obo/db";

const db = getDb();

async function initializeDefaultData() {
  const existingTargets = await db.select().from(schema.targets);
  
  if (existingTargets.length === 0) {
    await db.insert(schema.targets).values({
      name: "github",
      description: "GitHub - Git hosting and code collaboration",
      tags: ["git", "hosting", "code", "repos"],
      supports: { oauth: true, genesis: true, byoc: true, rogue: false },
    }).onConflictDoNothing();
    
    await db.insert(schema.targets).values({
      name: "supabase",
      description: "Supabase - Open source Firebase alternative",
      tags: ["database", "auth", "storage"],
      supports: { oauth: false, genesis: false, byoc: true, rogue: true },
    }).onConflictDoNothing();

    console.log("Initialized default targets");
  }

  const existingPolicies = await db.select().from(schema.policies);
  
  if (existingPolicies.length === 0) {
    await db.insert(schema.policies).values([
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
    ]).onConflictDoNothing();

    console.log("Initialized default policies");
  }

  const existingActors = await db.select().from(schema.actors);
  if (existingActors.length === 0) {
    await db.insert(schema.actors).values({
      name: "API",
      type: "service",
    }).onConflictDoNothing();
    console.log("Initialized default actor");
  }
}

const t = initTRPC.create();

const slipService = createSlipService();
slipService.registerProvider(GitHubProvider);
slipService.registerProvider(SupabaseProvider);

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
        await ctx.db.insert(schema.tokens).values({
          id: result.token.id,
          slipId: slip.id,
          type: result.token.type,
          secret: result.token.secret || null,
          reference: result.token.reference || null,
          metadata: result.token.metadata || {},
          expiresAt: result.slip.expires_at,
        });
      }

      await ctx.db.insert(schema.auditLog).values({
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
  slip: slipRouter,
  policy: policyRouter,
  provider: providerRouter,
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
  },
}));

const port = parseInt(process.env.PORT || "3001");

(async () => {
  await initializeDefaultData();
  
  console.log(`OBO API server starting on port ${port}`);

  serve({
    fetch: app.fetch,
    port,
  });

  console.log(`OBO API server ready at http://localhost:${port}`);
})();
