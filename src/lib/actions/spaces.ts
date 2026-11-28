"use server";

import { and, count, eq, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { categories, rooms, spaces } from "@/db/schema";
import { getSpace, isUuid } from "@/lib/data";
import { CHIP_COLORS, HOME_TEMPLATE, SPACE_COLORS } from "@/lib/palette";
import { requireUser } from "@/lib/session";
import { storage } from "@/lib/storage";
import { attachments, purchases } from "@/db/schema";
import { type FormState, formValues } from "./state";

const spaceSchema = z.object({
  name: z.string().trim().min(1, "Give the space a name.").max(80, "Keep the name under 80 characters."),
  description: z.string().trim().max(280, "Keep the description under 280 characters.").optional(),
});

export async function createSpace(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = spaceSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) {
    return { fieldErrors: flatten(parsed.error), values: formValues(formData) };
  }

  const [{ value: existing }] = await db.select({ value: count() }).from(spaces).where(eq(spaces.ownerId, user.id));
  const useTemplate = formData.get("template") === "home";

  const spaceId = await db.transaction(async (tx) => {
    const [space] = await tx
      .insert(spaces)
      .values({
        ownerId: user.id,
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        color: existing % SPACE_COLORS.length,
      })
      .returning({ id: spaces.id });

    if (useTemplate) {
      await tx.insert(categories).values(
        HOME_TEMPLATE.categories.map((name, i) => ({ spaceId: space.id, name, color: i % CHIP_COLORS.length, sortOrder: i })),
      );
      await tx.insert(rooms).values(HOME_TEMPLATE.rooms.map((name, i) => ({ spaceId: space.id, name, sortOrder: i })));
    }
    return space.id;
  });

  // "/" layout: the nav's list of spaces lives in the (app) layout.
  revalidatePath("/", "layout");
  redirect(`/spaces/${spaceId}`);
}

export async function updateSpace(spaceId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const space = await getSpace(spaceId);
  const parsed = spaceSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) return { fieldErrors: flatten(parsed.error), values: formValues(formData) };

  const color = Number(formData.get("color"));
  await db
    .update(spaces)
    .set({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      color: Number.isInteger(color) && color >= 0 && color < SPACE_COLORS.length ? color : space.color,
    })
    .where(eq(spaces.id, space.id));

  revalidatePath(`/spaces/${space.id}`, "layout");
  revalidatePath("/spaces");
  return { ok: true };
}

export async function deleteSpace(spaceId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const space = await getSpace(spaceId);
  if (String(formData.get("confirm") ?? "").trim() !== space.name) {
    return { fieldErrors: { confirm: `Type “${space.name}” exactly to confirm.` } };
  }

  // Collect files before the cascade removes their rows.
  const files = await db
    .select({ key: attachments.storageKey, thumb: attachments.thumbKey })
    .from(attachments)
    .innerJoin(purchases, eq(purchases.id, attachments.purchaseId))
    .where(eq(purchases.spaceId, space.id));

  await db.delete(spaces).where(eq(spaces.id, space.id));
  await Promise.allSettled(files.flatMap((f) => [storage.delete(f.key), f.thumb ? storage.delete(f.thumb) : null]));

  revalidatePath("/", "layout");
  redirect("/spaces");
}

/* -------------------------------------------------------------------------- */
/* Categories & rooms                                                         */
/* -------------------------------------------------------------------------- */

const nameSchema = z.string().trim().min(1, "Enter a name.").max(60, "Keep it under 60 characters.");

export async function addCategory(spaceId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const space = await getSpace(spaceId);
  const parsed = nameSchema.safeParse(formData.get("name"));
  if (!parsed.success) return { fieldErrors: { name: parsed.error.issues[0].message } };

  const [{ n, top }] = await db
    .select({ n: count(), top: max(categories.sortOrder) })
    .from(categories)
    .where(eq(categories.spaceId, space.id));
  await db.insert(categories).values({
    spaceId: space.id,
    name: parsed.data,
    color: n % CHIP_COLORS.length,
    sortOrder: (top ?? -1) + 1,
  });
  revalidatePath(`/spaces/${space.id}`, "layout");
  return { ok: true };
}

export async function updateCategory(spaceId: string, formData: FormData) {
  const space = await getSpace(spaceId);
  const id = String(formData.get("id") ?? "");
  const name = nameSchema.safeParse(formData.get("name"));
  const color = Number(formData.get("color"));
  if (!isUuid(id) || !name.success) return;
  await db
    .update(categories)
    .set({
      name: name.data,
      ...(Number.isInteger(color) && color >= 0 && color < CHIP_COLORS.length ? { color } : {}),
    })
    .where(and(eq(categories.id, id), eq(categories.spaceId, space.id)));
  revalidatePath(`/spaces/${space.id}`, "layout");
}

export async function deleteCategory(spaceId: string, formData: FormData) {
  const space = await getSpace(spaceId);
  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) return;
  // Purchases keep existing; their category becomes empty (ON DELETE SET NULL).
  await db.delete(categories).where(and(eq(categories.id, id), eq(categories.spaceId, space.id)));
  revalidatePath(`/spaces/${space.id}`, "layout");
}

export async function addRoom(spaceId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const space = await getSpace(spaceId);
  const parsed = nameSchema.safeParse(formData.get("name"));
  if (!parsed.success) return { fieldErrors: { name: parsed.error.issues[0].message } };
  const [{ top }] = await db.select({ top: max(rooms.sortOrder) }).from(rooms).where(eq(rooms.spaceId, space.id));
  await db.insert(rooms).values({ spaceId: space.id, name: parsed.data, sortOrder: (top ?? -1) + 1 });
  revalidatePath(`/spaces/${space.id}`, "layout");
  return { ok: true };
}

export async function updateRoom(spaceId: string, formData: FormData) {
  const space = await getSpace(spaceId);
  const id = String(formData.get("id") ?? "");
  const name = nameSchema.safeParse(formData.get("name"));
  if (!isUuid(id) || !name.success) return;
  await db.update(rooms).set({ name: name.data }).where(and(eq(rooms.id, id), eq(rooms.spaceId, space.id)));
  revalidatePath(`/spaces/${space.id}`, "layout");
}

export async function deleteRoom(spaceId: string, formData: FormData) {
  const space = await getSpace(spaceId);
  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) return;
  await db.delete(rooms).where(and(eq(rooms.id, id), eq(rooms.spaceId, space.id)));
  revalidatePath(`/spaces/${space.id}`, "layout");
}

function flatten(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
