/**
 * Backs up the Supabase database and every photo/receipt into backups/<timestamp>/.
 *
 *   pnpm backup
 *
 * Needs Docker (pg_dump runs in a postgres:17 container, so nothing has to be
 * installed) and DATABASE_URL_DIRECT, NEXT_PUBLIC_SUPABASE_URL and
 * SUPABASE_SECRET_KEY in .env. Restore: see README → Backups.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

loadEnvConfig(process.cwd());

const dbUrl = process.env.DATABASE_URL_DIRECT;
const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const sbKey = process.env.SUPABASE_SECRET_KEY;
const bucketName = process.env.SUPABASE_BUCKET ?? "attachments";
if (!dbUrl || !sbUrl || !sbKey) {
  console.error("Set DATABASE_URL_DIRECT, NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env");
  process.exit(1);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const dir = path.join(process.cwd(), "backups", stamp);
fs.mkdirSync(dir, { recursive: true });

const bucket = createClient(sbUrl, sbKey, { auth: { persistSession: false } }).storage.from(bucketName);

/** Every file path in the bucket (folders are listed recursively). */
async function listAll(prefix = ""): Promise<string[]> {
  const out: string[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await bucket.list(prefix, { limit: 1000, offset });
    if (error) throw error;
    for (const item of data) {
      const full = prefix ? `${prefix}/${item.name}` : item.name;
      // Folders have no id.
      if (item.id) out.push(full);
      else out.push(...(await listAll(full)));
    }
    if (data.length < 1000) return out;
  }
}

async function main() {
  console.log("Dumping database…");
  // Only our tables (public schema); Supabase's own schemas are recreated by Supabase.
  const sql = execFileSync(
    "docker",
    ["run", "--rm", "postgres:17-alpine", "pg_dump", dbUrl!, "--schema=public", "--no-owner", "--no-privileges", "--clean", "--if-exists"],
    { maxBuffer: 1024 * 1024 * 1024 },
  );
  fs.writeFileSync(path.join(dir, "database.sql"), sql);

  console.log("Downloading photos and receipts…");
  const keys = (await listAll()).filter((k) => !k.startsWith("incoming/"));
  for (const key of keys) {
    const { data, error } = await bucket.download(key);
    if (error) throw new Error(`${key}: ${error.message}`);
    const file = path.join(dir, "files", ...key.split("/"));
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, Buffer.from(await data.arrayBuffer()));
  }

  console.log(`Backup written to ${path.relative(process.cwd(), dir)} (${keys.length} files)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
