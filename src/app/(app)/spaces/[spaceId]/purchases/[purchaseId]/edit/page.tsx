import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SpaceScope } from "@/components/space";
import { updatePurchase } from "@/lib/actions/purchases";
import { getPurchase, getSpaceOptions } from "@/lib/data";
import { toInputAmount } from "@/lib/money";
import { PageSkeleton } from "../../../skeletons";
import { PurchaseForm } from "../../purchase-form";

export const metadata: Metadata = { title: "Edit purchase" };

type Props = PageProps<"/spaces/[spaceId]/purchases/[purchaseId]/edit">;

export default function EditPurchasePage(props: Props) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <EditPurchase {...props} />
    </Suspense>
  );
}

async function EditPurchase({ params }: Props) {
  const { spaceId, purchaseId } = await params;
  const [{ space, purchase: p }, options] = await Promise.all([getPurchase(spaceId, purchaseId), getSpaceOptions(spaceId)]);
  const detailHref = `/spaces/${space.id}/purchases/${p.id}`;

  return (
    <SpaceScope space={space}>
      <main className="pb-shell mx-auto w-full max-w-6xl px-5 pt-[max(1.25rem,env(safe-area-inset-top))] lg:px-10 lg:pt-10">
        <Link href={detailHref} className="inline-flex items-center gap-1.5 text-[0.875rem] font-semibold text-ink-2 hover:text-ink">
          <ArrowLeft size={16} aria-hidden /> Back
        </Link>
        <h1 className="mt-3 mb-6 text-title font-extrabold">Edit purchase</h1>
        <PurchaseForm
          action={updatePurchase.bind(null, space.id, p.id)}
          mode="edit"
          currency={space.currency}
          categories={options.categories.map((c) => ({ id: c.id, name: c.name, color: c.color }))}
          rooms={options.rooms.map((r) => ({ id: r.id, name: r.name }))}
          vendors={options.vendors.map((v) => ({ id: v.id, name: v.name }))}
          defaults={{
            name: p.name,
            purchasedOn: p.purchasedOn,
            quantity: String(Number(p.quantity)),
            unit: p.unit ?? "",
            unitPrice: toInputAmount(p.unitPrice),
            totalPaid: toInputAmount(p.totalPaid),
            originalTotal: toInputAmount(p.originalTotal),
            categoryId: p.categoryId ?? "",
            roomId: p.roomId ?? "",
            vendorName: p.vendor?.name ?? "",
            notes: p.notes ?? "",
          }}
          existing={p.attachments.map((a) => ({ id: a.id, kind: a.kind, mimeType: a.mimeType, originalName: a.originalName }))}
          cancelHref={detailHref}
        />
      </main>
    </SpaceScope>
  );
}
