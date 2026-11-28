import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "@/lib/env";
import { poolConfig } from "./pool-config";
import * as schema from "./schema";

// Reuse one pool across hot reloads in development.
const globalForDb = globalThis as unknown as { pool?: Pool };

// Small pool: on Vercel every function instance opens its own, and the
// Supabase transaction pooler (port 6543) multiplexes them.
const pool = globalForDb.pool ?? new Pool(poolConfig(env.DATABASE_URL, 5));
if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

export const db = drizzle(pool, { schema, casing: "snake_case" });
export { schema };
