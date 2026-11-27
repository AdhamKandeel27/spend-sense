# Spend Sense

A visual record of everything you buy, grouped into the projects of your life.

Snap a photo of what you bought, attach the receipt, enter what you paid (and what it cost before the discount), and file it into a **Space**, such as *New Home*. Later, browse everything you bought, filter it by category, room, or vendor, and see where the money went.

## What's in Milestone 1

- **Spaces:** separate collections of purchases (*New Home* first), each with its own colour. A new space can start with home-build categories and rooms.
- **Add a purchase in seconds:** take or choose photos, snap or upload the receipt or invoice (image or PDF), enter the total, and optionally:
  - the price before discount (savings are shown);
  - quantity × unit price (for example 45 m² × 850);
  - category, room/area, vendor, date, and notes.

  Photos are downscaled on the phone before upload.
- **Overview:** total spent and saved, a **deck strip** that fans categories out by share like paint chips, totals by category and room, and recent purchases.
- **Purchases list:** search, filter by category (tap a chip), room, vendor, or date range, and sort. Switch between a grid and a list. A running total stays pinned at the bottom.
- **Export:** a CSV of exactly what the list shows. It opens correctly in Excel, Arabic text included.
- **Space settings:** rename the space, recolour it, and manage categories and rooms.
- **Installable:** add it to your phone's home screen.
- **Private by default:** photos and receipts are served only to the signed-in owner. Location data (GPS) is stripped from photos.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Server Actions, Cache Components), TypeScript, Tailwind CSS 4
- PostgreSQL 17 with [Drizzle ORM](https://orm.drizzle.team)
- [Better Auth](https://www.better-auth.com) (email and password, self-hosted; no external account needed)
- [sharp](https://sharp.pixelplumbing.com) for image processing. Files are stored on local disk behind a small storage interface (`src/lib/storage`), so they can move to S3-compatible storage later.
- Docker and Docker Compose

## Run it

You need Docker Desktop. For development you also need Node 24+ and pnpm.

### 1. Create a `.env` file

Create `.env` in the project root:

```env
# Required. Generate one with:
#   node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
BETTER_AUTH_SECRET=paste-a-long-random-string-here

# The address you open the app at.
BETTER_AUTH_URL=http://localhost:5000

# Optional: other addresses allowed to sign in, comma-separated
# (e.g. your PC's Wi-Fi address for using it from your phone).
TRUSTED_ORIGINS=

# Optional: sign-up closes after the first account. Set to true to allow more.
ALLOW_SIGNUP=false
```

### 2a. Run everything in Docker (the everyday way)

```bash
docker compose up -d --build
```

Open <http://localhost:5000>, choose **Create your account** (the first account becomes the owner, and sign-up then closes), and create your first space.

Data lives in two Docker volumes: `pgdata` for the database and `uploads` for photos and receipts. They survive restarts and rebuilds.

### 2b. Develop locally

```bash
pnpm install
pnpm db:up        # Postgres in Docker on localhost:5434
pnpm db:migrate   # create the tables
pnpm dev          # http://localhost:5000
```

In development the database URL defaults to the Compose database and uploads go to `./uploads`.

## Using it from your phone

1. Make sure your phone and PC are on the same Wi-Fi.
2. Find your PC's local IP address (`ipconfig` → IPv4 Address, for example `192.168.1.20`).
3. Add `TRUSTED_ORIGINS=http://192.168.1.20:5000` to `.env`, then run `docker compose up -d`.
4. On the phone, open `http://192.168.1.20:5000`.

Taking photos and uploading work over plain `http` on your network. **Add to Home Screen as an app** needs HTTPS, which is what a later deployment with a domain provides. Until then you can still add a bookmark to the home screen.

## Backups

```bash
pnpm backup           # Docker setup
pnpm backup --local   # dev setup (./uploads)
```

This writes `backups/<timestamp>/database.sql` plus an `uploads/` folder. To restore:

```bash
docker compose exec -T db psql -U spendsense -d spendsense < backups/<timestamp>/database.sql
docker compose cp backups/<timestamp>/uploads/. app:/data/uploads
```

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Dev server |
| `pnpm build` / `pnpm start` | Production build and server |
| `pnpm typecheck` / `pnpm lint` | Type checking and linting |
| `pnpm db:up` | Start only Postgres |
| `pnpm db:generate` | Create a migration after editing `src/db/schema.ts` |
| `pnpm db:migrate` | Apply migrations (Docker applies them automatically on start) |
| `pnpm db:studio` | Browse the database |
| `pnpm backup` | Back up the database and files |
| `pnpm icons` | Regenerate app icons |
| `pnpm tsx scripts/seed-demo.ts <email>` | Fill a `*_test` database with demo data |

## Project layout

```
src/
  app/
    (auth)/             sign-in, sign-up
    (app)/              signed-in app: spaces, overview, purchases, settings, account
    api/auth/           Better Auth endpoints
    api/files/          private photo/receipt delivery (ownership-checked)
    api/spaces/…/export CSV export
  components/           UI primitives, deck strip, purchase tiles, nav
  db/                   Drizzle schema, client, migrator
  lib/
    data.ts             data access layer (every read checks ownership)
    actions/            server actions (spaces, purchases)
    storage/            file storage interface + local-disk driver
    images.ts           upload processing (resize, WebP, strip metadata)
drizzle/                SQL migrations
```

Money is stored as integer piastres (1 EGP = 100), so totals never drift.

## Roadmap

- **M2: home-build depth.** Warranty dates and reminders, payment status and instalments, budgets, wishlist and quotes.
- **M3: living in the home.** Everyday spaces with monthly views, faster photo-less logging, recurring expenses.
- **M4: household.** Invite family, track who paid.
- **Later: AI capture.** Upload a receipt, OCR reads it, and an agent fills in the purchase for you to confirm.
