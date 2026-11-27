"use client";

import { Camera, FileText, ImagePlus, Loader2, ReceiptText, Undo2, X } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useId, useMemo, useRef, useState } from "react";
import { Button, Field } from "@/components/ui";
import { compressImage } from "@/lib/compress-image";
import { initialFormState, type FormState } from "@/lib/actions/state";
import { discountPercent, formatAmount, parseAmount } from "@/lib/money";
import { chipCode, chipColor } from "@/lib/palette";

type Option = { id: string; name: string; color?: number };
type ExistingAttachment = { id: string; kind: "photo" | "receipt"; mimeType: string; originalName: string | null };

export type PurchaseDefaults = {
  name?: string;
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

type Picked = { key: string; file: File; url: string | null };

export function PurchaseForm({
  action,
  mode,
  currency,
  categories,
  rooms,
  vendors,
  defaults = {},
  existing = [],
  cancelHref,
}: {
  action: Action;
  mode: "create" | "edit";
  currency: string;
  categories: Option[];
  rooms: Option[];
  vendors: Option[];
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

  const [qty, setQty] = useState(v.quantity ?? "1");
  const [unitPrice, setUnitPrice] = useState(v.unitPrice ?? "");
  const [total, setTotal] = useState(v.totalPaid ?? "");
  const [totalTouched, setTotalTouched] = useState(Boolean(v.totalPaid));
  const [original, setOriginal] = useState(v.originalTotal ?? "");
  const [category, setCategory] = useState(v.categoryId ?? "");
  const [room, setRoom] = useState(v.roomId ?? "");
  const [showDiscount, setShowDiscount] = useState(Boolean(v.originalTotal));
  const [showQty, setShowQty] = useState(Boolean(v.unitPrice) || (v.quantity != null && v.quantity !== "1"));

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

  async function pick(files: FileList | null, kind: "photo" | "receipt") {
    if (!files?.length) return;
    setProcessing(true);
    const next: Picked[] = [];
    for (const file of Array.from(files)) {
      const out = file.type === "application/pdf" ? file : await compressImage(file, kind === "receipt" ? 2600 : 2000);
      const url = out.type.startsWith("image/") ? URL.createObjectURL(out) : null;
      if (url) urls.current.add(url);
      next.push({ key: `${file.name}-${file.size}-${crypto.randomUUID()}`, file: out, url });
    }
    (kind === "photo" ? setPhotos : setReceipts)((prev) => [...prev, ...next]);
    setProcessing(false);
  }

  function submit(fd: FormData) {
    for (const p of photos) fd.append("photos", p.file, p.file.name);
    for (const r of receipts) fd.append("receipts", r.file, r.file.name);
    for (const id of removed) fd.append("removeAttachment", id);
    if (!totalTouched && computedTotal != null) fd.set("totalPaid", (computedTotal / 100).toFixed(2));
    formAction(fd);
  }

  const keptPhotos = existing.filter((a) => a.kind === "photo");
  const keptReceipts = existing.filter((a) => a.kind === "receipt");
  const selectedCategory = categories.find((c) => c.id === category);
  const busy = pending || processing;

  return (
    <form action={submit} onInput={markEdited} className="grid gap-x-10 gap-y-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]" noValidate>
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
          {err.files && <p className="mt-2 text-[0.8125rem] font-medium text-danger">{err.files}</p>}
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

        {/* Price block */}
        <div className="border border-line bg-card p-4">
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
          {!totalTouched && computedTotal != null && (
            <p className="mt-1.5 text-[0.8125rem] text-ink-3">Calculated from quantity × unit price. Type to override.</p>
          )}

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
            {!showDiscount && (
              <button type="button" className="text-[0.875rem] font-semibold underline underline-offset-4" onClick={() => setShowDiscount(true)}>
                It was discounted
              </button>
            )}
            {!showQty && (
              <button type="button" className="text-[0.875rem] font-semibold underline underline-offset-4" onClick={() => setShowQty(true)}>
                Bought by quantity (m², pcs…)
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

          {showQty && (
            <div className="mt-4 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.3fr)] gap-2.5">
              <Field label="Quantity" htmlFor="quantity" error={err.quantity}>
                <input
                  id="quantity"
                  name="quantity"
                  inputMode="decimal"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="field num"
                  aria-invalid={!!err.quantity}
                />
              </Field>
              <Field label="Unit" htmlFor="unit">
                <input id="unit" name="unit" defaultValue={v.unit} list="units" placeholder="m²" className="field" maxLength={20} />
              </Field>
              <Field label="Unit price" htmlFor="unitPrice" error={err.unitPrice}>
                <input
                  id="unitPrice"
                  name="unitPrice"
                  inputMode="decimal"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  placeholder="0"
                  className="field num"
                  aria-invalid={!!err.unitPrice}
                />
              </Field>
              <datalist id="units">
                {["m²", "m", "pcs", "box", "set", "kg", "L", "roll"].map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            </div>
          )}
          {!showQty && <input type="hidden" name="quantity" value={qty} />}
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

          <Field label="Vendor / store" htmlFor="vendorName">
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
          <Button type="submit" variant="primary" disabled={busy} name="intent" value="save" className="min-w-36">
            {pending ? (
              <>
                <Loader2 size={18} className="animate-spin" aria-hidden /> Saving…
              </>
            ) : processing ? (
              "Preparing photos…"
            ) : mode === "create" ? (
              "Save purchase"
            ) : (
              "Save changes"
            )}
          </Button>
          {mode === "create" && (
            <Button type="submit" variant="secondary" disabled={busy} name="intent" value="another">
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
