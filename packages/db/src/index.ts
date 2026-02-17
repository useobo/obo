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

/**
 * Generate a unique ID using UUID or timestamp fallback
 */
export function genId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 11);
  return `${timestamp}_${random}`;
}
