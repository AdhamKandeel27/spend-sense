# Spend Sense

A visual record of everything you buy, grouped into the projects of your life.

Snap a photo of what you bought, attach the receipt, enter what you paid (and what it cost before the discount), and file it into a **Space**, such as *New Home*. Later, browse everything you bought, filter it by category, room, or vendor, and see where the money went.

> Status: early development. Milestone 1 (home-build tracker) is in progress.

## Planned for Milestone 1

- **Spaces:** separate collections of purchases (for example *New Home*)
- **Purchases:** name, product photo, receipt or invoice, price paid, optional original price (savings are shown), quantity × unit price, category, room/area, vendor, date, and notes
- **Browse:** search, filters, and totals by category, room, and vendor
- **Export:** CSV
- **Installable:** add it to your phone's home screen
- **Currency:** EGP

## Stack

- [Next.js](https://nextjs.org) (App Router, TypeScript)
- PostgreSQL with [Drizzle ORM](https://orm.drizzle.team)
- [Better Auth](https://www.better-auth.com) for sign-in
- Images stored on local disk behind a storage interface, so they can move to S3-compatible storage later
- Docker and Docker Compose

Setup instructions will be added as the app takes shape.
