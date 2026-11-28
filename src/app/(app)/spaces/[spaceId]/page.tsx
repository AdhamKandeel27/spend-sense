import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DeckLegend, DeckStrip, PurchaseTile, SpaceHeader, SpaceScope } from "@/components/space";
import { ButtonLink, EmptyState } from "@/components/ui";
import { getSpaceOverview, spaceCode } from "@/lib/data";
import { Money } from "@/components/money";
import { OverviewSkeleton } from "./skeletons";

export const metadata: Metadata = { title: "Overview" };

export default function SpaceOverviewPage({ params }: PageProps<"/spaces/[spaceId]">) {
  return (
    <Suspense fallback={<OverviewSkeleton />}>
      <Overview params={params} />
    </Suspense>
  );
}

async function Overview({ params }: { params: PageProps<"/spaces/[spaceId]">["params"] }) {
  const { spaceId } = await params;
  const o = await getSpaceOverview(spaceId);
  const { space } = o;

  return (
    <SpaceScope space={space}>
      <SpaceHeader space={space} code={spaceCode(o.number)} totalPaid={o.totalPaid} totalSaved={o.totalSaved} count={o.count} />
      <main className="pb-shell mx-auto w-full max-w-6xl px-5 lg:px-10">
        {o.count === 0 ? (
          <div className="pt-8">
            <EmptyState
              title="Nothing logged yet"
              action={
                <ButtonLink href={`/spaces/${space.id}/purchases/new`} variant="primary">
                  Add your first purchase
                </ButtonLink>
              }
            >
              Snap the thing you bought, add the price (and the price before any discount), and it lands here filed under its
              category and room.
            </EmptyState>
          </div>
        ) : (
          <>
            <section aria-labelledby="deck-title" className="pt-7">
              <h2 id="deck-title" className="sr-only">
                Spending by category
              </h2>
              <DeckStrip spaceId={space.id} items={o.byCategory} total={o.totalPaid} />
              <div className="mt-4 grid gap-8 lg:grid-cols-2">
                <DeckLegend items={o.byCategory} currency={space.currency} limit={5} />
                {o.byRoom.some((r) => r.id) && (
                  <div>
                    <h3 className="label mb-2.5 text-ink-2">By room</h3>
                    <ul className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 text-[0.875rem]">
                      {o.byRoom.slice(0, 5).map((r) => (
                        <li key={r.id ?? "none"} className="contents">
                          <Link
                            href={`/spaces/${space.id}/purchases?room=${r.id ?? "none"}`}
                            className="truncate hover:underline"
                          >
                            {r.name}
                          </Link>
                          <Money minor={r.total} className="num text-right font-semibold" />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>

            <section aria-labelledby="recent-title" className="mt-10">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 id="recent-title" className="label text-ink-2">
                  Recent purchases
                </h2>
                <Link href={`/spaces/${space.id}/purchases`} className="text-[0.875rem] font-semibold text-[var(--space-bg)] hover:underline">
                  See all {o.count}
                </Link>
              </div>
              <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                {o.recent.map((p) => (
                  <li key={p.id} className="flex">
                    <PurchaseTile spaceId={space.id} p={p} currency={space.currency} />
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </main>
    </SpaceScope>
  );
}
