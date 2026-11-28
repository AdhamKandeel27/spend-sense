import { ReceiptText, Settings2 } from "lucide-react";
import { Thumb } from "@/components/thumb";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { Breakdown, PurchaseCard } from "@/lib/data";
import { discountPercent, formatAmount } from "@/lib/money";
import { chipCode, chipColor, spaceColor } from "@/lib/palette";

type SpaceLike = { id: string; name: string; color: number; currency: string };

/** Sets the space's chip colour as CSS variables for everything inside. */
export function SpaceScope({ space, children }: { space: SpaceLike; children: ReactNode }) {
  const c = spaceColor(space.color);
  const style = { "--space-bg": c.bg, "--space-fg": c.fg, "--space-accent": c.accent } as CSSProperties;
  return <div style={style}>{children}</div>;
}

/** The space header is the space's own paint chip. */
export function SpaceHeader({
  space,
  totalPaid,
  totalSaved,
  count,
  code,
  label = "Spent so far",
}: {
  space: SpaceLike;
  totalPaid: number;
  totalSaved: number;
  count: number;
  code: string;
  label?: string;
}) {
  return (
    <header className="relative bg-[var(--space-bg)] px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-6 text-[var(--space-fg)] lg:px-10 lg:pt-10 lg:pb-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex min-h-10 items-center gap-3">
          <Link href="/spaces" className="label min-w-0 truncate hover:underline">
            {space.name}
          </Link>
          <span className="chip-code shrink-0 opacity-75">{code}</span>
          <Link
            href={`/spaces/${space.id}/settings`}
            aria-label="Space settings"
            className="-mr-2 ml-auto grid size-10 shrink-0 place-items-center opacity-80 hover:opacity-100 lg:hidden"
          >
            <Settings2 size={20} aria-hidden />
          </Link>
        </div>
        <p className="mt-6 text-[0.8125rem] font-medium opacity-80">{label}</p>
        <p className="mt-1 text-total font-extrabold tracking-[-0.025em] lg:text-[3.5rem]">
          <span className="num">{formatAmount(totalPaid)}</span>
          <span className="ml-2 text-[1rem] font-semibold tracking-normal opacity-80">{space.currency}</span>
        </p>
        <p className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.875rem]">
          <span className="opacity-90">{count === 1 ? "1 purchase" : `${count} purchases`}</span>
          {totalSaved > 0 && (
            <span className="num bg-[var(--space-accent)] px-1.5 py-0.5 font-bold text-ink">
              {formatAmount(totalSaved)} {space.currency} saved
            </span>
          )}
        </p>
      </div>
      <span className="notch lg:right-10" />
    </header>
  );
}

/** Signature move: categories fanned by share, like a paint deck. */
export function DeckStrip({
  spaceId,
  items,
  total,
  activeId,
  interactive = true,
}: {
  spaceId: string;
  items: Breakdown[];
  total: number;
  activeId?: string;
  interactive?: boolean;
}) {
  if (total <= 0 || items.length === 0) {
    return (
      <div className="flex h-16 items-center justify-center border border-dashed border-line-strong px-4 text-center text-[0.875rem] text-ink-3">
        The deck fills in as you add purchases.
      </div>
    );
  }
  return (
    <div className="flex h-16 gap-0.5" role="list" aria-label="Spending by category">
      {items.map((it, i) => {
        const c = chipColor(it.id ? it.color : -1);
        const share = it.total / total;
        const pct = Math.round(share * 100);
        const key = it.id ?? "none";
        const dim = activeId && activeId !== key;
        // Each chip is a size container: the name, code and share appear only when the
        // chip is wide enough to show them whole. Nothing is ever truncated mid-word.
        const content = (
          <>
            <span className={`hidden text-[0.6875rem] leading-tight font-semibold whitespace-nowrap ${fitClass(it.name.length * 6.4)}`}>
              {it.name}
            </span>
            <span className="chip-code mt-auto whitespace-nowrap opacity-85">
              <span className={`hidden ${fitClass(18)}`}>{chipCode(it.name)}</span>
              <span className={`hidden ${fitClass(18 + (String(pct).length + 4) * 6.6)}`}> · {pct}%</span>
            </span>
          </>
        );
        const className = `deck-chip @container flex min-w-3 flex-col justify-between overflow-hidden p-1.5 transition-opacity duration-200 ${dim ? "opacity-30" : ""}`;
        const style = { flex: `${Math.max(share, 0.015)} 1 0`, background: c.bg, color: c.fg, animationDelay: `${i * 45}ms` };
        const title = `${it.name}: ${formatAmount(it.total)} (${pct}%)`;
        return interactive ? (
          <Link
            key={key}
            role="listitem"
            href={activeId === key ? `/spaces/${spaceId}/purchases` : `/spaces/${spaceId}/purchases?category=${key}`}
            className={`${className} hover:brightness-110`}
            style={style}
            title={title}
            aria-label={title}
            aria-current={activeId === key ? "true" : undefined}
          >
            {content}
          </Link>
        ) : (
          <div key={key} role="listitem" className={className} style={style} title={title} aria-label={title}>
            {content}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Container-query class that reveals an element once the chip's content box is at
 * least `px` wide. Listed literally so Tailwind generates every bucket.
 */
const FIT_CLASSES = [
  "@min-[20px]:inline", "@min-[30px]:inline", "@min-[40px]:inline", "@min-[50px]:inline",
  "@min-[60px]:inline", "@min-[70px]:inline", "@min-[80px]:inline", "@min-[90px]:inline",
  "@min-[100px]:inline", "@min-[110px]:inline", "@min-[120px]:inline", "@min-[130px]:inline",
  "@min-[140px]:inline", "@min-[150px]:inline", "@min-[160px]:inline", "@min-[180px]:inline",
  "@min-[200px]:inline", "@min-[240px]:inline",
];
const FIT_SIZES = [20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 180, 200, 240];

function fitClass(px: number) {
  const i = FIT_SIZES.findIndex((s) => s >= px);
  return i === -1 ? "" : FIT_CLASSES[i];
}

export function DeckLegend({ items, currency, limit = 4 }: { items: Breakdown[]; currency: string; limit?: number }) {
  if (items.length === 0) return null;
  const shown = items.slice(0, limit);
  return (
    <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 text-[0.875rem]">
      {shown.map((it) => {
        const c = chipColor(it.id ? it.color : -1);
        return (
          <div key={it.id ?? "none"} className="contents">
            <dt className="flex min-w-0 items-center gap-2.5">
              <span aria-hidden className="size-2.5 shrink-0" style={{ background: c.bg }} />
              <span className="truncate">{it.name}</span>
              <span className="shrink-0 text-ink-3">{it.count}</span>
            </dt>
            <dd className="num text-right font-semibold">
              {formatAmount(it.total)} <span className="text-[0.75rem] font-medium text-ink-3">{currency}</span>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

export { Thumb };

export function PurchaseTile({ spaceId, p, currency }: { spaceId: string; p: PurchaseCard; currency: string }) {
  const c = chipColor(p.categoryId ? p.categoryColor : -1);
  const pct = discountPercent(p.totalPaid, p.originalTotal);
  return (
    <Link
      href={`/spaces/${spaceId}/purchases/${p.id}`}
      className="group flex w-full flex-col border border-line bg-card transition-[border-color,box-shadow] duration-200 hover:border-line-strong hover:shadow-[var(--shadow-lift)]"
    >
      <div className="relative w-full">
        <Thumb photoId={p.photoId} alt={p.name} className="aspect-square w-full" />
        {pct != null && (
          <span className="num absolute top-2 left-2 bg-ochre px-1.5 py-0.5 text-[0.75rem] font-bold text-ink">−{pct}%</span>
        )}
        {p.receiptCount > 0 && (
          <span className="absolute top-2 right-2 grid size-7 place-items-center bg-card/90 text-ink" title="Has receipt">
            <ReceiptText size={15} aria-hidden />
            <span className="sr-only">Has receipt</span>
          </span>
        )}
      </div>
      <div aria-hidden className="flex h-1.5" style={{ background: c.bg }} />
      <div className="flex flex-1 flex-col gap-1 p-2.5">
        <p className="line-clamp-2 text-[0.875rem] leading-snug font-semibold">{p.name}</p>
        {p.brand && <p className="truncate text-[0.75rem] text-ink-3">{p.brand}</p>}
        <p className="mt-auto flex flex-wrap items-baseline gap-x-1.5 pt-1">
          <span className="num text-[0.9375rem] font-extrabold">{formatAmount(p.totalPaid)}</span>
          {p.originalTotal != null && p.originalTotal > p.totalPaid && (
            <span className="num text-[0.75rem] text-ink-3 line-through">{formatAmount(p.originalTotal)}</span>
          )}
          <span className="sr-only">{currency}</span>
        </p>
      </div>
    </Link>
  );
}
