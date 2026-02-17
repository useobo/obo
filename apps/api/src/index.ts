/**
 * OBO API Server
 *
 * Hono + tRPC backend for the OBO dashboard.
 */

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { createSlipService } from "@obo/core/dist/slip/index.js";
import { GitHubProvider } from "@obo/providers/dist/github/index.js";
import { SupabaseProvider } from "@obo/providers/dist/supabase/index.js";

// ---------------------------------------------------------------------
// tRPC Setup
// ---------------------------------------------------------------------

const t = initTRPC.create();

const slipService = createSlipService();
slipService.registerProvider(GitHubProvider);
slipService.registerProvider(SupabaseProvider);

// ---------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------

interface Context {
  // Add things like user session later
}

const createContext = async (): Promise<Context> => {
  return {};
};

// ---------------------------------------------------------------------
// Routers
// ---------------------------------------------------------------------

const slipRouter = t.router({
  request: t.procedure
    .input(z.object({
      target: z.string(),
      principal: z.string(),
      requested_scope: z.array(z.string()),
      ttl: z.number().optional(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await slipService.requestSlip({
        actor: "api",
        principal: input.principal,
        target: input.target,
        requested_scope: input.requested_scope,
        ttl: input.ttl,
        reason: input.reason,
      });
      return result;
    }),

  list: t.procedure
    .input(z.object({
      principal: z.string().optional(),
      target: z.string().optional(),
      active_only: z.boolean().optional(),
    }))
    .query(({ input }) => {
      return slipService.listSlips(input);
    }),

  get: t.procedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      return slipService.getSlip(input.id);
    }),

  revoke: t.procedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await slipService.revokeSlip(input.id);
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
    .query(() => {
      return slipService.listProviders();
    }),
});

const appRouter = t.router({
  slip: slipRouter,
  policy: policyRouter,
  provider: providerRouter,
});

export type AppRouter = typeof appRouter;

// ---------------------------------------------------------------------
// Hono App
// ---------------------------------------------------------------------

const app = new Hono();

app.use("*", logger());
app.use("*", cors({
  origin: ["http://localhost:3000", "http://localhost:3001"],
  credentials: true,
}));

// Health check
app.get("/health", (c) => c.json({ status: "ok", timestamp: Date.now() }));

// tRPC handler
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

  // Set response headers
  response.headers.forEach((value, key) => {
    c.header(key, value);
  });

  // Return response body
  return c.body(response.body, response.status);
});

// API info
app.get("/", (c) => c.json({
  name: "OBO API",
  version: "0.0.1",
  endpoints: {
    health: "/health",
    trpc: "/trpc",
  },
}));

// ---------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------

const port = parseInt(process.env.PORT || "3001");

console.log(`🚀 OBO API server starting on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`✅ OBO API server ready at http://localhost:${port}`);
