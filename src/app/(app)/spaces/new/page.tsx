import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NewSpaceForm } from "../new-space-form";

export const metadata: Metadata = { title: "New space" };

export default function NewSpacePage() {
  return (
    <main className="pb-shell mx-auto w-full max-w-lg px-5 pt-[max(1.5rem,env(safe-area-inset-top))] lg:pt-10">
      <Link href="/spaces" className="inline-flex items-center gap-1.5 text-[0.875rem] font-semibold text-ink-2 hover:text-ink">
        <ArrowLeft size={16} aria-hidden /> Spaces
      </Link>
      <h1 className="mt-4 text-title font-extrabold">New space</h1>
      <p className="mt-1 text-ink-2">A trip, a wedding, a renovation: anything you want to keep its own tally.</p>
      <div className="mt-6 border border-line bg-card p-5">
        <NewSpaceForm />
      </div>
    </main>
  );
}
