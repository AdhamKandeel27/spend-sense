import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SpaceScope } from "@/components/space";
import {
  addCategory,
  addRoom,
  createShare,
  deleteCategory,
  deleteRoom,
  deleteShare,
  deleteSpace,
  updateCategory,
  updateRoom,
  updateSpace,
} from "@/lib/actions/spaces";
import { getSpaceOptions, getUsageCounts, listShares } from "@/lib/data";
import { PageSkeleton } from "../skeletons";
import { DeleteSpaceForm, ListManager, SpaceDetailsForm } from "./settings-forms";
import { ViewerLinks } from "./viewer-links";

/** "3 Dec, 14:05" in Cairo time. */
function formatWhen(d: Date) {
  return d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Cairo" });
}

export const metadata: Metadata = { title: "Space settings" };

type Props = PageProps<"/spaces/[spaceId]/settings">;

export default function SettingsPage(props: Props) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Settings {...props} />
    </Suspense>
  );
}

async function Settings({ params }: Props) {
  const { spaceId } = await params;
  const [{ space, categories, rooms }, usage, shares] = await Promise.all([
    getSpaceOptions(spaceId),
    getUsageCounts(spaceId),
    listShares(spaceId),
  ]);
  const catN = usage.categories;
  const roomN = usage.rooms;

  return (
    <SpaceScope space={space}>
      <main className="pb-shell mx-auto w-full max-w-3xl px-5 pt-[max(1.25rem,env(safe-area-inset-top))] lg:px-10 lg:pt-10">
        <Link href={`/spaces/${space.id}`} className="inline-flex items-center gap-1.5 text-[0.875rem] font-semibold text-ink-2 hover:text-ink">
          <ArrowLeft size={16} aria-hidden /> {space.name}
        </Link>
        <h1 className="mt-3 text-title font-extrabold">Space settings</h1>

        <Section title="Details">
          <SpaceDetailsForm action={updateSpace.bind(null, space.id)} name={space.name} description={space.description} color={space.color} />
        </Section>

        <Section title="Categories" description="What kind of thing it is. Each category is a chip in the deck; tap a chip to change its colour.">
          <ListManager
            kind="category"
            items={categories.map((c) => ({ id: c.id, name: c.name, color: c.color, count: catN.get(c.id) ?? 0 }))}
            add={addCategory.bind(null, space.id)}
            update={updateCategory.bind(null, space.id)}
            remove={deleteCategory.bind(null, space.id)}
          />
        </Section>

        <Section title="Rooms & areas" description="Where it goes in the house.">
          <ListManager
            kind="room"
            items={rooms.map((r) => ({ id: r.id, name: r.name, count: roomN.get(r.id) ?? 0 }))}
            add={addRoom.bind(null, space.id)}
            update={updateRoom.bind(null, space.id)}
            remove={deleteRoom.bind(null, space.id)}
          />
        </Section>

        <Section
          title="Viewers"
          description="Make a view-only link for someone and send it to them. They can browse this space's purchases, photos and prices without an account, but can't change anything or see receipts. Remove a link to cut off access."
        >
          <ViewerLinks
            spaceName={space.name}
            viewers={shares.map((s) => ({
              id: s.id,
              name: s.name,
              token: s.token,
              created: formatWhen(s.createdAt),
              opened: s.lastViewedAt ? formatWhen(s.lastViewedAt) : null,
            }))}
            create={createShare.bind(null, space.id)}
            remove={deleteShare.bind(null, space.id)}
          />
        </Section>

        <section className="mt-14 border-t border-danger/30 pt-6">
          <h2 className="text-[1rem] font-bold text-danger">Delete space</h2>
          <p className="mt-1 mb-4 max-w-[60ch] text-[0.9375rem] text-ink-2">
            Removes the space, every purchase in it, and all their photos and receipts. This can&rsquo;t be undone. Export a CSV first if you
            want a record.
          </p>
          <DeleteSpaceForm action={deleteSpace.bind(null, space.id)} name={space.name} />
        </section>
      </main>
    </SpaceScope>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-[1rem] font-bold">{title}</h2>
      {description && <p className="mt-1 max-w-[60ch] text-[0.9375rem] text-ink-2">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}
