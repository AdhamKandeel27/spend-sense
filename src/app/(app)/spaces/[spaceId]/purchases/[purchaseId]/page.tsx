import { ArrowLeft, Check, Download, FileText, Layers, Pencil } from "lucide-react";
import { GroupHistory } from "@/components/group-history";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ConfirmDelete } from "@/components/confirm-delete";
import { SpaceScope } from "@/components/space";
import { ButtonLink, Chip } from "@/components/ui";
import { deletePurchase, unlinkPurchase } from "@/lib/actions/purchases";
import { getPurchase, getPurchaseGroup } from "@/lib/data";
import { formatDay } from "@/lib/dates";
import { Money } from "@/components/money";
import { PrivacyToggle } from "@/components/privacy-toggle";
import { discountPercent } from "@/lib/money";
import { PageSkeleton } from "../../skeletons";
import { Gallery } from "./gallery";

export const metadata: Metadata = { title: "Purchase" };

type Props = PageProps<"/spaces/[spaceId]/purchases/[purchaseId]">;

export default function PurchasePage(props: Props) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PurchaseDetail {...props} />
    </Suspense>
  );
}

async function PurchaseDetail({ params, searchParams }: Props) {
  const { spaceId, purchaseId } = await params;
  const { saved } = await searchParams;
  const [{ space, purchase: p }, group] = await Promise.all([getPurchase(spaceId, purchaseId), getPurchaseGroup(spaceId, purchaseId)]);

  const photos = p.attachments.filter((a) => a.kind === "photo");
  const receipts = p.attachments.filter((a) => a.kind === "receipt");
  const pct = discountPercent(p.totalPaid, p.originalTotal);
  const qty = Number(p.quantity);
  const remove = deletePurchase.bind(null, space.id, p.id);

  return (
    <SpaceScope space={space}>
      <main className="pb-shell mx-auto w-full max-w-6xl px-5 pt-[max(1.25rem,env(safe-area-inset-top))] lg:px-10 lg:pt-10">
        <div className="flex items-center justify-between gap-3">
          <Link
            href={`/spaces/${space.id}/purchases`}
            className="inline-flex items-center gap-1.5 text-[0.875rem] font-semibold text-ink-2 hover:text-ink"
          >
            <ArrowLeft size={16} aria-hidden /> Purchases
          </Link>
          <div className="flex items-center gap-2">
            <PrivacyToggle className="text-ink-2 hover:text-ink lg:hidden" />
            <ButtonLink href={`/spaces/${space.id}/purchases/new?more=${p.id}`} variant="secondary">
              <Layers size={16} aria-hidden /> Buy more
            </ButtonLink>
            <ButtonLink href={`/spaces/${space.id}/purchases/${p.id}/edit`} variant="secondary" aria-label="Edit" className="px-3 sm:px-4">
              <Pencil size={16} aria-hidden /> <span className="hidden sm:inline">Edit</span>
            </ButtonLink>
          </div>
        </div>

        {saved && (
          <p role="status" className="mt-4 flex items-center gap-2 border border-ok/30 bg-[#e7f0ea] px-3 py-2.5 text-[0.875rem] font-medium text-ok">
            <Check size={16} aria-hidden /> Saved
          </p>
        )}

        <div className="mt-5 grid gap-x-10 gap-y-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          <div className="lg:sticky lg:top-8 lg:self-start">
            <Gallery photoIds={photos.map((ph) => ph.id)} alt={p.name} />
          </div>

          <div className="flex flex-col gap-6">
            <div>
              <Chip name={p.category?.name ?? null} color={p.category?.color ?? null} className="text-[0.875rem] font-semibold text-ink-2" />
              <h1 className="mt-2 text-[1.625rem] leading-tight font-extrabold tracking-[-0.015em] text-balance">{p.name}</h1>
            </div>

            {/* Price chip */}
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
              <Row label="Store">
                {p.vendor ? (
                  <Link href={`/spaces/${space.id}/purchases?vendor=${p.vendor.id}`} className="underline">
                    {p.vendor.name}
                  </Link>
                ) : (
                  "—"
                )}
              </Row>
              {p.notes && <Row label="Notes"><span className="whitespace-pre-line">{p.notes}</span></Row>}
            </dl>

            <GroupHistory
              members={group}
              currentId={p.id}
              currency={space.currency}
              hrefFor={(id) => `/spaces/${space.id}/purchases/${id}`}
              separate={unlinkPurchase.bind(null, space.id, p.id)}
            />

            <section aria-labelledby="receipts-title">
              <h2 id="receipts-title" className="label mb-2.5 text-ink-2">
                Receipts &amp; invoices
              </h2>
              {receipts.length === 0 ? (
                <p className="text-[0.9375rem] text-ink-3">
                  No receipt attached.{" "}
                  <Link href={`/spaces/${space.id}/purchases/${p.id}/edit`} className="font-semibold text-ink underline">
                    Add one
                  </Link>
                </p>
              ) : (
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {receipts.map((r) => (
                    <li key={r.id} className="flex flex-col border border-line bg-card">
                      <a href={`/api/files/${r.id}`} target="_blank" rel="noreferrer" className="block">
                        {r.mimeType === "application/pdf" ? (
                          <span className="grid aspect-[3/4] place-items-center bg-ground text-ink-2">
                            <FileText size={32} strokeWidth={1.5} aria-hidden />
                          </span>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={`/api/files/${r.id}?size=thumb`} alt="Receipt" className="aspect-[3/4] w-full object-cover" />
                        )}
                      </a>
                      <div className="flex items-center justify-between gap-2 p-2">
                        <span className="truncate text-[0.8125rem] text-ink-2">{r.originalName ?? "Receipt"}</span>
                        <a href={`/api/files/${r.id}?download=1`} aria-label="Download receipt" className="shrink-0 text-ink-2 hover:text-ink">
                          <Download size={16} aria-hidden />
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Deliberately isolated from the other actions. */}
            <div className="mt-8 border-t border-line pt-6">
              <ConfirmDelete
                label="Delete purchase"
                confirmLabel="Delete for good"
                description={`Delete “${p.name}” and its ${p.attachments.length === 1 ? "file" : `${p.attachments.length} files`}? This can't be undone.`}
                onConfirm={remove}
              />
            </div>
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
