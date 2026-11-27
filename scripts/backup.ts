/**
 * Backs up the database and all photos/receipts into backups/<timestamp>/.
 *
 *   pnpm backup            # the Docker setup (db + app containers)
 *   pnpm backup --local    # dev setup: uploads from ./uploads (or UPLOAD_DIR)
 *
 * Restore: see README → Backups.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const local = process.argv.includes("--local");
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const dir = path.join(process.cwd(), "backups", stamp);
fs.mkdirSync(dir, { recursive: true });

const user = process.env.POSTGRES_USER ?? "spendsense";
const db = process.env.POSTGRES_DB ?? "spendsense";

console.log("Dumping database…");
const sql = execFileSync("docker", ["compose", "exec", "-T", "db", "pg_dump", "-U", user, "-d", db, "--clean", "--if-exists"], {
  maxBuffer: 1024 * 1024 * 1024,
});
fs.writeFileSync(path.join(dir, "database.sql"), sql);

console.log("Copying photos and receipts…");
if (local) {
  const src = path.resolve(process.env.UPLOAD_DIR ?? "./uploads");
  if (fs.existsSync(src)) fs.cpSync(src, path.join(dir, "uploads"), { recursive: true });
} else {
  execFileSync("docker", ["compose", "cp", "app:/data/uploads", path.join(dir, "uploads")], { stdio: "inherit" });
}

console.log(`Backup written to ${path.relative(process.cwd(), dir)}`);
