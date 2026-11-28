import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

loadEnvConfig(process.cwd());

// Session pooler (port 5432): drizzle-kit needs a session connection.
const url = process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL;
if (!url) throw new Error("Set DATABASE_URL_DIRECT (Supabase session pooler) in .env");

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url },
  strict: true,
});
