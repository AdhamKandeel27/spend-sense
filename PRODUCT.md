# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

- Next.js (React). Fully responsive: phone first, and equally usable on tablet and desktop.
- Postgres (running in Docker), accessed through Drizzle ORM.
- Better Auth for sign-in. It is a self-hosted library, so there is no external account.
- Images and receipts are stored on disk in a Docker volume, behind a storage interface. This allows a switch to S3-compatible storage (for example Cloudflare R2) later. Supabase was considered and dropped because of cost as the app grows.
- Images are resized and converted to WebP when uploaded, and iPhone HEIC photos are accepted.
- Containerized with Docker and Docker Compose.
- The owner wants to be asked before any additional technology is adopted.

## Users

**Primary (now):** the owner, who is designing and building a new home and buying a lot for it: kitchen and home appliances, ceramics, marble flooring, and more. They need visibility on what they bought, what it cost, and what it looks like. The job: snap and log a purchase on the phone right after buying, then later review everything bought for the home and how much it all cost.

**Next:** the same person, and their household, living in the finished home and tracking everyday spending such as food, trips, nights out, and leisure.

**Later:** other people with the same need, if Spend Sense becomes a SaaS product. This is a possibility, not a commitment.

## Product Purpose

Spend Sense is a visual record of everything you buy, grouped into the projects of your life. It exists because buying many things for one big goal, like building a home, quickly becomes untraceable. Success: every home purchase is logged with a photo and its price, and the owner can always answer "what have we bought, and what has it cost so far?"

## Positioning

A purchase log built around photos and projects. Each entry is the thing you bought (its picture, what you paid, and what you saved), filed into a space such as "New Home". There is no bank or card connection, and entries are made by hand. A transaction ledger cannot give you this: you can see the actual marble, the actual fridge, and what each one cost.

## Operating Context

- Logging happens on a phone, often in or just after leaving a store or showroom: take a photo, enter the price, save.
- Review happens on phone or desktop: browsing what has been bought, totals by category, checking progress on the home build.
- Home-build buying involves many vendors, large items, and sometimes discounts (an original price and a paid price).

## Capabilities and Constraints

- **Terminology:** a "Space" groups purchases, for example "New Home". Inside a space, purchases have a **category** (what kind of thing it is) and a **room/area** (where it goes).
- **Confirmed for the first version (M1):**
  - Spaces.
  - Purchases with: name, product photo, receipt/invoice upload (very important), price paid, optional original price (the app shows the saving), quantity and unit price, category, room/area, vendor/store, date, and notes.
  - A view of all purchases.
  - Search, filters, and export.
  - Totals.
  - Install to the phone home screen.
- **Currency:** EGP only, for now.
- **Deferred:** warranty dates, payment status and instalments, budgets, wishlist and quotes, everyday-living spaces, household sharing, and SaaS features.
- **Future idea:** AI capture. Upload a receipt or photo, OCR extracts the text, and an LLM agent fills in the purchase form through a tool call. The owner reviews and confirms before it is saved. Until then, entry is manual.
- **Working style:** the owner wants to move step by step and not be overwhelmed. New features come from notes the owner takes while using the app, not from speculation.
- **Constraint:** no bank or card integrations.
- **Cost:** free during the MVP. No paid services.
- **SaaS readiness:** data should be scoped per user and per space from the start, so turning this into a multi-user product later does not need a rewrite.
- **Privacy:** receipts and photos are private. They are never served from public URLs.

## Evidence on Hand

None yet. There are no users, testimonials, metrics, or brand assets. Do not invent any.

## Product Principles

1. **Solve the home build first.** Every milestone has to be useful in the owner's life before it is useful to a market.
2. **The photo is the record.** A purchase is a thing you can see, not just a line in a ledger.
3. **Logging on the phone takes seconds.** Taking a photo, entering a price, and saving must be quick one-handed.
4. **Grouping by life project.** Spaces are central to the product: totals and browsing are organized around them.
5. **Built to grow.** Keep choices that make adding a household, a SaaS offering, and a storage migration straightforward later.
