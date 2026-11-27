import "server-only";
import path from "node:path";
import { z } from "zod";

const isProd = process.env.NODE_ENV === "production";

// Development falls back to the docker compose defaults so `pnpm dev` works
// without a .env file. Production must provide real values.
const schema = z.object({
  DATABASE_URL: isProd
    ? z.string().min(1)
    : z.string().default("postgres://spendsense:spendsense@localhost:5434/spendsense"),
  BETTER_AUTH_SECRET: isProd
    ? z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters")
    : z.string().default("dev-only-secret-change-me-dev-only-secret"),
  BETTER_AUTH_URL: z.string().default("http://localhost:3000"),
  ALLOW_SIGNUP: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  UPLOAD_DIR: z.string().default("./uploads"),
});

const parsed = schema.parse(process.env);

export const env = {
  ...parsed,
  UPLOAD_DIR: path.resolve(parsed.UPLOAD_DIR),
};
