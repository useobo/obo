/**
 * OBO Database
 *
 * Database client and connection utilities.
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let client: postgres.Sql | null = null;
let db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!db) {
    const url = process.env.DATABASE_URL || "postgresql://kyle@localhost:5432/obo";
    client = postgres(url);
    db = drizzle(client, { schema });
  }
  return db;
}

export { schema };
