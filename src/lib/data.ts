import "server-only";
import { and, asc, count, desc, eq, gte, ilike, inArray, isNotNull, isNull, lt, lte, or, sql, sum } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { after } from "next/server";
import { attachments, categories, purchases, rooms, spaceShares, spaces, vendors, type Space } from "@/db/schema";
import { groupCards } from "@/lib/groups";
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

/** Ids of the user's active spaces, for checking the nav's remembered space. */
export async function listSpaceIds(): Promise<string[]> {
  const user = await requireUser();
  const rows = await db
    .select({ id: spaces.id })
    .from(spaces)
    .where(and(eq(spaces.ownerId, user.id), isNull(spaces.archivedAt)));
  return rows.map((r) => r.id);
}

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
  const [cats, rms, vnds, brandRows] = await Promise.all([
    db.select().from(categories).where(eq(categories.spaceId, space.id)).orderBy(asc(categories.sortOrder), asc(categories.name)),
    db.select().from(rooms).where(eq(rooms.spaceId, space.id)).orderBy(asc(rooms.sortOrder), asc(rooms.name)),
    db.select().from(vendors).where(eq(vendors.ownerId, space.ownerId)).orderBy(asc(vendors.name)),
    // Brands used across all of the owner's spaces, for the form's suggestions.
    db
      .selectDistinct({ brand: purchases.brand })
      .from(purchases)
      .innerJoin(spaces, eq(spaces.id, purchases.spaceId))
      .where(and(eq(spaces.ownerId, space.ownerId), isNotNull(purchases.brand)))
      .orderBy(asc(purchases.brand)),
  ]);
  const brands = brandRows.map((b) => b.brand).filter((b): b is string => !!b);
  return { space, categories: cats, rooms: rms, vendors: vnds, brands };
}

/** The space's position among the owner's spaces (1-based), shown as its chip code "SPACE 01". */
async function getSpaceNumber(space: { id: string; ownerId: string; createdAt: Date }) {
  const [{ n }] = await db
    .select({ n: count() })
    .from(spaces)
    // Strictly earlier spaces + 1. (JS dates carry milliseconds, Postgres microseconds,
    // so "<= own createdAt" would miss the space itself.)
    .where(and(eq(spaces.ownerId, space.ownerId), isNull(spaces.archivedAt), lt(spaces.createdAt, space.createdAt)));
  return n + 1;
}

export function spaceCode(n: number) {
  return `SPACE ${String(n).padStart(2, "0")}`;
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
  return overviewFor(await getSpace(spaceId), { recent: 8 });
}

/** Totals and breakdowns for a space already authorised by the caller (owner or share link). */
async function overviewFor(space: Space, opts: { recent?: number } = {}) {
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

  // Group before trimming, so an item bought in batches shows its full total
  // even when its earlier batches are older than the "recent" cut-off.
  const items = groupCards(await listPurchaseCards(space.id));
  const recent = opts.recent ? items.slice(0, opts.recent) : items;
  const number = await getSpaceNumber(space);

  return {
    space,
    number,
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
  brand: string | null;
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
  groupId: string | null;
};

function filterConditions(spaceId: string, f: PurchaseFilters) {
  const conds = [eq(purchases.spaceId, spaceId)];
  const q = f.q?.trim();
  if (q) {
    const like = `%${q.replace(/[%_\\]/g, "\\$&")}%`;
    conds.push(
      or(ilike(purchases.name, like), ilike(purchases.brand, like), ilike(purchases.notes, like), ilike(vendors.name, like))!,
    );
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
      brand: purchases.brand,
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
      groupId: purchases.groupId,
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

/** Like getPurchase, but null instead of a 404 (for optional references such as ?more=). */
export async function findPurchase(spaceId: string, purchaseId: string) {
  const space = await getSpace(spaceId);
  if (!isUuid(purchaseId)) return null;
  const found = await db.query.purchases.findFirst({
    where: and(eq(purchases.id, purchaseId), eq(purchases.spaceId, space.id)),
    with: { vendor: true },
  });
  return found ?? null;
}

/** Every batch in a purchase's group, oldest first (empty when it's on its own). */
async function groupMembersFor(spaceId: string, groupId: string | null) {
  if (!groupId) return [];
  const receiptCount = sql<number>`(
    select count(*)::int from ${attachments} a
    where a.purchase_id = ${purchases.id} and a.kind = 'receipt'
  )`;
  const rows = await db
    .select({
      id: purchases.id,
      purchasedOn: purchases.purchasedOn,
      quantity: purchases.quantity,
      unit: purchases.unit,
      unitPrice: purchases.unitPrice,
      totalPaid: purchases.totalPaid,
      originalTotal: purchases.originalTotal,
      vendorName: vendors.name,
      receiptCount,
    })
    .from(purchases)
    .leftJoin(vendors, eq(vendors.id, purchases.vendorId))
    .where(and(eq(purchases.spaceId, spaceId), eq(purchases.groupId, groupId)))
    .orderBy(asc(purchases.purchasedOn), asc(purchases.createdAt));
  return rows.length > 1 ? rows : [];
}

export type GroupMember = Awaited<ReturnType<typeof groupMembersFor>>[number];

export async function getPurchaseGroup(spaceId: string, purchaseId: string) {
  const { space, purchase } = await getPurchase(spaceId, purchaseId);
  return groupMembersFor(space.id, purchase.groupId);
}

/**
 * Earlier purchases a new one might be "more of": one entry per item (a
 * group counts once), newest first, for the add form's suggestion.
 */
export async function listLinkCandidates(spaceId: string) {
  const space = await getSpace(spaceId);
  const rows = await db
    .select({ id: purchases.id, name: purchases.name, brand: purchases.brand, purchasedOn: purchases.purchasedOn, groupId: purchases.groupId })
    .from(purchases)
    .where(eq(purchases.spaceId, space.id))
    .orderBy(desc(purchases.purchasedOn), desc(purchases.createdAt));
  const seen = new Set<string>();
  return rows.filter((r) => {
    if (!r.groupId) return true;
    if (seen.has(r.groupId)) return false;
    seen.add(r.groupId);
    return true;
  });
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
/* View-only share links                                                      */
/* -------------------------------------------------------------------------- */

export function isShareToken(v: string) {
  return /^[A-Za-z0-9_-]{32}$/.test(v);
}

/** The owner's list of viewer links for a space. */
export async function listShares(spaceId: string) {
  const space = await getSpace(spaceId);
  return db.select().from(spaceShares).where(eq(spaceShares.spaceId, space.id)).orderBy(desc(spaceShares.createdAt));
}

/**
 * Resolves a share link to its space, or null when the link is unknown,
 * revoked (row deleted) or the space is archived. This is the only gate for
 * viewers, so everything shared goes through it.
 */
async function findShare(token: string) {
  if (!isShareToken(token)) return null;
  const [row] = await db
    .select({ share: spaceShares, space: spaces })
    .from(spaceShares)
    .innerJoin(spaces, eq(spaces.id, spaceShares.spaceId))
    .where(and(eq(spaceShares.token, token), isNull(spaces.archivedAt)))
    .limit(1);
  return row ?? null;
}

async function requireShare(token: string) {
  const row = await findShare(token);
  if (!row) notFound();
  // Record "last opened" for the owner, at most once an hour, after the response.
  const last = row.share.lastViewedAt?.getTime() ?? 0;
  if (Date.now() - last > 60 * 60 * 1000) {
    after(() => db.update(spaceShares).set({ lastViewedAt: new Date() }).where(eq(spaceShares.id, row.share.id)));
  }
  return row;
}

/** Everything the viewer's overview shows: totals, breakdown and every purchase. */
export async function getSharedOverview(token: string) {
  const { share, space } = await requireShare(token);
  const overview = await overviewFor(space);
  return { ...overview, viewerName: share.name };
}

/** One purchase for a viewer. Receipts are left out: they often carry addresses and phone numbers. */
export async function getSharedPurchase(token: string, purchaseId: string) {
  const { share, space } = await requireShare(token);
  if (!isUuid(purchaseId)) notFound();
  const purchase = await db.query.purchases.findFirst({
    where: and(eq(purchases.id, purchaseId), eq(purchases.spaceId, space.id)),
    with: {
      category: true,
      room: true,
      vendor: true,
      attachments: {
        where: eq(attachments.kind, "photo"),
        orderBy: [asc(attachments.position), asc(attachments.createdAt)],
      },
    },
  });
  if (!purchase) notFound();
  const group = await groupMembersFor(space.id, purchase.groupId);
  return { space, purchase, group, viewerName: share.name };
}

/** Used by the share file route: a photo, only if it belongs to the link's space. */
export async function getSharedPhoto(token: string, attachmentId: string) {
  if (!isUuid(attachmentId)) return null;
  const row = await findShare(token);
  if (!row) return null;
  const [found] = await db
    .select({ attachment: attachments })
    .from(attachments)
    .innerJoin(purchases, eq(purchases.id, attachments.purchaseId))
    .where(and(eq(attachments.id, attachmentId), eq(attachments.kind, "photo"), eq(purchases.spaceId, row.space.id)))
    .limit(1);
  return found?.attachment ?? null;
}

/* -------------------------------------------------------------------------- */

export function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

export function isIsoDate(v: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(v);
}
