import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ButtonLink, PageTitle } from "@/components/ui";
import { listSpaces } from "@/lib/data";
import { Money } from "@/components/money";
import { PrivacyToggle } from "@/components/privacy-toggle";
import { spaceColor } from "@/lib/palette";
import { NewSpaceForm } from "./new-space-form";

export const metadata: Metadata = { title: "Spaces" };

export default function SpacesPage() {
  return (
    <main className="pb-shell mx-auto w-full max-w-5xl px-5 pt-[max(1.5rem,env(safe-area-inset-top))] lg:px-10 lg:pt-10">
      <Suspense fallback={<SpacesSkeleton />}>
        <SpacesList />
      </Suspense>
    </main>
  );
}

async function SpacesList() {
  const spaces = await listSpaces();

  if (spaces.length === 0) {
    return (
      <div className="mx-auto max-w-lg pt-6">
        <h1 className="text-title font-extrabold">Start your first space</h1>
        <p className="mt-2 text-ink-2">
          A space holds everything you buy for one project. Start with your new home, and you can add others later.
        </p>
        <div className="mt-6 border border-line bg-card p-5">
          <NewSpaceForm defaultName="New Home" />
        </div>
      </div>
    );
  }

  return (
    <>
      <PageTitle
        actions={
          <>
            <PrivacyToggle className="text-ink-2 hover:text-ink lg:hidden" />
            <ButtonLink href="/spaces/new" variant="secondary">
              <Plus size={18} aria-hidden /> New space
            </ButtonLink>
          </>
        }
      >
        Your spaces
      </PageTitle>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {spaces.map((s, i) => {
          const c = spaceColor(s.color);
          return (
            <li key={s.id}>
              <Link
                href={`/spaces/${s.id}`}
                className="group relative block p-5 pb-6 shadow-[var(--shadow-lift)] transition-transform duration-200 ease-[var(--ease-out-expo)] hover:-translate-y-0.5"
                style={{ background: c.bg, color: c.fg }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[0.9375rem] font-bold">{s.name}</span>
                  <span className="chip-code opacity-75">SPACE {String(i + 1).padStart(2, "0")}</span>
                </div>
                <div className="mt-6 text-[2rem] leading-none font-extrabold tracking-[-0.02em]">
                  <Money minor={s.totalPaid} className="num" />
                  <span className="ml-1.5 text-[0.9375rem] font-semibold opacity-80">{s.currency}</span>
                </div>
                <div className="mt-2 text-[0.875rem] opacity-85">
                  {s.purchaseCount === 1 ? "1 purchase" : `${s.purchaseCount} purchases`}
                  {s.totalSaved > 0 && (
                    <>
                      {" · "}
                      <span className="num px-1.5 py-0.5 font-bold" style={{ background: c.accent, color: "#1b1e23" }}>
                        <Money minor={s.totalSaved} /> saved
                      </span>
                    </>
                  )}
                </div>
                <span className="notch" />
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function SpacesSkeleton() {
  return (
    <div aria-busy aria-label="Loading" className="loading-placeholder">
      <div className="h-7 w-40 bg-line" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="h-40 bg-line" />
        <div className="h-40 bg-line" />
      </div>
    </div>
  );
}
