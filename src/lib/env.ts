import "server-only";
import path from "node:path";
import { z } from "zod";

// `next build` loads server modules without runtime secrets; validate strictly only when serving.
const isBuild = process.env.NEXT_PHASE === "phase-production-build";
const isProd = process.env.NODE_ENV === "production" && !isBuild;

// Development falls back to the docker compose defaults so `pnpm dev` works
// without a .env file. Production must provide real values.
const schema = z.object({
  DATABASE_URL: isProd
    ? z.string().min(1)
    : z.string().default("postgres://spendsense:spendsense@localhost:5434/spendsense"),
  BETTER_AUTH_SECRET: isProd
    ? z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters")
    : z.string().default("dev-only-secret-change-me-dev-only-secret"),
  // On Vercel this defaults to the project's production domain (set by Vercel).
  BETTER_AUTH_URL: z
    .string()
    .default(
      process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : "http://localhost:5000",
    ),
  ALLOW_SIGNUP: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  UPLOAD_DIR: z.string().default("./uploads"),
  /** When both are set, files go to Supabase Storage; otherwise to UPLOAD_DIR on disk. */
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SECRET_KEY: z.string().min(1).optional(),
  SUPABASE_BUCKET: z.string().default("attachments"),
  /** Extra origins allowed to sign in, e.g. http://192.168.1.20:5000 for your phone on Wi-Fi. */
  TRUSTED_ORIGINS: z
    .string()
    .default("")
    .transform((v) => [
      ...v.split(",").map((s) => s.trim()).filter(Boolean),
      // Vercel also serves each deployment at its own URL; allow sign-in there too.
      ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ]),
});

const parsed = schema.parse(process.env);

export const env = {
  ...parsed,
  UPLOAD_DIR: path.resolve(parsed.UPLOAD_DIR),
};
