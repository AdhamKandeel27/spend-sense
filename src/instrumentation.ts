// Runs once when the Next.js server starts. In Docker (RUN_MIGRATIONS=true)
// it brings the database schema up to date before serving requests.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.RUN_MIGRATIONS !== "true") return;

  // Supabase: migrations go through the session pooler, not the transaction pooler.
  const url = process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required to run migrations");

  const { runMigrations } = await import("./db/migrate");
  await runMigrations(url);
  console.log("[spend-sense] database migrations applied");
}
