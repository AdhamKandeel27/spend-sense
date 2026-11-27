import { runMigrations } from "../src/db/migrate";

const url = process.env.DATABASE_URL ?? "postgres://spendsense:spendsense@localhost:5434/spendsense";

runMigrations(url)
  .then(() => console.log("Migrations applied."))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
