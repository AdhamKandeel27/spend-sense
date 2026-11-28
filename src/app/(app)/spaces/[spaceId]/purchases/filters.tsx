"use client";

import { LayoutGrid, Rows3, Search, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { chipColor } from "@/lib/palette";

type Option = { id: string; name: string };
/** A category that has purchases; id null = uncategorised. */
type CategoryOption = { id: string | null; name: string; color: number; count: number };

export function PurchaseFilters({
  rooms,
  vendors,
  categories,
}: {
  rooms: Option[];
  vendors: Option[];
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");
  const moreActive = ["room", "vendor", "from", "to"].some((k) => params.get(k));
  const [open, setOpen] = useState(moreActive);
  const inputRef = useRef<HTMLInputElement>(null);

  function update(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    next.delete("deleted");
    startTransition(() => router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false }));
  }

  // Debounce the search box.
  useEffect(() => {
    const current = params.get("q") ?? "";
    if (q === current) return;
    const t = setTimeout(() => update({ q: q.trim() || null }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const view = params.get("view") === "list" ? "list" : "grid";
  const activeCount = ["category", "room", "vendor", "from", "to", "q"].filter((k) => params.get(k)).length;

  return (
    <div className="flex flex-col gap-3" data-pending={pending || undefined}>
      <div className="flex gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Search purchases</span>
          <Search size={18} aria-hidden className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-3" />
          <input
            ref={inputRef}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search items, brands, stores, notes"
            className="field pl-10"
            enterKeyHint="search"
          />
        </label>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="more-filters"
          className={`relative grid min-h-[2.875rem] w-12 place-items-center border ${open || moreActive ? "border-ink bg-ink text-ground" : "border-line-strong bg-card"}`}
        >
          <SlidersHorizontal size={18} aria-hidden />
          <span className="sr-only">More filters</span>
        </button>
        <div className="hidden border border-line-strong bg-card sm:flex" role="group" aria-label="View">
          <ViewButton active={view === "grid"} onClick={() => update({ view: null })} label="Grid" icon={LayoutGrid} />
          <ViewButton active={view === "list"} onClick={() => update({ view: "list" })} label="List" icon={Rows3} />
        </div>
      </div>

      {categories.length > 0 && (
        <CategoryChips categories={categories} active={params.get("category")} onPick={(id) => update({ category: id })} />
      )}

      {open && (
        <div id="more-filters" className="grid grid-cols-2 gap-2.5 border border-line bg-card p-3 sm:grid-cols-5">
          <SelectFilter label="Room" value={params.get("room") ?? ""} onChange={(v) => update({ room: v })}>
            <option value="">All rooms</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
            <option value="none">No room</option>
          </SelectFilter>
          <SelectFilter label="Store" value={params.get("vendor") ?? ""} onChange={(v) => update({ vendor: v })}>
            <option value="">All stores</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </SelectFilter>
          <label className="flex flex-col gap-1">
            <span className="text-[0.75rem] font-semibold text-ink-2">From</span>
            <input type="date" className="field min-h-10 py-1.5" value={params.get("from") ?? ""} onChange={(e) => update({ from: e.target.value || null })} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[0.75rem] font-semibold text-ink-2">To</span>
            <input type="date" className="field min-h-10 py-1.5" value={params.get("to") ?? ""} onChange={(e) => update({ to: e.target.value || null })} />
          </label>
          <SelectFilter label="Sort" value={params.get("sort") ?? ""} onChange={(v) => update({ sort: v })}>
            <option value="">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="highest">Highest price</option>
            <option value="lowest">Lowest price</option>
          </SelectFilter>
          <div className="col-span-2 flex items-center justify-between gap-2 sm:hidden">
            <span className="text-[0.8125rem] text-ink-2">View</span>
            <div className="flex border border-line-strong" role="group" aria-label="View">
              <ViewButton active={view === "grid"} onClick={() => update({ view: null })} label="Grid" icon={LayoutGrid} />
              <ViewButton active={view === "list"} onClick={() => update({ view: "list" })} label="List" icon={Rows3} />
            </div>
          </div>
        </div>
      )}

      {activeCount > 0 && (
        <button
          type="button"
          onClick={() => {
            setQ("");
            update({ q: null, category: null, room: null, vendor: null, from: null, to: null });
          }}
          className="inline-flex items-center gap-1.5 self-start text-[0.8125rem] font-semibold text-ink-2 hover:text-ink"
        >
          <X size={14} aria-hidden /> Clear filters
        </button>
      )}
    </div>
  );
}

/** One tap to filter by category; tap the active one (or All) to clear. Scrolls sideways on phones. */
function CategoryChips({
  categories,
  active,
  onPick,
}: {
  categories: CategoryOption[];
  active: string | null;
  onPick: (id: string | null) => void;
}) {
  const chip = (on: boolean) =>
    `inline-flex min-h-10 shrink-0 items-center gap-2 border px-3 text-[0.875rem] font-semibold whitespace-nowrap transition-colors duration-150 ${
      on ? "border-ink bg-ink text-ground" : "border-line-strong bg-card text-ink-2 hover:border-ink hover:text-ink"
    }`;
  return (
    <div role="group" aria-label="Filter by category" className="-mx-5 overflow-x-auto px-5 [scrollbar-width:none] lg:-mx-10 lg:px-10 [&::-webkit-scrollbar]:hidden">
      <ul className="flex w-max gap-1.5">
        <li>
          <button type="button" aria-pressed={!active} onClick={() => onPick(null)} className={chip(!active)}>
            All
          </button>
        </li>
        {categories.map((c) => {
          const key = c.id ?? "none";
          const on = active === key;
          const color = chipColor(c.id ? c.color : -1);
          return (
            <li key={key}>
              <button type="button" aria-pressed={on} onClick={() => onPick(on ? null : key)} className={chip(on)}>
                <span aria-hidden className="size-3 shrink-0" style={{ background: color.bg, outline: on ? "1px solid rgb(255 255 255 / .5)" : undefined }} />
                {c.name}
                <span className={`num text-[0.75rem] font-medium ${on ? "text-ground/70" : "text-ink-3"}`}>{c.count}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SelectFilter({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string | null) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[0.75rem] font-semibold text-ink-2">{label}</span>
      <select className="field min-h-10 py-1.5" value={value} onChange={(e) => onChange(e.target.value || null)}>
        {children}
      </select>
    </label>
  );
}

function ViewButton({
  active,
  onClick,
  label,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: typeof LayoutGrid;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`grid min-h-10 w-11 place-items-center ${active ? "bg-ink text-ground" : "text-ink-2 hover:text-ink"}`}
    >
      <Icon size={17} aria-hidden />
      <span className="sr-only">{label}</span>
    </button>
  );
}
