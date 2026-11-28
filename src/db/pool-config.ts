import type { PoolConfig } from "pg";

/**
 * Connection settings shared by the app and the migration runner.
 * Hosted Postgres (Supabase) needs TLS; the local Docker database doesn't.
 * Supabase signs its server certificate with its own CA, so we encrypt
 * without verifying the chain (the common setup for its pooler).
 */
export function poolConfig(connectionString: string, max: number): PoolConfig {
  const host = new URL(connectionString).hostname;
  const hosted = host.endsWith(".supabase.com") || host.endsWith(".supabase.co");
  return {
    connectionString,
    max,
    ...(hosted ? { ssl: { rejectUnauthorized: false } } : {}),
  };
}
