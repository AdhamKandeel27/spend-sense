import { ArrowLeft, Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SpaceScope } from "@/components/space";
import { createPurchase } from "@/lib/actions/purchases";
import { getSpaceOptions } from "@/lib/data";
import { todayInCairo } from "@/lib/dates";
import { PageSkeleton } from "../../skeletons";
import { PurchaseForm } from "../purchase-form";

export const metadata: Metadata = { title: "Add purchase" };

type Props = PageProps<"/spaces/[spaceId]/purchases/new">;

export default function NewPurchasePage(props: Props) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <NewPurchase {...props} />
    </Suspense>
  );
}

async function NewPurchase({ params, searchParams }: Props) {
  const { spaceId } = await params;
  const { added } = await searchParams;
  const { space, categories, rooms, vendors } = await getSpaceOptions(spaceId);

  return (
    <SpaceScope space={space}>
      <main className="pb-shell mx-auto w-full max-w-6xl px-5 pt-[max(1.25rem,env(safe-area-inset-top))] lg:px-10 lg:pt-10">
        <Link href={`/spaces/${space.id}`} className="inline-flex items-center gap-1.5 text-[0.875rem] font-semibold text-ink-2 hover:text-ink">
          <ArrowLeft size={16} aria-hidden /> {space.name}
        </Link>
        <h1 className="mt-3 mb-6 text-title font-extrabold">Add purchase</h1>

        {typeof added === "string" && (
          <p role="status" className="mb-6 flex items-center gap-2 border border-ok/30 bg-[#e7f0ea] px-3 py-2.5 text-[0.875rem] font-medium text-ok">
            <Check size={16} aria-hidden /> Saved.{" "}
            <Link href={`/spaces/${space.id}/purchases/${added}`} className="underline">
              View it
            </Link>{" "}
            or add the next one.
          </p>
        )}

        {/* key resets the form after "Save & add another". */}
        <PurchaseForm
          key={typeof added === "string" ? added : "new"}
          action={createPurchase.bind(null, space.id)}
          mode="create"
          currency={space.currency}
          categories={categories.map((c) => ({ id: c.id, name: c.name, color: c.color }))}
          rooms={rooms.map((r) => ({ id: r.id, name: r.name }))}
          vendors={vendors.map((v) => ({ id: v.id, name: v.name }))}
          defaults={{ purchasedOn: todayInCairo(), quantity: "1" }}
          cancelHref={`/spaces/${space.id}`}
        />
      </main>
    </SpaceScope>
  );
}
