# Spend Sense: Architecture

## What the app does

Spend Sense keeps a record of everything you buy, with a photo of each item and the receipt.

- Purchases are grouped into **Spaces**, one for each life project (for example *New Home*).
- Each purchase records what it was, what you paid, what it cost before any discount, how many you bought, which **category** it is (Flooring, Appliances…), which **room** it goes in, and **where** you bought it.
- You can search, filter and export everything, and see at a glance where the money went.

It's built phone-first, so you can log a purchase right at the shop. It works just as well on a computer.

## How it works, in plain words

```
Your phone or computer
        │  (opens the app in the browser)
        ▼
   The app (website + logic)  ──►  Database (the text: names, prices, dates)
                              ──►  Files folder (photos and receipts)
```

- **The app** is the screens and the rules. It checks who you are before showing anything.
- **The database** stores the details of every purchase.
- **The files folder** stores the photos and receipts. Only you can open them: there are no public links.
- For now the database and the files live on **Supabase** (free tier) and the app runs on **Vercel**. This is temporary until we move to our own server. Running it on your own computer (with `pnpm dev` or Docker) uses the same Supabase project.

## Decisions we made, and why

| Decision | Why |
| --- | --- |
| **You type purchases in; no bank connection** | Keeps your financial data private and keeps you aware of each purchase. |
| **Photos and receipts are central** | You remember things by seeing them. Receipts matter for returns and warranties. |
| **Spaces** for grouping | One idea that covers the house now and daily life, trips and more later. |
| **Categories *and* rooms** | "What is it" and "where does it go" are different questions. Both give useful totals. |
| **Two prices for discounts** (before / paid) | Shows exactly how much you saved, without needing extra photos. |
| **EGP only, for now** | Matches today's need. The database already stores a currency per space for later. |
| **Free hosting (Vercel + Supabase free tiers)** | No monthly costs during the trial phase. It can move to a server later without a rewrite. |
| **Supabase for the database and files, for now** | Free hosting while there's no server. We only use its Postgres and a private Storage bucket, so moving off it is a change of settings, not code. |
| **Our own sign-in (Better Auth), not Supabase Auth** | Accounts live in our own tables, so they move with the database to any server. |
| **One owner account** | It's a personal app. Sign-up closes after the first account. |
| **Built in small milestones** | M1 covers the house build. New features come from what you notice while using it. |

## What's next (not built yet)

- **M2:** warranty dates, payment status and instalments, budgets, a wishlist and price quotes.
- **M3:** everyday spending (food, trips, nights out) with monthly views.
- **M4:** sharing with your household.
- **Later:** take a photo of a receipt, and AI reads it and fills in the purchase for you to confirm.

---

## Technical section

### Stack

- **Next.js 16** (App Router, TypeScript), with **Server Components** and **Server Actions**. There is no separate API layer for the UI.
- **PostgreSQL 17 on Supabase** via **Drizzle ORM**. Schema in `src/db/schema.ts`, SQL migrations in `drizzle/`.
- **Supabase Storage** (one private bucket) for photos and receipts.
- **Better Auth**: email and password sessions stored in our own Postgres tables. Supabase Auth is not used.
- **sharp** for image processing.
- **Tailwind CSS 4**. The design system is documented in `DESIGN.md`.

### Code layout

| Path | Purpose |
| --- | --- |
| `src/app/(auth)` | Sign-in and sign-up pages |
| `src/app/(app)` | The signed-in app (spaces, purchases, settings) |
| `src/app/api/files/[id]` | Serves photos and receipts after an ownership check |
| `src/app/api/spaces/[id]/export` | CSV export (honours list filters) |
| `src/lib/data.ts` | **Data access layer**: every read goes through `requireUser()` and checks space ownership |
| `src/lib/actions/` | Server Actions (all writes), with validation |
| `src/lib/storage/` | `FileStorage` interface with the Supabase Storage driver |
| `src/lib/env.ts` | All settings, validated. There are no local fallbacks: a missing database or Supabase value stops the app with an error naming it |
| `src/lib/uploads.ts` | Upload rules shared by the browser and the server (types, 9 MB limit, 10 files) |
| `src/lib/images.ts` | Upload pipeline: EXIF rotate, strip metadata (GPS), resize, WebP and a thumbnail; PDFs stored as-is |
| `src/proxy.ts` | Optimistic redirect to sign-in (not a security boundary) |

### Data model

```
user ─┬─< spaces ─┬─< categories
      │           ├─< rooms
      │           └─< purchases ─< attachments (photo | receipt)
      └─< vendors (shared across spaces) ──┘
```

- **Money** is stored as integer minor units (piastres) in `bigint` columns. `totalPaid` is the source of truth; `originalTotal` (before discount) and `unitPrice` are optional.
- **Ownership:** every row hangs off a space or a user. That makes a multi-user (SaaS) version a matter of permissions, not a data migration.
- **Deletes:** deleting a space cascades to its purchases and attachments, and the files are removed from storage.

### Request flow (adding a purchase)

1. The browser downscales the photos (canvas → JPEG, about 2000 px).
2. It asks the `prepareUploads` action for one signed upload URL per file (after an ownership check) and PUTs each file straight into `incoming/<spaceId>/` in the private bucket. This keeps requests under Vercel's 4.5 MB body limit.
3. The form is submitted with only the uploaded keys. The action re-checks the session and space ownership and validates the fields. It only accepts keys inside that space's `incoming/` folder, reads them back, and processes them with sharp. The final files are written to storage, and the `incoming/` copies are always deleted.
4. Inside one DB transaction: find-or-create the category, room and vendor, insert the purchase, then insert the attachment rows.
5. If anything fails, the written files are deleted. The cache is then revalidated and you're redirected to the purchase.

Cache Components is on. All user data is request-time (behind `<Suspense>`), and nothing user-specific is cached on the server.

### Docker setup

`docker-compose.yml` runs one service, `app`, which talks to Supabase like the Vercel deployment does. There is no local database and no volumes.

| Service | What it runs | Port |
| --- | --- | --- |
| `app` | Multi-stage image: `pnpm build` → Next.js **standalone** server on Node 24 Alpine, running as a non-root user | `5000` (host) → 3000 |

- **Migrations** run automatically when the container starts (`RUN_MIGRATIONS=true`, via `src/instrumentation.ts`), through `DATABASE_URL_DIRECT`.
- **Secrets** come from `.env`, which is not committed and is kept out of the image (`.dockerignore`). Compose refuses to start if a required value is missing.
- **Development:** `pnpm dev` uses the same `.env` and the same Supabase project.

### Security notes

- Authorization lives in the data layer and in each action and route handler, not in the proxy.
- Files are only reachable through the authenticated route: `Cache-Control: private` and `nosniff`. Storage keys are validated against a strict pattern to prevent path traversal.
- The CSV export guards against formula injection.
- `TRUSTED_ORIGINS` allows extra sign-in origins (for example a phone on the LAN).

### Hosting on Supabase and Vercel (current)

- `DATABASE_URL` is the Supabase **transaction pooler** (port 6543), used by the app. `DATABASE_URL_DIRECT` is the **session pooler** (port 5432), used by `pnpm db:migrate`, drizzle-kit and Docker's startup migrations. TLS is turned on automatically for `*.supabase.com` hosts.
- Run migrations from your machine (`pnpm db:migrate`). Vercel builds don't run them.
- The `attachments` bucket is private, with a 9 MB limit and image/PDF types only. Only the server uses the secret key.
- On Vercel, `BETTER_AUTH_URL` defaults to the production domain and each deployment's own URL is trusted for sign-in.
- `pnpm backup` dumps our tables (`pg_dump` in a container) and downloads every file from the bucket.

### Moving to our own server later

- **Database:** restore a `pnpm backup` into the server's Postgres and point `DATABASE_URL` at it. Better Auth accounts come along, because they're in our tables.
- **Files:** keep using Supabase Storage, or add a driver (server disk, S3, R2) behind `FileStorage` in `src/lib/storage`. Feature code doesn't change. A driver without signed upload URLs needs an upload route for the browser to send files to.
- **Phone install (PWA):** the manifest and icons are already in place; installing just needs the site served over HTTPS.
