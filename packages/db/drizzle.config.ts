import type { Config } from "drizzle-kit";

export default {
  schema: "./src/schema",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://kyle@localhost:5432/obo",
  },
} satisfies Config;
