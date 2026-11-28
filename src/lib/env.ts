import "server-only";
import { z } from "zod";

// `next build` loads server modules without runtime secrets; validate strictly only when serving.
const isBuild = process.env.NEXT_PHASE === "phase-production-build";
const isProd = process.env.NODE_ENV === "production" && !isBuild;

/** Required at runtime; tolerated as missing only while `next build` collects pages. */
const required = (message: string) => (isBuild ? z.string().default("") : z.string({ error: message }).min(1, message));

// There are no local fallbacks: the database and files always live on
// Supabase, so a missing value fails loudly instead of silently using
// something else.
const schema = z.object({
  /** Supabase transaction pooler (port 6543). */
  DATABASE_URL: required("DATABASE_URL is missing: set it to the Supabase transaction pooler URL (port 6543)."),
  NEXT_PUBLIC_SUPABASE_URL: required("NEXT_PUBLIC_SUPABASE_URL is missing: set it to the Supabase project URL."),
  SUPABASE_SECRET_KEY: required("SUPABASE_SECRET_KEY is missing: set it to the Supabase secret key."),
  SUPABASE_BUCKET: z.string().default("attachments"),
  BETTER_AUTH_SECRET: isProd
    ? z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters")
    : z.string().default("dev-only-secret-change-me-dev-only-secret"),
  // The app's own address. On Vercel it defaults to the production domain.
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

export const env = schema.parse(process.env);
