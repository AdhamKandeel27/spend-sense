"use server";

import { and, count, eq, ilike, inArray, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { attachments, categories, purchases, rooms, vendors } from "@/db/schema";
import { getPurchase, getSpace, isIsoDate, isUuid } from "@/lib/data";
import { processUpload, UploadError, type ProcessedFile } from "@/lib/images";
import { parseAmount } from "@/lib/money";
import { CHIP_COLORS } from "@/lib/palette";
import { storage } from "@/lib/storage";
import { type FormState, formValues } from "./state";

type Space = Awaited<ReturnType<typeof getSpace>>;
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const MAX_FILES = 10;

type Parsed = {
  name: string;
  purchasedOn: string;
  quantity: string;
  unit: string | null;
  unitPrice: number | null;
  totalPaid: number;
  originalTotal: number | null;
  notes: string | null;
  category: { id: string } | { create: string } | null;
  room: { id: string } | { create: string } | null;
  vendorName: string | null;
};

function parsePurchase(formData: FormData): { data?: Parsed; fieldErrors?: Record<string, string> } {
  const errors: Record<string, string> = {};
  const str = (k: string) => String(formData.get(k) ?? "").trim();

  const name = str("name");
  if (!name) errors.name = "What did you buy?";
  else if (name.length > 140) errors.name = "Keep the name under 140 characters.";

  const purchasedOn = str("purchasedOn") || new Date().toISOString().slice(0, 10);
  if (!isIsoDate(purchasedOn)) errors.purchasedOn = "Pick a valid date.";

  const qtyRaw = str("quantity").replace(/,/g, "") || "1";
  const qty = Number(qtyRaw);
  if (!Number.isFinite(qty) || qty <= 0 || !/^\d+(\.\d{1,3})?$/.test(qtyRaw)) {
    errors.quantity = "Quantity must be a positive number (up to 3 decimals).";
  }

  const unitPrice = parseAmount(formData.get("unitPrice"));
  if (str("unitPrice") && unitPrice == null) errors.unitPrice = "Enter a price like 850 or 850.50.";

  let totalPaid = parseAmount(formData.get("totalPaid"));
  if (str("totalPaid") && totalPaid == null) errors.totalPaid = "Enter an amount like 24,999.";
  if (totalPaid == null && unitPrice != null && !errors.quantity) totalPaid = Math.round(unitPrice * qty);
  if (totalPaid == null && !errors.totalPaid) errors.totalPaid = "Enter what you paid.";

  const originalTotal = parseAmount(formData.get("originalTotal"));
  if (str("originalTotal") && originalTotal == null) errors.originalTotal = "Enter an amount like 28,500.";
  if (originalTotal != null && totalPaid != null && originalTotal < totalPaid) {
    errors.originalTotal = "The price before discount should be higher than what you paid.";
  }

  const pick = (field: string, newField: string, label: string) => {
    const v = str(field);
    if (v === "__new") {
      const n = str(newField);
      if (!n) {
        errors[newField] = `Name the new ${label}.`;
        return null;
      }
      return { create: n.slice(0, 60) };
    }
    if (v && isUuid(v)) return { id: v };
    return null;
  };

  const data: Parsed = {
    name,
    purchasedOn,
    quantity: String(qty),
    unit: str("unit").slice(0, 20) || null,
    unitPrice,
    totalPaid: totalPaid ?? 0,
    originalTotal: originalTotal && totalPaid != null && originalTotal > totalPaid ? originalTotal : null,
    notes: str("notes").slice(0, 2000) || null,
    category: pick("categoryId", "newCategory", "category"),
    room: pick("roomId", "newRoom", "room"),
    vendorName: str("vendorName").slice(0, 80) || null,
  };

  return Object.keys(errors).length ? { fieldErrors: errors } : { data };
}

async function resolveRefs(tx: Tx, space: Space, data: Parsed) {
  let categoryId: string | null = null;
  if (data.category && "id" in data.category) {
    const found = await tx.query.categories.findFirst({
      where: and(eq(categories.id, data.category.id), eq(categories.spaceId, space.id)),
    });
    categoryId = found?.id ?? null;
  } else if (data.category) {
    const [{ n, top }] = await tx
      .select({ n: count(), top: max(categories.sortOrder) })
      .from(categories)
      .where(eq(categories.spaceId, space.id));
    const [c] = await tx
      .insert(categories)
      .values({ spaceId: space.id, name: data.category.create, color: n % CHIP_COLORS.length, sortOrder: (top ?? -1) + 1 })
      .returning({ id: categories.id });
    categoryId = c.id;
  }

  let roomId: string | null = null;
  if (data.room && "id" in data.room) {
    const found = await tx.query.rooms.findFirst({ where: and(eq(rooms.id, data.room.id), eq(rooms.spaceId, space.id)) });
    roomId = found?.id ?? null;
  } else if (data.room) {
    const [{ top }] = await tx.select({ top: max(rooms.sortOrder) }).from(rooms).where(eq(rooms.spaceId, space.id));
    const [r] = await tx
      .insert(rooms)
      .values({ spaceId: space.id, name: data.room.create, sortOrder: (top ?? -1) + 1 })
      .returning({ id: rooms.id });
    roomId = r.id;
  }

  let vendorId: string | null = null;
  if (data.vendorName) {
    const escaped = data.vendorName.replace(/[%_\\]/g, "\\$&");
    const found = await tx.query.vendors.findFirst({
      where: and(eq(vendors.ownerId, space.ownerId), ilike(vendors.name, escaped)),
    });
    vendorId =
      found?.id ??
      (await tx.insert(vendors).values({ ownerId: space.ownerId, name: data.vendorName }).returning({ id: vendors.id }))[0].id;
  }

  return { categoryId, roomId, vendorId };
}

function collectFiles(formData: FormData, field: string): File[] {
  return formData.getAll(field).filter((v): v is File => v instanceof File && v.size > 0);
}

type Stored = { kind: "photo" | "receipt"; file: File; processed: ProcessedFile };

async function prepareFiles(formData: FormData): Promise<{ files?: Stored[]; error?: string }> {
  const photos = collectFiles(formData, "photos");
  const receipts = collectFiles(formData, "receipts");
  if (photos.length + receipts.length > MAX_FILES) return { error: `Attach up to ${MAX_FILES} files at a time.` };
  try {
    const files: Stored[] = [];
    for (const file of photos) files.push({ kind: "photo", file, processed: await processUpload(file, "photo") });
    for (const file of receipts) files.push({ kind: "receipt", file, processed: await processUpload(file, "receipt") });
    return { files };
  } catch (err) {
    if (err instanceof UploadError) return { error: err.message };
    throw err;
  }
}

async function writeFiles(spaceId: string, purchaseId: string, files: Stored[], startPosition: number) {
  const written: string[] = [];
  const rows = [];
  try {
    for (const [i, f] of files.entries()) {
      const id = crypto.randomUUID();
      const key = `${spaceId}/${purchaseId}/${id}.${f.processed.main.ext}`;
      await storage.put(key, f.processed.main.body, f.processed.main.mimeType);
      written.push(key);
      let thumbKey: string | null = null;
      if (f.processed.thumb) {
        thumbKey = `${spaceId}/${purchaseId}/${id}-thumb.webp`;
        await storage.put(thumbKey, f.processed.thumb.body, "image/webp");
        written.push(thumbKey);
      }
      rows.push({
        id,
        purchaseId,
        kind: f.kind,
        storageKey: key,
        thumbKey,
        mimeType: f.processed.main.mimeType,
        sizeBytes: f.processed.main.body.length,
        width: f.processed.width,
        height: f.processed.height,
        originalName: f.file.name.slice(0, 200) || null,
        position: startPosition + i,
      });
    }
    return { rows, written };
  } catch (err) {
    await Promise.allSettled(written.map((k) => storage.delete(k)));
    throw err;
  }
}

/* -------------------------------------------------------------------------- */

export async function createPurchase(spaceId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const space = await getSpace(spaceId);
  const values = formValues(formData);

  const { data, fieldErrors } = parsePurchase(formData);
  if (!data) return { fieldErrors, values, error: "Check the highlighted fields." };

  const prepared = await prepareFiles(formData);
  if (prepared.error) return { error: prepared.error, fieldErrors: { files: prepared.error }, values };

  const purchaseId = crypto.randomUUID();
  const { rows, written } = await writeFiles(space.id, purchaseId, prepared.files!, 0);

  try {
    await db.transaction(async (tx) => {
      const refs = await resolveRefs(tx, space, data);
      await tx.insert(purchases).values({
        id: purchaseId,
        spaceId: space.id,
        name: data.name,
        purchasedOn: data.purchasedOn,
        quantity: data.quantity,
        unit: data.unit,
        unitPrice: data.unitPrice,
        totalPaid: data.totalPaid,
        originalTotal: data.originalTotal,
        notes: data.notes,
        ...refs,
      });
      if (rows.length) await tx.insert(attachments).values(rows);
    });
  } catch (err) {
    await Promise.allSettled(written.map((k) => storage.delete(k)));
    throw err;
  }

  revalidatePath(`/spaces/${space.id}`, "layout");
  if (formData.get("intent") === "another") redirect(`/spaces/${space.id}/purchases/new?added=${purchaseId}`);
  redirect(`/spaces/${space.id}/purchases/${purchaseId}?saved=1`);
}

export async function updatePurchase(
  spaceId: string,
  purchaseId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { space, purchase } = await getPurchase(spaceId, purchaseId);
  const values = formValues(formData);

  const { data, fieldErrors } = parsePurchase(formData);
  if (!data) return { fieldErrors, values, error: "Check the highlighted fields." };

  const prepared = await prepareFiles(formData);
  if (prepared.error) return { error: prepared.error, fieldErrors: { files: prepared.error }, values };

  const removeIds = formData
    .getAll("removeAttachment")
    .map(String)
    .filter((id) => purchase.attachments.some((a) => a.id === id));
  const removed = purchase.attachments.filter((a) => removeIds.includes(a.id));
  const nextPosition = Math.max(-1, ...purchase.attachments.map((a) => a.position)) + 1;

  const { rows, written } = await writeFiles(space.id, purchase.id, prepared.files!, nextPosition);

  try {
    await db.transaction(async (tx) => {
      const refs = await resolveRefs(tx, space, data);
      await tx
        .update(purchases)
        .set({
          name: data.name,
          purchasedOn: data.purchasedOn,
          quantity: data.quantity,
          unit: data.unit,
          unitPrice: data.unitPrice,
          totalPaid: data.totalPaid,
          originalTotal: data.originalTotal,
          notes: data.notes,
          ...refs,
        })
        .where(eq(purchases.id, purchase.id));
      if (removeIds.length) await tx.delete(attachments).where(inArray(attachments.id, removeIds));
      if (rows.length) await tx.insert(attachments).values(rows);
    });
  } catch (err) {
    await Promise.allSettled(written.map((k) => storage.delete(k)));
    throw err;
  }

  await Promise.allSettled(removed.flatMap((a) => [storage.delete(a.storageKey), a.thumbKey ? storage.delete(a.thumbKey) : null]));

  revalidatePath(`/spaces/${space.id}`, "layout");
  redirect(`/spaces/${space.id}/purchases/${purchase.id}?saved=1`);
}

export async function deletePurchase(spaceId: string, purchaseId: string) {
  const { space, purchase } = await getPurchase(spaceId, purchaseId);
  await db.delete(purchases).where(eq(purchases.id, purchase.id));
  await Promise.allSettled(
    purchase.attachments.flatMap((a) => [storage.delete(a.storageKey), a.thumbKey ? storage.delete(a.thumbKey) : null]),
  );
  revalidatePath(`/spaces/${space.id}`, "layout");
  redirect(`/spaces/${space.id}/purchases?deleted=1`);
}
