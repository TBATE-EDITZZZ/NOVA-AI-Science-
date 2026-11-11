import { drizzle } from "drizzle-orm/mysql2";
import { createPool, type Pool } from "mysql2/promise";
import * as schema from "./schema.js";

export type NovaDatabase = ReturnType<typeof drizzle<typeof schema>>;

/** Create a pool only when application code explicitly requests the database. */
export function createDatabase(databaseUrl = process.env.DATABASE_URL): {
  db: NovaDatabase;
  pool: Pool;
} {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to connect to the NOVA database.");
  }

  const pool = createPool(databaseUrl);
  const db = drizzle(pool, { schema, mode: "default" });
  return { db: db as unknown as NovaDatabase, pool };
}
