/**
 * Fills a space with synthetic demo purchases (for screenshots / local testing).
 *
 *   DATABASE_URL=... UPLOAD_DIR=... pnpm tsx scripts/seed-demo.ts demo@example.com
 *
 * Refuses to run against a database whose name doesn't end in _test or _demo,
 * so it can never touch your real data.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import sharp from "sharp";
import * as schema from "../src/db/schema";
import { HOME_TEMPLATE } from "../src/lib/palette";

const url = process.env.DATABASE_URL ?? "";
const dbName = url.split("/").pop()?.split("?")[0] ?? "";
if (!/_(test|demo)$/.test(dbName)) {
  console.error(`Refusing to seed "${dbName}". Use a database ending in _test or _demo.`);
  process.exit(1);
}
const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? "./uploads");
const email = process.argv[2];
if (!email) {
  console.error("Usage: tsx scripts/seed-demo.ts <email>");
  process.exit(1);
}

const pool = new Pool({ connectionString: url });
const db = drizzle(pool, { schema, casing: "snake_case" });

type Demo = {
  name: string;
  cat: string;
  room: string;
  vendor: string;
  daysAgo: number;
  paid: number;
  original?: number;
  qty?: number;
  unit?: string;
  unitPrice?: number;
  hue: [string, string];
  photo?: boolean;
};

const DEMO: Demo[] = [
  { name: "Carrara marble slabs", cat: "Flooring & marble", room: "Living room", vendor: "Shaq El Teaban Marble Co.", daysAgo: 3, paid: 38250, qty: 45, unit: "mÂ²", unitPrice: 850, hue: ["#e9e8e4", "#9aa0a6"] },
  { name: "Built-in oven 60 cm", cat: "Kitchen", room: "Kitchen", vendor: "Kitchen Gallery", daysAgo: 2, paid: 24999, original: 28500, hue: ["#2b2d31", "#8b8f96"] },
  { name: "Porcelain floor tiles 60Ã—60", cat: "Ceramics & tiles", room: "Master bath", vendor: "Ceramica Store", daysAgo: 9, paid: 16800, qty: 42, unit: "mÂ²", unitPrice: 400, hue: ["#cfc7bb", "#a39787"] },
  { name: "Refrigerator No-Frost 18 ft", cat: "Appliances", room: "Kitchen", vendor: "Electro Home", daysAgo: 6, paid: 31400, original: 34999, hue: ["#d9dde1", "#7d858d"] },
  { name: "Quartz countertop", cat: "Kitchen", room: "Kitchen", vendor: "Kitchen Gallery", daysAgo: 12, paid: 24180, qty: 6.2, unit: "m", unitPrice: 3900, hue: ["#f1f0ec", "#b8b4ab"] },
  { name: "Wall-hung toilet + concealed cistern", cat: "Plumbing & sanitary", room: "Guest bath", vendor: "Sanitary House", daysAgo: 15, paid: 13750, hue: ["#f4f4f2", "#c8ccd0"] },
  { name: "Pendant lights (set of 3)", cat: "Lighting & electrical", room: "Dining", vendor: "LumiÃ¨re Lighting", daysAgo: 20, paid: 7200, original: 9000, qty: 3, unit: "pcs", unitPrice: 2400, hue: ["#2e2a24", "#c9a45c"] },
  { name: "Galala marble skirting", cat: "Flooring & marble", room: "Reception", vendor: "Shaq El Teaban Marble Co.", daysAgo: 24, paid: 5400, qty: 36, unit: "m", unitPrice: 150, hue: ["#efe6d6", "#c9b48e"] },
  { name: "Dishwasher 14 place", cat: "Appliances", room: "Kitchen", vendor: "Electro Home", daysAgo: 27, paid: 18999, hue: ["#c9ccd0", "#6b7178"] },
  { name: "Interior paint, 18 L", cat: "Paint & finishes", room: "Whole house", vendor: "Paint Center", daysAgo: 30, paid: 4600, qty: 4, unit: "buckets", unitPrice: 1150, hue: ["#e7e2d8", "#a9b59b"], photo: false },
  { name: "Rain shower set", cat: "Plumbing & sanitary", room: "Master bath", vendor: "Sanitary House", daysAgo: 33, paid: 9850, original: 11200, hue: ["#b9bec4", "#5f666d"] },
  { name: "Wardrobe sliding doors", cat: "Furniture", room: "Master bedroom", vendor: "Home Center", daysAgo: 38, paid: 27500, hue: ["#7a5c43", "#3b2d22"] },
];

function photoSvg([a, b]: [string, string], seed: number) {
  const streaks = Array.from({ length: 7 }, (_, i) => {
    const y = ((seed * 37 + i * 83) % 600) + 50;
    return `<path d="M-20 ${y} C 200 ${y - 80}, 400 ${y + 90}, 820 ${y - 30}" stroke="${b}" stroke-opacity="0.35" stroke-width="${2 + (i % 3) * 3}" fill="none"/>`;
  }).join("");
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800"><defs><radialGradient id="g" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient></defs><rect width="800" height="800" fill="url(#g)"/>${streaks}<text x="24" y="776" font-family="sans-serif" font-size="22" fill="#000" fill-opacity="0.35">DEMO PHOTO</text></svg>`,
  );
}

async function main() {
  const owner = await db.query.user.findFirst({ where: eq(schema.user.email, email) });
  if (!owner) throw new Error(`No user ${email}`);

  const [space] = await db.insert(schema.spaces).values({ ownerId: owner.id, name: "New Home", description: "Demo data" }).returning();
  const cats = await db
    .insert(schema.categories)
    .values(HOME_TEMPLATE.categories.map((name, i) => ({ spaceId: space.id, name, color: i, sortOrder: i })))
    .returning();
  const rms = await db
    .insert(schema.rooms)
    .values(HOME_TEMPLATE.rooms.map((name, i) => ({ spaceId: space.id, name, sortOrder: i })))
    .returning();
  const vendorIds = new Map<string, string>();

  for (const [i, d] of DEMO.entries()) {
    if (!vendorIds.has(d.vendor)) {
      const [v] = await db.insert(schema.vendors).values({ ownerId: owner.id, name: d.vendor }).returning();
      vendorIds.set(d.vendor, v.id);
    }
    const date = new Date(Date.now() - d.daysAgo * 86400000).toISOString().slice(0, 10);
    const [p] = await db
      .insert(schema.purchases)
      .values({
        spaceId: space.id,
        name: d.name,
        categoryId: cats.find((c) => c.name === d.cat)!.id,
        roomId: rms.find((r) => r.name === d.room)!.id,
        vendorId: vendorIds.get(d.vendor)!,
        purchasedOn: date,
        quantity: String(d.qty ?? 1),
        unit: d.unit ?? null,
        unitPrice: d.unitPrice ? d.unitPrice * 100 : null,
        totalPaid: d.paid * 100,
        originalTotal: d.original ? d.original * 100 : null,
      })
      .returning();

    if (d.photo !== false) {
      const id = crypto.randomUUID();
      const dir = path.join(uploadDir, space.id, p.id);
      await fs.mkdir(dir, { recursive: true });
      const main = await sharp(photoSvg(d.hue, i)).webp({ quality: 80 }).toBuffer();
      const thumb = await sharp(main).resize(480, 480).webp({ quality: 72 }).toBuffer();
      await fs.writeFile(path.join(dir, `${id}.webp`), main);
      await fs.writeFile(path.join(dir, `${id}-thumb.webp`), thumb);
      await db.insert(schema.attachments).values({
        id,
        purchaseId: p.id,
        kind: "photo",
        storageKey: `${space.id}/${p.id}/${id}.webp`,
        thumbKey: `${space.id}/${p.id}/${id}-thumb.webp`,
        mimeType: "image/webp",
        sizeBytes: main.length,
        width: 800,
        height: 800,
        originalName: "demo.webp",
      });
    }
  }
  console.log(`Seeded space ${space.id} with ${DEMO.length} demo purchases.`);
  await pool.end();
}

main().catch(async (e) => {
  console.error(e);
  await pool.end();
  process.exit(1);
});
