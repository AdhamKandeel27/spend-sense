import { ArrowLeft, Download, ReceiptText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DeckStrip, GroupBadge, PurchaseTile, QtyMark, SpaceScope, Thumb } from "@/components/space";
import { groupCards } from "@/lib/groups";
import { ButtonLink, Chip, EmptyState } from "@/components/ui";
import { getSpaceOptions, getSpaceOverview, listPurchases, type PurchaseFilters as Filters } from "@/lib/data";
import { formatAmount } from "@/lib/money";
import { FootOffset } from "@/components/foot-offset";
import { PageSkeleton } from "../skeletons";
import { PurchaseFilters } from "./filters";

export const metadata: Metadata = { title: "Purchases" };

type Props = PageProps<"/spaces/[spaceId]/purchases">;

export default function PurchasesPage({ params, searchParams }: Props) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Purchases params={params} searchParams={searchParams} />
    </Suspense>
  );
}

const SORTS = new Set(["newest", "oldest", "highest", "lowest"]);

async function Purchases({ params, searchParams }: Props) {
  const { spaceId } = await params;
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const filters: Filters = {
    q: one("q"),
    category: one("category"),
    room: one("room"),
    vendor: one("vendor"),
    from: one("from"),
    to: one("to"),
    sort: SORTS.has(one("sort") ?? "") ? (one("sort") as Filters["sort"]) : undefined,
  };
  const view = one("view") === "list" ? "list" : "grid";

  const [{ space, rows, totalPaid, totalSaved }, options, overview] = await Promise.all([
    listPurchases(spaceId, filters),
    getSpaceOptions(spaceId),
    getSpaceOverview(spaceId),
  ]);

  const exportParams = new URLSearchParams(
    Object.entries(filters).filter((e): e is [string, string] => typeof e[1] === "string" && e[1] !== ""),
  );
  const exportHref = `/api/spaces/${space.id}/export${exportParams.size ? `?${exportParams}` : ""}`;
  const filtered = Object.values(filters).some(Boolean);
  // Batches of the same item show as one tile/row; the footer still counts every purchase.
  const items = groupCards(rows);

  return (
    <SpaceScope space={space}>
      <main className="pb-shell mx-auto w-full max-w-6xl px-5 pt-[max(1.25rem,env(safe-area-inset-top))] lg:px-10 lg:pt-10">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/spaces/${space.id}`}
              className="inline-flex max-w-full items-center gap-1.5 text-[0.875rem] font-semibold text-ink-2 hover:text-ink"
            >
              <ArrowLeft size={16} aria-hidden className="shrink-0" /> <span className="truncate">{space.name}</span>
            </Link>
            <h1 className="mt-3 text-title font-extrabold">Purchases</h1>
          </div>
          <a
            href={exportHref}
            className="inline-flex min-h-11 items-center gap-2 border border-line-strong bg-card px-3.5 font-semibold hover:border-ink"
            download
          >
            <Download size={17} aria-hidden /> <span>Export CSV</span>
          </a>
        </div>

        <div className="mt-5">
          <DeckStrip spaceId={space.id} items={overview.byCategory} total={overview.totalPaid} activeId={filters.category} />
        </div>

        <div className="mt-4">
          <PurchaseFilters
            rooms={options.rooms.map((r) => ({ id: r.id, name: r.name }))}
            vendors={options.vendors.map((v) => ({ id: v.id, name: v.name }))}
          />
        </div>

        <section aria-label="Results" className="mt-5">
          {rows.length === 0 ? (
            filtered ? (
              <EmptyState title="No purchases match">Try a different search, or clear the filters to see everything.</EmptyState>
            ) : (
              <EmptyState
                title="Nothing logged yet"
                action={
                  <ButtonLink href={`/spaces/${space.id}/purchases/new`} variant="primary">
                    Add your first purchase
                  </ButtonLink>
                }
              >
                Every purchase you add shows up here, searchable and filterable.
              </EmptyState>
            )
          ) : view === "grid" ? (
            <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((p) => (
                <li key={p.id} className="flex">
                  <PurchaseTile spaceId={space.id} p={p} currency={space.currency} />
                </li>
              ))}
            </ul>
          ) : (
            <ul className="border-t border-line">
              {items.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/spaces/${space.id}/purchases/${p.id}`}
                    className="grid grid-cols-[3.5rem_minmax(0,1fr)_6.5rem] items-center gap-3 border-b border-line bg-card px-2 py-2 hover:bg-ground/60 sm:grid-cols-[3.5rem_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_2rem_7rem]"
                  >
                    <Thumb photoId={p.photoId} alt="" className="size-14" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {p.name}
                        {p.group ? (
                          p.group.quantity != null && <QtyMark quantity={p.group.quantity} unit={p.group.unit} />
                        ) : (
                          <QtyMark quantity={p.quantity} unit={p.unit} />
                        )}
                      </p>
                      <p className="truncate text-[0.8125rem] text-ink-3">
                        {p.group ? (
                          <GroupBadge count={p.group.count} className="mr-1.5 align-[1px]" />
                        ) : null}
                        {[p.brand, p.group ? null : p.vendorName, formatDate(p.purchasedOn)].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <span className="hidden min-w-0 text-[0.8125rem] sm:block">
                      <Chip name={p.categoryName} color={p.categoryColor} className="max-w-full" />
                    </span>
                    <span className="hidden truncate text-[0.8125rem] text-ink-2 sm:block">{p.roomName ?? "—"}</span>
                    <span className="hidden text-ink-3 sm:block">
                      {p.receiptCount > 0 && <ReceiptText size={16} aria-label="Has receipt" />}
                    </span>
                    <span className="text-right">
                      <span className="num block font-extrabold">{formatAmount(p.group?.totalPaid ?? p.totalPaid)}</span>
                      {(() => {
                        const paid = p.group?.totalPaid ?? p.totalPaid;
                        const before = p.group ? p.group.originalTotal : p.originalTotal;
                        return before != null && before > paid ? (
                          <span className="num block text-[0.75rem] text-ink-3 line-through">{formatAmount(before)}</span>
                        ) : null;
                      })()}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {/* Running total, pinned to the foot of the list. */}
      {rows.length > 0 && <FootOffset />}
      {rows.length > 0 && (
        <div className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-30 border-t border-line bg-ground/95 backdrop-blur-md lg:bottom-0 lg:left-60">
          <div className="mx-auto flex max-w-6xl items-baseline justify-between gap-3 px-5 py-2.5 text-[0.875rem] lg:px-10">
            <span className="text-ink-2">
              {rows.length === 1 ? "1 purchase" : `${rows.length} purchases`}
              {filtered ? " shown" : ""}
            </span>
            <span className="flex items-baseline gap-3">
              {totalSaved > 0 && <span className="num hidden text-ink-2 sm:inline">saved {formatAmount(totalSaved)}</span>}
              <span className="num font-extrabold">
                {formatAmount(totalPaid)} <span className="text-[0.75rem] font-semibold text-ink-3">{space.currency}</span>
              </span>
            </span>
          </div>
        </div>
      )}
    </SpaceScope>
  );
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
