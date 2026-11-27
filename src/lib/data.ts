import "server-only";
import { and, asc, count, desc, eq, gte, ilike, inArray, isNull, lte, or, sql, sum } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { attachments, categories, purchases, rooms, spaces, vendors } from "@/db/schema";
import { requireUser } from "@/lib/session";

/* -------------------------------------------------------------------------- */
/* Spaces                                                                     */
/* -------------------------------------------------------------------------- */

export type SpaceSummary = {
  id: string;
  name: string;
  description: string | null;
  color: number;
  currency: string;
  purchaseCount: number;
  totalPaid: number;
  totalSaved: number;
};

const savedExpr = sql<string>`coalesce(sum(greatest(coalesce(${purchases.originalTotal}, ${purchases.totalPaid}) - ${purchases.totalPaid}, 0)), 0)`;

export async function listSpaces(): Promise<SpaceSummary[]> {
  const user = await requireUser();
  const rows = await db
    .select({
      id: spaces.id,
      name: spaces.name,
      description: spaces.description,
      color: spaces.color,
      currency: spaces.currency,
      purchaseCount: count(purchases.id),
      totalPaid: sql<string>`coalesce(${sum(purchases.totalPaid)}, 0)`,
      totalSaved: savedExpr,
    })
    .from(spaces)
    .leftJoin(purchases, eq(purchases.spaceId, spaces.id))
    .where(and(eq(spaces.ownerId, user.id), isNull(spaces.archivedAt)))
    .groupBy(spaces.id)
    .orderBy(asc(spaces.createdAt));

  return rows.map((r) => ({ ...r, totalPaid: Number(r.totalPaid), totalSaved: Number(r.totalSaved) }));
}

/** Loads a space owned by the current user, or 404s. The ownership gate for everything below. */
export async function getSpace(spaceId: string) {
  const user = await requireUser();
  if (!isUuid(spaceId)) notFound();
  const space = await db.query.spaces.findFirst({
    where: and(eq(spaces.id, spaceId), eq(spaces.ownerId, user.id)),
  });
  if (!space) notFound();
  return space;
}

export async function getSpaceOptions(spaceId: string) {
  const space = await getSpace(spaceId);
  const [cats, rms, vnds] = await Promise.all([
    db.select().from(categories).where(eq(categories.spaceId, space.id)).orderBy(asc(categories.sortOrder), asc(categories.name)),
    db.select().from(rooms).where(eq(rooms.spaceId, space.id)).orderBy(asc(rooms.sortOrder), asc(rooms.name)),
    db.select().from(vendors).where(eq(vendors.ownerId, space.ownerId)).orderBy(asc(vendors.name)),
  ]);
  return { space, categories: cats, rooms: rms, vendors: vnds };
}

/** How many purchases use each category / room (for settings). */
export async function getUsageCounts(spaceId: string) {
  const space = await getSpace(spaceId);
  const [cats, rms] = await Promise.all([
    db.select({ id: purchases.categoryId, n: count() }).from(purchases).where(eq(purchases.spaceId, space.id)).groupBy(purchases.categoryId),
    db.select({ id: purchases.roomId, n: count() }).from(purchases).where(eq(purchases.spaceId, space.id)).groupBy(purchases.roomId),
  ]);
  return {
    categories: new Map(cats.map((c) => [c.id, c.n])),
    rooms: new Map(rms.map((r) => [r.id, r.n])),
  };
}

export type Breakdown ={ id: string | null; name: string; color: number; total: number; count: number };

export async function getSpaceOverview(spaceId: string) {
  const space = await getSpace(spaceId);

  const [totals] = await db
    .select({
      count: count(purchases.id),
      totalPaid: sql<string>`coalesce(${sum(purchases.totalPaid)}, 0)`,
      totalSaved: savedExpr,
    })
    .from(purchases)
    .where(eq(purchases.spaceId, space.id));

  const byCategoryRows = await db
    .select({
      id: categories.id,
      name: categories.name,
      color: categories.color,
      total: sql<string>`coalesce(${sum(purchases.totalPaid)}, 0)`,
      count: count(purchases.id),
    })
    .from(purchases)
    .leftJoin(categories, eq(categories.id, purchases.categoryId))
    .where(eq(purchases.spaceId, space.id))
    .groupBy(categories.id)
    .orderBy(desc(sql`coalesce(sum(${purchases.totalPaid}), 0)`));

  const byRoomRows = await db
    .select({
      id: rooms.id,
      name: rooms.name,
      total: sql<string>`coalesce(${sum(purchases.totalPaid)}, 0)`,
      count: count(purchases.id),
    })
    .from(purchases)
    .leftJoin(rooms, eq(rooms.id, purchases.roomId))
    .where(eq(purchases.spaceId, space.id))
    .groupBy(rooms.id)
    .orderBy(desc(sql`coalesce(sum(${purchases.totalPaid}), 0)`));

  const recent = await listPurchaseCards(space.id, { limit: 8 });

  return {
    space,
    count: totals.count,
    totalPaid: Number(totals.totalPaid),
    totalSaved: Number(totals.totalSaved),
    byCategory: byCategoryRows.map<Breakdown>((r) => ({
      id: r.id,
      name: r.name ?? "Uncategorised",
      color: r.color ?? -1,
      total: Number(r.total),
      count: r.count,
    })),
    byRoom: byRoomRows.map((r) => ({ id: r.id, name: r.name ?? "No room", total: Number(r.total), count: r.count })),
    recent,
  };
}

/* -------------------------------------------------------------------------- */
/* Purchases                                                                  */
/* -------------------------------------------------------------------------- */

export type PurchaseFilters = {
  q?: string;
  category?: string;
  room?: string;
  vendor?: string;
  from?: string;
  to?: string;
  sort?: "newest" | "oldest" | "highest" | "lowest";
};

export type PurchaseCard = {
  id: string;
  name: string;
  purchasedOn: string;
  quantity: string;
  unit: string | null;
  totalPaid: number;
  originalTotal: number | null;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: number | null;
  roomName: string | null;
  vendorName: string | null;
  photoId: string | null;
  receiptCount: number;
};

function filterConditions(spaceId: string, f: PurchaseFilters) {
  const conds = [eq(purchases.spaceId, spaceId)];
  const q = f.q?.trim();
  if (q) {
    const like = `%${q.replace(/[%_\\]/g, "\\$&")}%`;
    conds.push(or(ilike(purchases.name, like), ilike(purchases.notes, like), ilike(vendors.name, like))!);
  }
  if (f.category === "none") conds.push(isNull(purchases.categoryId));
  else if (f.category && isUuid(f.category)) conds.push(eq(purchases.categoryId, f.category));
  if (f.room === "none") conds.push(isNull(purchases.roomId));
  else if (f.room && isUuid(f.room)) conds.push(eq(purchases.roomId, f.room));
  if (f.vendor && isUuid(f.vendor)) conds.push(eq(purchases.vendorId, f.vendor));
  if (f.from && isIsoDate(f.from)) conds.push(gte(purchases.purchasedOn, f.from));
  if (f.to && isIsoDate(f.to)) conds.push(lte(purchases.purchasedOn, f.to));
  return and(...conds);
}

function orderFor(sort: PurchaseFilters["sort"]) {
  switch (sort) {
    case "oldest":
      return [asc(purchases.purchasedOn), asc(purchases.createdAt)];
    case "highest":
      return [desc(purchases.totalPaid), desc(purchases.purchasedOn)];
    case "lowest":
      return [asc(purchases.totalPaid), desc(purchases.purchasedOn)];
    default:
      return [desc(purchases.purchasedOn), desc(purchases.createdAt)];
  }
}

async function listPurchaseCards(
  spaceId: string,
  opts: { filters?: PurchaseFilters; limit?: number } = {},
): Promise<PurchaseCard[]> {
  const f = opts.filters ?? {};
  const firstPhoto = sql<string | null>`(
    select a.id from ${attachments} a
    where a.purchase_id = ${purchases.id} and a.kind = 'photo'
    order by a.position, a.created_at limit 1
  )`;
  const receiptCount = sql<number>`(
    select count(*)::int from ${attachments} a
    where a.purchase_id = ${purchases.id} and a.kind = 'receipt'
  )`;

  const query = db
    .select({
      id: purchases.id,
      name: purchases.name,
      purchasedOn: purchases.purchasedOn,
      quantity: purchases.quantity,
      unit: purchases.unit,
      totalPaid: purchases.totalPaid,
      originalTotal: purchases.originalTotal,
      categoryId: purchases.categoryId,
      categoryName: categories.name,
      categoryColor: categories.color,
      roomName: rooms.name,
      vendorName: vendors.name,
      photoId: firstPhoto,
      receiptCount,
    })
    .from(purchases)
    .leftJoin(categories, eq(categories.id, purchases.categoryId))
    .leftJoin(rooms, eq(rooms.id, purchases.roomId))
    .leftJoin(vendors, eq(vendors.id, purchases.vendorId))
    .where(filterConditions(spaceId, f))
    .orderBy(...orderFor(f.sort));

  return opts.limit ? query.limit(opts.limit) : query;
}

export async function listPurchases(spaceId: string, filters: PurchaseFilters) {
  const space = await getSpace(spaceId);
  const rows = await listPurchaseCards(space.id, { filters });
  const totalPaid = rows.reduce((s, r) => s + r.totalPaid, 0);
  const totalSaved = rows.reduce((s, r) => s + Math.max((r.originalTotal ?? r.totalPaid) - r.totalPaid, 0), 0);
  return { space, rows, totalPaid, totalSaved };
}

export async function getPurchase(spaceId: string, purchaseId: string) {
  const space = await getSpace(spaceId);
  if (!isUuid(purchaseId)) notFound();
  const purchase = await db.query.purchases.findFirst({
    where: and(eq(purchases.id, purchaseId), eq(purchases.spaceId, space.id)),
    with: {
      category: true,
      room: true,
      vendor: true,
      attachments: { orderBy: [asc(attachments.position), asc(attachments.createdAt)] },
    },
  });
  if (!purchase) notFound();
  return { space, purchase };
}

/** Used by the file route: returns the attachment only if its space belongs to the user. */
export async function getOwnedAttachment(attachmentId: string, userId: string) {
  if (!isUuid(attachmentId)) return null;
  const [row] = await db
    .select({ attachment: attachments })
    .from(attachments)
    .innerJoin(purchases, eq(purchases.id, attachments.purchaseId))
    .innerJoin(spaces, eq(spaces.id, purchases.spaceId))
    .where(and(eq(attachments.id, attachmentId), eq(spaces.ownerId, userId)))
    .limit(1);
  return row?.attachment ?? null;
}

export async function listPurchasesForExport(spaceId: string, userId: string, filters: PurchaseFilters) {
  if (!isUuid(spaceId)) return null;
  const space = await db.query.spaces.findFirst({ where: and(eq(spaces.id, spaceId), eq(spaces.ownerId, userId)) });
  if (!space) return null;
  const rows = await listPurchaseCards(space.id, { filters });
  const ids = rows.map((r) => r.id);
  const notes = ids.length
    ? await db
        .select({ id: purchases.id, notes: purchases.notes, unitPrice: purchases.unitPrice })
        .from(purchases)
        .where(inArray(purchases.id, ids))
    : [];
  const extra = new Map(notes.map((n) => [n.id, n]));
  return { space, rows: rows.map((r) => ({ ...r, notes: extra.get(r.id)?.notes ?? null, unitPrice: extra.get(r.id)?.unitPrice ?? null })) };
}

/* -------------------------------------------------------------------------- */

export function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

export function isIsoDate(v: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(v);
}
