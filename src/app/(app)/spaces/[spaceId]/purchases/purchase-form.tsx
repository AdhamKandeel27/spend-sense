"use client";

import { Camera, FileText, ImagePlus, Minus, Plus, ReceiptText, Undo2, X } from "lucide-react";
import Link from "next/link";
import { startTransition, useActionState, useEffect, useId, useMemo, useRef, useState } from "react";
import { Button, Field } from "@/components/ui";
import { compressImage } from "@/lib/compress-image";
import { initialFormState, type FormState } from "@/lib/actions/state";
import {
  MAX_UPLOAD_BYTES,
  UPLOAD_SIZE_ERROR,
  UPLOAD_TYPE_ERROR,
  uploadType,
  type UploadedFile,
  type UploadKind,
  type UploadRequest,
} from "@/lib/uploads";
import { discountPercent, formatAmount, parseAmount } from "@/lib/money";
import { chipCode, chipColor } from "@/lib/palette";

type Option = { id: string; name: string; color?: number };
type ExistingAttachment = { id: string; kind: "photo" | "receipt"; mimeType: string; originalName: string | null };

export type PurchaseDefaults = {
  name?: string;
  brand?: string;
  purchasedOn?: string;
  quantity?: string;
  unit?: string;
  unitPrice?: string;
  totalPaid?: string;
  originalTotal?: string;
  categoryId?: string;
  roomId?: string;
  vendorName?: string;
  notes?: string;
};

type Action = (prev: FormState, fd: FormData) => Promise<FormState>;
type PrepareUploads = (
  files: UploadRequest[],
) => Promise<{ slots: { key: string; url: string }[] } | { error: string }>;

type Picked = { key: string; file: File; url: string | null };

export function PurchaseForm({
  action,
  prepareUploads,
  mode,
  currency,
  categories,
  rooms,
  vendors,
  brands,
  defaults = {},
  existing = [],
  cancelHref,
}: {
  action: Action;
  prepareUploads: PrepareUploads;
  mode: "create" | "edit";
  currency: string;
  categories: Option[];
  rooms: Option[];
  vendors: Option[];
  brands: string[];
  defaults?: PurchaseDefaults;
  existing?: ExistingAttachment[];
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const v = { ...defaults, ...(state.values ?? {}) } as Record<string, string | undefined>;

  // An error disappears as soon as its field is edited; a new submit brings fresh ones.
  const [edited, setEdited] = useState<{ for: FormState; names: Set<string> }>({ for: state, names: new Set() });
  const editedNames = edited.for === state ? edited.names : new Set<string>();
  const err = Object.fromEntries(
    Object.entries(state.fieldErrors ?? {}).filter(([k]) => !editedNames.has(k)),
  ) as Record<string, string>;
  function markEdited(e: React.FormEvent<HTMLFormElement>) {
    const name = (e.target as HTMLInputElement).name;
    if (!name || !state.fieldErrors?.[name] || editedNames.has(name)) return;
    setEdited({ for: state, names: new Set(editedNames).add(name) });
  }

  const [photos, setPhotos] = useState<Picked[]>([]);
  const [receipts, setReceipts] = useState<Picked[]>([]);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState(false);
  const [uploading, setUploading] = useState(false);
  // Which save button was tapped, so only that one shows the spinner.
  const [intent, setIntent] = useState<"save" | "another">("save");
  const [fileError, setFileError] = useState<string | null>(null);

  const [qty, setQty] = useState(v.quantity ?? "1");
  const [unitPrice, setUnitPrice] = useState(v.unitPrice ?? "");
  const [total, setTotal] = useState(v.totalPaid ?? "");
  const [totalTouched, setTotalTouched] = useState(Boolean(v.totalPaid));
  const [original, setOriginal] = useState(v.originalTotal ?? "");
  const [category, setCategory] = useState(v.categoryId ?? "");
  const [room, setRoom] = useState(v.roomId ?? "");
  const [showDiscount, setShowDiscount] = useState(Boolean(v.originalTotal));
  const qtyNum = Number(qty.replace(/,/g, ""));
  const qtyValid = Number.isFinite(qtyNum) && qtyNum > 0;
  // "Price each" and unit appear once there's more than one, or the purchase already uses them.
  const showEach = (qtyValid && qtyNum !== 1) || Boolean(v.unitPrice) || Boolean(v.unit);
  // Changing the quantity or price each recalculates the total again.
  const changeQty = (q: string) => {
    setQty(q);
    setTotalTouched(false);
  };

  // Free preview object URLs when the form unmounts (removals free their own).
  const urls = useRef(new Set<string>());
  useEffect(() => {
    const set = urls.current;
    return () => set.forEach((u) => URL.revokeObjectURL(u));
  }, []);
  const dropPicked = (setter: typeof setPhotos, key: string) =>
    setter((list) => {
      const gone = list.find((p) => p.key === key);
      if (gone?.url) {
        URL.revokeObjectURL(gone.url);
        urls.current.delete(gone.url);
      }
      return list.filter((p) => p.key !== key);
    });

  // Auto-fill the total from quantity × unit price until the user types a total themselves.
  const computedTotal = useMemo(() => {
    const up = parseAmount(unitPrice);
    const q = Number(qty.replace(/,/g, ""));
    if (up == null || !Number.isFinite(q) || q <= 0) return null;
    return Math.round(up * q);
  }, [unitPrice, qty]);
  const effectiveTotal = totalTouched ? parseAmount(total) : (computedTotal ?? parseAmount(total));
  const originalMinor = parseAmount(original);
  const pct = effectiveTotal != null ? discountPercent(effectiveTotal, originalMinor) : null;

  async function pick(files: FileList | null, kind: UploadKind) {
    if (!files?.length) return;
    setProcessing(true);
    setFileError(null);
    const next: Picked[] = [];
    let rejected: string | null = null;
    for (const file of Array.from(files)) {
      const out = file.type === "application/pdf" ? file : await compressImage(file, kind === "receipt" ? 2600 : 2000);
      const type = uploadType(out);
      if (!type || (type === "application/pdf" && kind === "photo")) {
        rejected = type ? "Photos must be images. PDFs can be added as receipts." : UPLOAD_TYPE_ERROR;
        continue;
      }
      if (out.size > MAX_UPLOAD_BYTES) {
        rejected = UPLOAD_SIZE_ERROR;
        continue;
      }
      const url = out.type.startsWith("image/") ? URL.createObjectURL(out) : null;
      if (url) urls.current.add(url);
      next.push({ key: `${file.name}-${file.size}-${crypto.randomUUID()}`, file: out, url });
    }
    (kind === "photo" ? setPhotos : setReceipts)((prev) => [...prev, ...next]);
    setFileError(rejected);
    setProcessing(false);
  }

  /**
   * Files go straight from the browser to storage first, then the form is
   * submitted with only their keys. That keeps each request far under the
   * hosting body limit.
   */
  async function attachFiles(fd: FormData): Promise<boolean> {
    const picked = [
      ...photos.map((p) => ({ kind: "photo" as const, file: p.file })),
      ...receipts.map((r) => ({ kind: "receipt" as const, file: r.file })),
    ];
    if (picked.length === 0) return true;

    const types = picked.map((p) => uploadType(p.file) ?? p.file.type);
    const res = await prepareUploads(picked.map((p, i) => ({ kind: p.kind, type: types[i], size: p.file.size })));
    if ("error" in res) {
      setFileError(res.error);
      return false;
    }

    const results = await Promise.all(
      res.slots.map((slot, i) =>
        fetch(slot.url, { method: "PUT", headers: { "Content-Type": types[i] }, body: picked[i].file })
          .then((r) => r.ok)
          .catch(() => false),
      ),
    );
    if (results.includes(false)) {
      setFileError("A file couldn't be uploaded. Check your connection and try again.");
      return false;
    }
    const uploaded: UploadedFile[] = res.slots.map((slot, i) => ({
      kind: picked[i].kind,
      key: slot.key,
      name: picked[i].file.name,
      type: types[i],
    }));
    fd.set("uploads", JSON.stringify(uploaded));
    return true;
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
    const fd = new FormData(e.currentTarget, submitter);
    setIntent(fd.get("intent") === "another" ? "another" : "save");
    for (const id of removed) fd.append("removeAttachment", id);
    if (!totalTouched && computedTotal != null) fd.set("totalPaid", (computedTotal / 100).toFixed(2));

    setFileError(null);
    setUploading(true);
    try {
      if (!(await attachFiles(fd))) return;
    } catch {
      setFileError("A file couldn't be uploaded. Check your connection and try again.");
      return;
    } finally {
      setUploading(false);
    }
    startTransition(() => formAction(fd));
  }

  const keptPhotos = existing.filter((a) => a.kind === "photo");
  const keptReceipts = existing.filter((a) => a.kind === "receipt");
  const selectedCategory = categories.find((c) => c.id === category);
  const busy = pending || processing || uploading;
  const filesError = fileError ?? err.files;

  return (
    <form onSubmit={submit} onInput={markEdited} className="grid gap-x-10 gap-y-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]" noValidate>
      {/* ---------------- Media ---------------- */}
      <div className="flex flex-col gap-6 lg:sticky lg:top-8 lg:self-start">
        <section aria-labelledby="photos-label">
          <h2 id="photos-label" className="mb-2 text-[0.8125rem] font-semibold text-ink-2">
            Photo of the item
          </h2>
          <MediaGrid
            existing={keptPhotos}
            picked={photos}
            removed={removed}
            onToggleExisting={(id) => setRemoved((s) => toggle(s, id))}
            onRemovePicked={(key) => dropPicked(setPhotos, key)}
          />
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <FilePick label="Take photo" icon={Camera} accept="image/*" capture onPick={(f) => pick(f, "photo")} />
            <FilePick label="Choose photos" icon={ImagePlus} accept="image/*" multiple onPick={(f) => pick(f, "photo")} />
          </div>
        </section>

        <section aria-labelledby="receipts-label">
          <h2 id="receipts-label" className="mb-2 text-[0.8125rem] font-semibold text-ink-2">
            Receipt or invoice
          </h2>
          {(keptReceipts.length > 0 || receipts.length > 0) && (
            <ul className="mb-2.5 flex flex-col gap-1.5">
              {keptReceipts.map((a) => (
                <ReceiptRow
                  key={a.id}
                  name={a.originalName ?? "Receipt"}
                  isPdf={a.mimeType === "application/pdf"}
                  removed={removed.has(a.id)}
                  onToggle={() => setRemoved((s) => toggle(s, a.id))}
                  href={`/api/files/${a.id}`}
                />
              ))}
              {receipts.map((r) => (
                <ReceiptRow
                  key={r.key}
                  name={r.file.name}
                  isPdf={r.file.type === "application/pdf"}
                  thumb={r.url}
                  onToggle={() => dropPicked(setReceipts, r.key)}
                />
              ))}
            </ul>
          )}
          <div className="grid grid-cols-2 gap-2">
            <FilePick label="Snap receipt" icon={Camera} accept="image/*" capture onPick={(f) => pick(f, "receipt")} />
            <FilePick label="Upload file" icon={ReceiptText} accept="image/*,application/pdf" multiple onPick={(f) => pick(f, "receipt")} />
          </div>
          {filesError && (
            <p role="alert" className="mt-2 text-[0.8125rem] font-medium text-danger">
              {filesError}
            </p>
          )}
        </section>
      </div>

      {/* ---------------- Details ---------------- */}
      <div className="flex flex-col gap-5">
        <Field label="What did you buy?" htmlFor="name" error={err.name}>
          <input
            id="name"
            name="name"
            defaultValue={v.name}
            required
            maxLength={140}
            placeholder="Carrara marble slabs"
            className="field text-[1.0625rem] font-semibold"
            aria-invalid={!!err.name}
            aria-describedby={err.name ? "name-error" : undefined}
            autoComplete="off"
          />
        </Field>

        {/* Who made it vs. where it was bought: a Bosch dishwasher from Cairo Sales. */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
          <Field label="Brand" htmlFor="brand">
            <input
              id="brand"
              name="brand"
              defaultValue={v.brand}
              list="brands"
              placeholder="e.g. Bosch"
              className="field"
              maxLength={80}
              autoComplete="off"
            />
            <datalist id="brands">
              {brands.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </Field>

          <Field label="Store" htmlFor="vendorName">
            <input
              id="vendorName"
              name="vendorName"
              defaultValue={v.vendorName}
              list="vendors"
              placeholder="Where you bought it"
              className="field"
              maxLength={80}
              autoComplete="off"
            />
            <datalist id="vendors">
              {vendors.map((x) => (
                <option key={x.id} value={x.name} />
              ))}
            </datalist>
          </Field>
        </div>

        {/* Price block */}
        <div className="border border-line bg-card p-4">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2.5">
            <Field label={`Total paid (${currency})`} htmlFor="totalPaid" error={err.totalPaid}>
              <input
                id="totalPaid"
                name="totalPaid"
                inputMode="decimal"
                value={totalTouched ? total : computedTotal != null ? (computedTotal / 100).toString() : total}
                onChange={(e) => {
                  setTotal(e.target.value);
                  setTotalTouched(e.target.value !== "");
                }}
                placeholder="0"
                className="field num text-[1.5rem] font-extrabold"
                aria-invalid={!!err.totalPaid}
                aria-describedby={err.totalPaid ? "totalPaid-error" : undefined}
              />
            </Field>
            <Field label="Quantity" htmlFor="quantity" error={err.quantity}>
              <QuantityStepper value={qty} onChange={changeQty} invalid={!!err.quantity} />
            </Field>
          </div>

          {showEach && (
            <div className="mt-4 grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-2.5">
              <Field label={`Price each (${currency})`} htmlFor="unitPrice" error={err.unitPrice}>
                <input
                  id="unitPrice"
                  name="unitPrice"
                  inputMode="decimal"
                  value={unitPrice}
                  onChange={(e) => {
                    setUnitPrice(e.target.value);
                    setTotalTouched(false);
                  }}
                  placeholder="0"
                  className="field num"
                  aria-invalid={!!err.unitPrice}
                />
              </Field>
              <Field label="Unit (optional)" htmlFor="unit">
                <input id="unit" name="unit" defaultValue={v.unit} list="units" placeholder="pcs, m²…" className="field" maxLength={20} />
              </Field>
              <datalist id="units">
                {["pcs", "m²", "m", "box", "set", "kg", "L", "roll"].map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            </div>
          )}

          <p className="mt-1.5 text-[0.8125rem] text-ink-3" aria-live="polite">
            {showEach && !totalTouched && computedTotal != null && qtyValid ? (
              <>
                <span className="num">
                  {formatQty(qtyNum)} × {formatAmount(parseAmount(unitPrice) ?? 0)} = {formatAmount(computedTotal)}
                </span>
                . Type a total to override.
              </>
            ) : showEach && qtyValid && effectiveTotal != null && !parseAmount(unitPrice) ? (
              <>
                That&apos;s <span className="num">{formatAmount(Math.round(effectiveTotal / qtyNum))}</span> each. Or enter the price each
                to calculate the total.
              </>
            ) : null}
          </p>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
            {!showDiscount && (
              <button type="button" className="text-[0.875rem] font-semibold underline underline-offset-4" onClick={() => setShowDiscount(true)}>
                It was discounted
              </button>
            )}
          </div>

          {showDiscount && (
            <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
              <Field label={`Price before discount (${currency})`} htmlFor="originalTotal" error={err.originalTotal}>
                <input
                  id="originalTotal"
                  name="originalTotal"
                  inputMode="decimal"
                  value={original}
                  onChange={(e) => setOriginal(e.target.value)}
                  placeholder="0"
                  className="field num"
                  aria-invalid={!!err.originalTotal}
                />
              </Field>
              <div className="min-h-[2.875rem] min-w-24 pb-0.5 text-right" aria-live="polite">
                {pct != null && effectiveTotal != null && originalMinor != null ? (
                  <>
                    <span className="num inline-block bg-ochre px-1.5 py-0.5 text-[0.875rem] font-bold">−{pct}%</span>
                    <span className="num mt-1 block text-[0.8125rem] text-ink-2">saved {formatAmount(originalMinor - effectiveTotal)}</span>
                  </>
                ) : null}
              </div>
            </div>
          )}

        </div>

        {/* Filing */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={
              <span className="inline-flex items-center gap-2">
                Category
                {selectedCategory && (
                  <span
                    className="chip-code inline-grid h-4 place-items-center px-1"
                    style={{ background: chipColor(selectedCategory.color).bg, color: chipColor(selectedCategory.color).fg }}
                  >
                    {chipCode(selectedCategory.name)}
                  </span>
                )}
              </span>
            }
            htmlFor="categoryId"
            error={err.newCategory}
          >
            <select id="categoryId" name="categoryId" value={category} onChange={(e) => setCategory(e.target.value)} className="field">
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              <option value="__new">＋ New category…</option>
            </select>
            {category === "__new" && (
              <input
                name="newCategory"
                defaultValue={v.newCategory}
                autoFocus
                placeholder="e.g. Curtains"
                className="field mt-2"
                maxLength={60}
                aria-label="New category name"
                aria-invalid={!!err.newCategory}
              />
            )}
          </Field>

          <Field label="Room / area" htmlFor="roomId" error={err.newRoom}>
            <select id="roomId" name="roomId" value={room} onChange={(e) => setRoom(e.target.value)} className="field">
              <option value="">No room</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
              <option value="__new">＋ New room…</option>
            </select>
            {room === "__new" && (
              <input
                name="newRoom"
                defaultValue={v.newRoom}
                autoFocus
                placeholder="e.g. Roof terrace"
                className="field mt-2"
                maxLength={60}
                aria-label="New room name"
                aria-invalid={!!err.newRoom}
              />
            )}
          </Field>

          <Field label="Date" htmlFor="purchasedOn" error={err.purchasedOn}>
            <input
              id="purchasedOn"
              name="purchasedOn"
              type="date"
              defaultValue={v.purchasedOn}
              className="field"
              aria-invalid={!!err.purchasedOn}
            />
          </Field>
        </div>

        <Field label="Notes" htmlFor="notes">
          <textarea
            id="notes"
            name="notes"
            defaultValue={v.notes}
            rows={3}
            maxLength={2000}
            placeholder="Model number, colour code, who to call for installation…"
            className="field resize-y"
          />
        </Field>

        {state.error && (
          <p role="alert" className="border border-danger/40 bg-danger-tint px-3 py-2.5 text-[0.875rem] font-medium text-danger">
            {state.error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <Button
            type="submit"
            variant="primary"
            disabled={busy}
            pending={processing || ((pending || uploading) && intent === "save")}
            pendingLabel={processing ? "Preparing photos…" : uploading ? "Uploading…" : "Saving…"}
            name="intent"
            value="save"
            className="min-w-36"
          >
            {mode === "create" ? "Save purchase" : "Save changes"}
          </Button>
          {mode === "create" && (
            <Button
              type="submit"
              variant="secondary"
              disabled={busy}
              pending={(pending || uploading) && intent === "another"}
              pendingLabel={uploading ? "Uploading…" : "Saving…"}
              name="intent"
              value="another"
            >
              Save &amp; add another
            </Button>
          )}
          <Link href={cancelHref} className="ml-auto px-2 text-[0.9375rem] font-semibold text-ink-2 hover:text-ink">
            Cancel
          </Link>
        </div>
      </div>
    </form>
  );
}

function formatQty(q: number) {
  return new Intl.NumberFormat("en", { maximumFractionDigits: 3 }).format(q);
}

/** − [n] + : big tap targets for whole items; the box still takes decimals like 12.5 (m²). */
function QuantityStepper({ value, onChange, invalid }: { value: string; onChange: (v: string) => void; invalid: boolean }) {
  const n = Number(value.replace(/,/g, ""));
  const valid = Number.isFinite(n) && n > 0;
  const step = (d: number) => {
    const next = Math.round(((valid ? n : 1) + d) * 1000) / 1000;
    onChange(String(Math.max(1, next)));
  };
  const btn =
    "grid w-11 shrink-0 place-items-center text-ink hover:bg-black/5 active:bg-black/10 disabled:text-ink-3 disabled:hover:bg-transparent";
  return (
    <div
      className={`flex min-h-[2.875rem] items-stretch border bg-card transition-[border-color,box-shadow] duration-150 focus-within:border-ink focus-within:shadow-[inset_0_0_0_1px_var(--color-ink)] ${
        invalid ? "border-danger shadow-[inset_0_0_0_1px_var(--color-danger)]" : "border-line-strong"
      }`}
    >
      <button type="button" className={btn} onClick={() => step(-1)} disabled={!valid || n <= 1} aria-label="One fewer">
        <Minus size={18} aria-hidden />
      </button>
      <input
        id="quantity"
        name="quantity"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => e.target.select()}
        className="num w-12 min-w-0 bg-transparent text-center text-[1.125rem] font-bold outline-none"
        aria-invalid={invalid}
      />
      <button type="button" className={btn} onClick={() => step(1)} aria-label="One more">
        <Plus size={18} aria-hidden />
      </button>
    </div>
  );
}

function toggle(set: Set<string>, id: string) {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

function FilePick({
  label,
  icon: Icon,
  accept,
  capture,
  multiple,
  onPick,
}: {
  label: string;
  icon: typeof Camera;
  accept: string;
  capture?: boolean;
  multiple?: boolean;
  onPick: (files: FileList | null) => void;
}) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className="flex min-h-12 cursor-pointer items-center justify-center gap-2 border border-line-strong bg-card px-3 text-[0.875rem] font-semibold hover:border-ink has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink"
    >
      <Icon size={18} aria-hidden />
      {label}
      <input
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        {...(capture ? { capture: "environment" as const } : {})}
        className="sr-only"
        onChange={(e) => {
          onPick(e.target.files);
          e.target.value = "";
        }}
      />
    </label>
  );
}

function MediaGrid({
  existing,
  picked,
  removed,
  onToggleExisting,
  onRemovePicked,
}: {
  existing: ExistingAttachment[];
  picked: Picked[];
  removed: Set<string>;
  onToggleExisting: (id: string) => void;
  onRemovePicked: (key: string) => void;
}) {
  if (existing.length === 0 && picked.length === 0) {
    return (
      <div className="grid aspect-[4/3] place-items-center border border-dashed border-line-strong bg-card/60 text-center text-[0.875rem] text-ink-3 lg:aspect-square">
        <span className="flex flex-col items-center gap-2 px-6">
          <Camera size={28} strokeWidth={1.5} aria-hidden />
          Add a photo so you can recognise it later.
        </span>
      </div>
    );
  }
  return (
    <ul className="grid grid-cols-3 gap-1.5">
      {existing.map((a) => {
        const isRemoved = removed.has(a.id);
        return (
          <li key={a.id} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/files/${a.id}?size=thumb`} alt="" className={`aspect-square w-full object-cover ${isRemoved ? "opacity-30 grayscale" : ""}`} />
            <button
              type="button"
              onClick={() => onToggleExisting(a.id)}
              className="absolute top-1 right-1 grid size-8 place-items-center bg-card/95 text-ink shadow-sm"
              aria-label={isRemoved ? "Keep this photo" : "Remove this photo"}
            >
              {isRemoved ? <Undo2 size={16} aria-hidden /> : <X size={16} aria-hidden />}
            </button>
          </li>
        );
      })}
      {picked.map((p) => (
        <li key={p.key} className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {p.url ? <img src={p.url} alt="" className="aspect-square w-full object-cover" /> : <div className="aspect-square bg-line" />}
          <button
            type="button"
            onClick={() => onRemovePicked(p.key)}
            className="absolute top-1 right-1 grid size-8 place-items-center bg-card/95 text-ink shadow-sm"
            aria-label="Remove this photo"
          >
            <X size={16} aria-hidden />
          </button>
          <span className="absolute bottom-1 left-1 bg-ochre px-1 text-[0.6875rem] font-bold">NEW</span>
        </li>
      ))}
    </ul>
  );
}

function ReceiptRow({
  name,
  isPdf,
  thumb,
  removed,
  onToggle,
  href,
}: {
  name: string;
  isPdf: boolean;
  thumb?: string | null;
  removed?: boolean;
  onToggle: () => void;
  href?: string;
}) {
  return (
    <li className={`flex items-center gap-3 border border-line bg-card p-1.5 pr-1 ${removed ? "opacity-50" : ""}`}>
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumb} alt="" className="size-10 object-cover" />
      ) : (
        <span className="grid size-10 place-items-center bg-ground text-ink-2">
          {isPdf ? <FileText size={18} aria-hidden /> : <ReceiptText size={18} aria-hidden />}
        </span>
      )}
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className={`min-w-0 flex-1 truncate text-[0.875rem] font-medium hover:underline ${removed ? "line-through" : ""}`}>
          {name}
        </a>
      ) : (
        <span className="min-w-0 flex-1 truncate text-[0.875rem] font-medium">{name}</span>
      )}
      <button type="button" onClick={onToggle} className="grid size-9 place-items-center text-ink-2 hover:text-ink" aria-label={removed ? "Keep receipt" : "Remove receipt"}>
        {removed ? <Undo2 size={16} aria-hidden /> : <X size={16} aria-hidden />}
      </button>
    </li>
  );
}
