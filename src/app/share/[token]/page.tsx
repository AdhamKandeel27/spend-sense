import type { Metadata } from "next";
import { Suspense } from "react";
import { DeckLegend, DeckStrip, PurchaseTile, SpaceHeader, SpaceScope } from "@/components/space";
import { EmptyState } from "@/components/ui";
import { getSharedOverview, spaceCode } from "@/lib/data";
import { Money } from "@/components/money";
import { OverviewSkeleton } from "../../(app)/spaces/[spaceId]/skeletons";
import { ViewOnlyNote } from "./view-only-note";

export const metadata: Metadata = {
  title: "Shared space",
  // The link is the secret: keep it out of search engines and Referer headers.
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

type Props = PageProps<"/share/[token]">;

export default function SharedSpacePage({ params }: Props) {
  return (
    <Suspense fallback={<OverviewSkeleton />}>
      <SharedSpace params={params} />
    </Suspense>
  );
}

async function SharedSpace({ params }: Pick<Props, "params">) {
  const { token } = await params;
  const o = await getSharedOverview(token);
  const { space } = o;
  const fileBase = `/api/share/${token}/files`;

  return (
    <SpaceScope space={space}>
      <SpaceHeader
        space={space}
        code={spaceCode(o.number)}
        totalPaid={o.totalPaid}
        totalSaved={o.totalSaved}
        count={o.count}
        viewOnly
      />
      <main className="mx-auto w-full max-w-6xl px-5 pb-[max(3rem,env(safe-area-inset-bottom))] lg:px-10">
        <ViewOnlyNote name={o.viewerName} />

        {o.count === 0 ? (
          <div className="pt-6">
            <EmptyState title="Nothing here yet">Purchases will show up here as they&rsquo;re added.</EmptyState>
          </div>
        ) : (
          <>
            <section aria-labelledby="deck-title" className="pt-6">
              <h2 id="deck-title" className="sr-only">
                Spending by category
              </h2>
              <DeckStrip spaceId={space.id} items={o.byCategory} total={o.totalPaid} interactive={false} />
              <div className="mt-4 grid gap-8 lg:grid-cols-2">
                <DeckLegend items={o.byCategory} currency={space.currency} limit={6} />
                {o.byRoom.some((r) => r.id) && (
                  <div>
                    <h3 className="label mb-2.5 text-ink-2">By room</h3>
                    <ul className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 text-[0.875rem]">
                      {o.byRoom.slice(0, 6).map((r) => (
                        <li key={r.id ?? "none"} className="contents">
                          <span className="truncate">{r.name}</span>
                          <Money minor={r.total} className="num text-right font-semibold" />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>

            <section aria-labelledby="all-title" className="mt-10">
              <h2 id="all-title" className="label mb-3 text-ink-2">
                {o.count === 1 ? "1 purchase" : `All ${o.count} purchases`}
              </h2>
              <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                {o.recent.map((p) => (
                  <li key={p.id} className="flex">
                    <PurchaseTile
                      spaceId={space.id}
                      p={p}
                      currency={space.currency}
                      href={`/share/${token}/p/${p.id}`}
                      fileBase={fileBase}
                    />
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
