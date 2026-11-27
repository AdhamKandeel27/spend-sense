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
- All three run on your own computer, packaged so they start with one command.

## Decisions we made, and why

| Decision | Why |
| --- | --- |
| **You type purchases in; no bank connection** | Keeps your financial data private and keeps you aware of each purchase. |
| **Photos and receipts are central** | You remember things by seeing them. Receipts matter for returns and warranties. |
| **Spaces** for grouping | One idea that covers the house now and daily life, trips and more later. |
| **Categories *and* rooms** | "What is it" and "where does it go" are different questions. Both give useful totals. |
| **Two prices for discounts** (before / paid) | Shows exactly how much you saved, without needing extra photos. |
| **EGP only, for now** | Matches today's need. The database already stores a currency per space for later. |
| **Runs on your own computer, free** | No monthly costs during the trial phase. It can move to a server later without a rewrite. |
| **Files stored on disk, not a cloud service** | Free and simple. The code is written so cloud storage can replace it later. |
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
- **PostgreSQL 17** via **Drizzle ORM**. Schema in `src/db/schema.ts`, SQL migrations in `drizzle/`.
- **Better Auth**: email and password sessions stored in our own Postgres. It's self-hosted, with no third-party account.
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
| `src/lib/storage/` | `FileStorage` interface plus a local-disk driver |
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

1. The browser downscales the photos (canvas → JPEG, about 2000 px), then submits the form to a Server Action. The body limit is 25 MB.
2. The action re-checks the session and space ownership, then validates the fields.
3. sharp processes the files, which are written to storage.
4. Inside one DB transaction: find-or-create the category, room and vendor, insert the purchase, then insert the attachment rows.
5. If anything fails, the written files are deleted. The cache is then revalidated and you're redirected to the purchase.

Cache Components is on. All user data is request-time (behind `<Suspense>`), and nothing user-specific is cached on the server.

### Docker setup

`docker-compose.yml` defines two services and two named volumes:

| Service | What it runs | Port |
| --- | --- | --- |
| `db` | `postgres:17-alpine`, data in volume `pgdata` | `127.0.0.1:5434` (host) → 5432 |
| `app` | Multi-stage image: `pnpm build` → Next.js **standalone** server on Node 24 Alpine, running as a non-root user | `5000` (host) → 3000 |

- **Migrations** run automatically when the `app` container starts (`RUN_MIGRATIONS=true`, via `src/instrumentation.ts`).
- **Uploads** live in volume `uploads`, mounted at `/data/uploads`. Volumes survive rebuilds; `pnpm backup` dumps the DB and copies the uploads out.
- **Secrets** come from `.env`, which is not committed. `BETTER_AUTH_SECRET` is required in production, and the app refuses to start without it.
- **Development** runs only `db` in Docker (`pnpm db:up`) and the app with `pnpm dev`. Env vars default to the Compose database and `./uploads`.

### Security notes

- Authorization lives in the data layer and in each action and route handler, not in the proxy.
- Files are only reachable through the authenticated route: `Cache-Control: private` and `nosniff`. Storage keys are validated against a strict pattern to prevent path traversal.
- The CSV export guards against formula injection.
- `TRUSTED_ORIGINS` allows extra sign-in origins (for example a phone on the LAN).

### Moving off this machine later

- **Server:** copy the `pgdata` and `uploads` volumes (or restore a `pnpm backup`) and run the same `docker compose up`.
- **Cloud storage:** add an S3-compatible driver (R2, MinIO, AWS) behind `FileStorage` in `src/lib/storage`. Feature code doesn't change.
- **Phone install (PWA):** the manifest and icons are already in place; installing just needs the site served over HTTPS.
