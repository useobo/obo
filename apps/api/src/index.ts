/**
 * OBO API Server
 *
 * Hono + tRPC backend for the OBO dashboard.
 * Handles slip management, policy evaluation, and provider coordination.
 */

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
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
      return slipService.requestSlip({
        actor: "api",
        principal: input.principal,
        target: input.target,
        requested_scope: input.requested_scope,
        ttl: input.ttl,
        reason: input.reason,
      });
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

// tRPC handler (placeholder - we'll wire this up properly when we add the web app)
app.get("/trpc", (c) => c.json({ message: "tRPC endpoint coming soon" }));

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
