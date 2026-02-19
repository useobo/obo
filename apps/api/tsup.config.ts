import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node22",
  clean: true,
  sourcemap: true,
  external: [
    "@useobo/core",
    "@useobo/core/*",
    "@useobo/crypto",
    "@useobo/providers",
    "@useobo/providers/*",
    "@obo/db",
    "@trpc/server",
    "hono",
    "zod",
    "drizzle-orm",
  ],
});
