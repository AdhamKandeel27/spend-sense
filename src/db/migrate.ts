import path from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { poolConfig } from "./pool-config";

/** Applies pending SQL migrations from ./drizzle. Safe to run on every boot. */
export async function runMigrations(databaseUrl: string) {
  const pool = new Pool(poolConfig(databaseUrl, 1));
  try {
    await migrate(drizzle(pool), { migrationsFolder: path.join(process.cwd(), "drizzle") });
  } finally {
    await pool.end();
  }
}
