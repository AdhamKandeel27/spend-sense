import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { GroupHistory } from "@/components/group-history";
import { SpaceScope } from "@/components/space";
import { Chip } from "@/components/ui";
import { getSharedPurchase } from "@/lib/data";
import { formatDay } from "@/lib/dates";
import { Money } from "@/components/money";
import { discountPercent } from "@/lib/money";
import { PageSkeleton } from "../../../../(app)/spaces/[spaceId]/skeletons";
import { Gallery } from "../../../../(app)/spaces/[spaceId]/purchases/[purchaseId]/gallery";
import { ViewOnlyNote } from "../../view-only-note";

export const metadata: Metadata = {
  title: "Shared purchase",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

type Props = PageProps<"/share/[token]/p/[purchaseId]">;

export default function SharedPurchasePage({ params }: Props) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SharedPurchase params={params} />
    </Suspense>
  );
}

/** A purchase's listing for a viewer: same as the owner's page, minus editing, deleting and receipts. */
async function SharedPurchase({ params }: Pick<Props, "params">) {
  const { token, purchaseId } = await params;
  const { space, purchase: p, group, viewerName } = await getSharedPurchase(token, purchaseId);

  const pct = discountPercent(p.totalPaid, p.originalTotal);
  const qty = Number(p.quantity);

  return (
    <SpaceScope space={space}>
      <main className="mx-auto w-full max-w-6xl px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(3rem,env(safe-area-inset-bottom))] lg:px-10 lg:pt-10">
        <Link href={`/share/${token}`} className="inline-flex items-center gap-1.5 text-[0.875rem] font-semibold text-ink-2 hover:text-ink">
          <ArrowLeft size={16} aria-hidden /> {space.name}
        </Link>
        <ViewOnlyNote name={viewerName} />

        <div className="mt-5 grid gap-x-10 gap-y-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          <div className="lg:sticky lg:top-8 lg:self-start">
            <Gallery photoIds={p.attachments.map((a) => a.id)} alt={p.name} fileBase={`/api/share/${token}/files`} />
          </div>

          <div className="flex flex-col gap-6">
            <div>
              <Chip name={p.category?.name ?? null} color={p.category?.color ?? null} className="text-[0.875rem] font-semibold text-ink-2" />
              <h1 className="mt-2 text-[1.625rem] leading-tight font-extrabold tracking-[-0.015em] text-balance">{p.name}</h1>
            </div>

            <div className="border border-line bg-card">
              <div className="flex flex-wrap items-end justify-between gap-3 p-4">
                <div>
                  <p className="text-[0.8125rem] font-medium text-ink-2">Paid</p>
                  <p className="text-[2.25rem] leading-none font-extrabold tracking-[-0.02em]">
                    <Money minor={p.totalPaid} className="num" />
                    <span className="ml-1.5 text-[0.9375rem] font-semibold tracking-normal text-ink-3">{space.currency}</span>
                  </p>
                </div>
                {pct != null && p.originalTotal != null && (
                  <div className="text-right">
                    <span className="num inline-block bg-ochre px-1.5 py-0.5 font-bold">−{pct}%</span>
                    <p className="num mt-1 text-[0.875rem] text-ink-2">
                      was <Money minor={p.originalTotal} className="line-through" /> · saved{" "}
                      <strong className="text-ink">
                        <Money minor={p.originalTotal - p.totalPaid} />
                      </strong>
                    </p>
                  </div>
                )}
              </div>
              {(qty !== 1 || p.unitPrice != null) && (
                <p className="num border-t border-line px-4 py-2.5 text-[0.9375rem] text-ink-2">
                  {formatQty(qty)}
                  {p.unit ? ` ${p.unit}` : ""}
                  {p.unitPrice != null ? (
                    <>
                      {" × "}
                      <Money minor={p.unitPrice} /> {space.currency}
                      {p.unit ? ` / ${p.unit}` : " each"}
                    </>
                  ) : (
                    <>
                      {`${p.unit ? "" : " items"} · `}
                      <Money minor={Math.round(p.totalPaid / qty)} /> {space.currency} each
                    </>
                  )}
                </p>
              )}
            </div>

            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-3 text-[0.9375rem]">
              <Row label="Date">{formatDay(p.purchasedOn, { weekday: "short", day: "numeric", month: "long", year: "numeric" })}</Row>
              <Row label="Room / area">{p.room?.name ?? "—"}</Row>
              <Row label="Brand">{p.brand ?? "—"}</Row>
              <Row label="Store">{p.vendor?.name ?? "—"}</Row>
              {p.notes && (
                <Row label="Notes">
                  <span className="whitespace-pre-line">{p.notes}</span>
                </Row>
              )}
            </dl>

            <GroupHistory members={group} currentId={p.id} currency={space.currency} hrefFor={(id) => `/share/${token}/p/${id}`} />
          </div>
        </div>
      </main>
    </SpaceScope>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-ink-3">{label}</dt>
      <dd className="min-w-0 font-medium">{children}</dd>
    </>
  );
}

function formatQty(q: number) {
  return new Intl.NumberFormat("en", { maximumFractionDigits: 3 }).format(q);
}
