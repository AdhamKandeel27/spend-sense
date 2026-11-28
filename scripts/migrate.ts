import { loadEnvConfig } from "@next/env";
import { runMigrations } from "../src/db/migrate";

// Same .env files Next.js reads.
loadEnvConfig(process.cwd());

// Migrations need a session connection (Supabase session pooler, port 5432);
// the transaction pooler the app uses can't run them reliably.
const url =
  process.env.DATABASE_URL_DIRECT ??
  process.env.DATABASE_URL ??
  "postgres://spendsense:spendsense@localhost:5434/spendsense";

console.log(`Migrating ${new URL(url).hostname}…`);

runMigrations(url)
  .then(() => console.log("Migrations applied."))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
