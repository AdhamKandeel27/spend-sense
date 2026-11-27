"use client";

import { Check, Plus, Trash2 } from "lucide-react";
import { useActionState, useState } from "react";
import { Button, Field } from "@/components/ui";
import type { FormState } from "@/lib/actions/state";
import { initialFormState } from "@/lib/actions/state";
import { CHIP_COLORS, SPACE_COLORS, chipCode } from "@/lib/palette";

type Action = (prev: FormState, fd: FormData) => Promise<FormState>;
type PlainAction = (fd: FormData) => Promise<void>;

export function SpaceDetailsForm({
  action,
  name,
  description,
  color,
}: {
  action: Action;
  name: string;
  description: string | null;
  color: number;
}) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const [picked, setPicked] = useState(color);
  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Field label="Name" htmlFor="name" error={state.fieldErrors?.name}>
        <input id="name" name="name" defaultValue={name} required maxLength={80} className="field" aria-invalid={!!state.fieldErrors?.name} />
      </Field>
      <Field label="Description" htmlFor="description" error={state.fieldErrors?.description}>
        <input id="description" name="description" defaultValue={description ?? ""} maxLength={280} className="field" />
      </Field>
      <fieldset>
        <legend className="mb-2 text-[0.8125rem] font-semibold text-ink-2">Space colour</legend>
        <div className="flex flex-wrap gap-2">
          {SPACE_COLORS.map((c, i) => (
            <label key={c.name} className="relative cursor-pointer" title={c.name}>
              <input
                type="radio"
                name="color"
                value={i}
                checked={picked === i}
                onChange={() => setPicked(i)}
                className="peer sr-only"
              />
              <span
                className="grid size-11 place-items-center outline-offset-2 peer-checked:outline-2 peer-checked:outline-ink peer-focus-visible:outline-2 peer-focus-visible:outline-ink"
                style={{ background: c.bg, color: c.fg }}
              >
                {picked === i && <Check size={18} aria-hidden />}
              </span>
              <span className="sr-only">{c.name}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        {state.ok && !pending && (
          <span role="status" className="inline-flex items-center gap-1.5 text-[0.875rem] font-medium text-ok">
            <Check size={16} aria-hidden /> Saved
          </span>
        )}
      </div>
    </form>
  );
}

/** Add / rename / recolour / delete for categories (with chips) or rooms (plain). */
export function ListManager({
  kind,
  items,
  add,
  update,
  remove,
}: {
  kind: "category" | "room";
  items: { id: string; name: string; color?: number; count: number }[];
  add: Action;
  update: PlainAction;
  remove: PlainAction;
}) {
  const [state, addAction, pending] = useActionState(add, initialFormState);
  // Bumping the key resets the input after each add.
  const [formKey, setFormKey] = useState(0);
  return (
    <div className="flex flex-col gap-3">
      <ul className="border-t border-line">
        {items.length === 0 && <li className="border-b border-line py-3 text-ink-3">None yet.</li>}
        {items.map((it) => (
          <ItemRow key={it.id} kind={kind} item={it} update={update} remove={remove} />
        ))}
      </ul>
      <form
        key={formKey}
        action={async (fd) => {
          await addAction(fd);
          setFormKey((k) => k + 1);
        }}
        className="flex gap-2"
      >
        <label className="sr-only" htmlFor={`new-${kind}`}>
          New {kind}
        </label>
        <input
          id={`new-${kind}`}
          name="name"
          required
          maxLength={60}
          placeholder={kind === "category" ? "New category, e.g. Curtains" : "New room, e.g. Roof terrace"}
          className="field"
          aria-invalid={!!state.fieldErrors?.name}
        />
        <Button type="submit" variant="secondary" disabled={pending} className="shrink-0">
          <Plus size={16} aria-hidden /> Add
        </Button>
      </form>
      {state.fieldErrors?.name && <p className="text-[0.8125rem] font-medium text-danger">{state.fieldErrors.name}</p>}
    </div>
  );
}

function ItemRow({
  kind,
  item,
  update,
  remove,
}: {
  kind: "category" | "room";
  item: { id: string; name: string; color?: number; count: number };
  update: PlainAction;
  remove: PlainAction;
}) {
  const [name, setName] = useState(item.name);
  const [color, setColor] = useState(item.color ?? 0);
  const [confirming, setConfirming] = useState(false);
  const dirty = name.trim() !== item.name || (kind === "category" && color !== item.color);
  const chip = CHIP_COLORS[color % CHIP_COLORS.length];

  return (
    <li className="flex flex-col gap-2 border-b border-line py-2.5">
      <form action={update} className="flex items-center gap-2">
        <input type="hidden" name="id" value={item.id} />
        {kind === "category" && (
          <label className="relative shrink-0" title="Change colour">
            <span className="sr-only">Colour for {item.name}</span>
            <select
              name="color"
              value={color}
              onChange={(e) => setColor(Number(e.target.value))}
              className="absolute inset-0 cursor-pointer opacity-0"
            >
              {CHIP_COLORS.map((c, i) => (
                <option key={c.name} value={i}>
                  {c.name}
                </option>
              ))}
            </select>
            <span aria-hidden className="chip-code grid h-8 w-10 place-items-center" style={{ background: chip.bg, color: chip.fg }}>
              {chipCode(name)}
            </span>
          </label>
        )}
        <label className="sr-only" htmlFor={`name-${item.id}`}>
          Name
        </label>
        <input
          id={`name-${item.id}`}
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          className="field min-h-10 flex-1 border-transparent bg-transparent px-2 py-1.5 hover:border-line-strong focus:bg-card"
        />
        <span className="num w-8 shrink-0 text-right text-[0.8125rem] text-ink-3" title="Purchases">
          {item.count}
        </span>
        {dirty ? (
          <Button type="submit" variant="secondary" className="min-h-10 shrink-0 px-3">
            Save
          </Button>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="grid size-10 shrink-0 place-items-center text-ink-3 hover:text-danger"
            aria-label={`Delete ${item.name}`}
          >
            <Trash2 size={16} aria-hidden />
          </button>
        )}
      </form>
      {confirming && (
        <form action={remove} className="flex flex-wrap items-center gap-2 bg-danger-tint p-2.5 text-[0.875rem]">
          <input type="hidden" name="id" value={item.id} />
          <span className="flex-1">
            Delete “{item.name}”?{" "}
            {item.count > 0 ? `${item.count} purchase${item.count === 1 ? "" : "s"} will keep their data but lose this ${kind}.` : ""}
          </span>
          <Button type="submit" variant="danger" className="min-h-9 bg-danger !text-white">
            Delete
          </Button>
          <Button type="button" variant="ghost" className="min-h-9" onClick={() => setConfirming(false)}>
            Cancel
          </Button>
        </form>
      )}
    </li>
  );
}

export function DeleteSpaceForm({ action, name }: { action: Action; name: string }) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Field label={`Type “${name}” to confirm`} htmlFor="confirm" error={state.fieldErrors?.confirm}>
        <input id="confirm" name="confirm" autoComplete="off" className="field" aria-invalid={!!state.fieldErrors?.confirm} />
      </Field>
      <Button type="submit" variant="danger" disabled={pending} className="self-start">
        <Trash2 size={16} aria-hidden /> {pending ? "Deleting…" : "Delete this space and everything in it"}
      </Button>
    </form>
  );
}
