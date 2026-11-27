import { Wordmark } from "@/components/wordmark";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* The deck, fanned, as the brand side. */}
      <section className="relative flex flex-col justify-between overflow-hidden bg-[#1f5a50] px-6 pt-[max(2.5rem,env(safe-area-inset-top))] pb-8 text-[#f2f2ee] lg:px-12 lg:py-12">
        <Wordmark tone="light" />
        <div className="mt-10 max-w-md lg:mt-0">
          <p className="text-[1.75rem] leading-tight font-extrabold tracking-[-0.02em] lg:text-[2.5rem]">
            Everything you buy, filed like paint chips.
          </p>
          <p className="mt-3 max-w-[40ch] text-[#d5e2df]">
            Snap it, price it, file it into a space. See where the money went, one chip at a time.
          </p>
        </div>
        <div aria-hidden className="mt-8 flex h-14 gap-0.5 lg:mt-0 lg:h-20">
          {["#3B5A8E", "#B04A3A", "#D69A2D", "#5B7F4E", "#6B4A6E", "#2E7C8A"].map((c, i) => (
            <span key={c} className="deck-chip" style={{ background: c, flex: [34, 27, 19, 12, 8, 6][i], animationDelay: `${i * 60}ms` }} />
          ))}
        </div>
        <span className="notch hidden lg:block" style={{ right: "-0.875rem", bottom: "50%" }} />
      </section>
      <section className="flex items-start justify-center px-6 py-10 lg:items-center lg:px-12">
        <div className="w-full max-w-sm">{children}</div>
      </section>
    </main>
  );
}
