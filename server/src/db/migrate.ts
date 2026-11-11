import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createPool, type RowDataPacket } from "mysql2/promise";

const migrations = [
  { id: "0001_initial_schema", file: resolve(dirname(fileURLToPath(import.meta.url)), "../../../db/migrations/0001_initial_schema.sql") },
] as const;

/**
 * Apply only unrecorded, committed migrations. Each file is reviewed and additive/idempotent;
 * completion is recorded only after every statement has succeeded. This script is never run
 * as an import side effect. Managed development and publication share the same database.
 */
export async function runMigrations(databaseUrl = process.env.DATABASE_URL): Promise<void> {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required. Set it and explicitly run: pnpm --filter @nova/server db:migrate");
  }

  const pool = createPool(databaseUrl);
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS \`_nova_migrations\` (
      \`migration_id\` VARCHAR(128) NOT NULL PRIMARY KEY,
      \`completed_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    for (const migration of migrations) {
      const [rows] = await pool.execute<(RowDataPacket & { migration_id: string })[]>(
        "SELECT migration_id FROM _nova_migrations WHERE migration_id=? LIMIT 1",
        [migration.id],
      );
      if (rows.length) {
        console.log(`NOVA migration already applied: ${migration.id}`);
        continue;
      }

      const sql = await readFile(migration.file, "utf8");
      const statements = sql.split(";").map((statement) => statement.trim()).filter(Boolean);
      for (const statement of statements) await pool.query(statement);
      await pool.execute("INSERT INTO _nova_migrations (migration_id) VALUES (?)", [migration.id]);
      console.log(`NOVA migration completed: ${migration.id}`);
    }
  } finally {
    await pool.end();
  }
}

const invokedPath = process.argv[1];
if (invokedPath && pathToFileURL(resolve(invokedPath)).href === import.meta.url) {
  runMigrations().catch((error: unknown) => {
    console.error("NOVA database migration failed:", error);
    process.exitCode = 1;
  });
}
