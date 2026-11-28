"use client";

import { LayoutGrid, Layers, List, Plus, Settings2, UserRound } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { PrivacyToggle } from "@/components/privacy-toggle";
import { Wordmark } from "@/components/wordmark";

const LAST_SPACE_KEY = "spend-sense:last-space";

const subscribeStorage = (cb: () => void) => {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
};

/**
 * The space in the URL, or the last one visited (so Overview/Purchases work
 * from /account). Only spaces that still exist count: a remembered id can be
 * stale (the space was deleted, or came from another database).
 */
function useSpaceContext(spaceIds: string[]) {
  const params = useParams<{ spaceId?: string }>();
  const last = useSyncExternalStore(
    subscribeStorage,
    () => localStorage.getItem(LAST_SPACE_KEY),
    () => null,
  );
  const exists = (id: string | null | undefined): id is string => !!id && spaceIds.includes(id);

  useEffect(() => {
    if (exists(params.spaceId)) localStorage.setItem(LAST_SPACE_KEY, params.spaceId);
    else if (last && !exists(last)) localStorage.removeItem(LAST_SPACE_KEY);
  });

  if (exists(params.spaceId)) return params.spaceId;
  return exists(last) ? last : null;
}

export function AppNav({ spaceIds }: { spaceIds: string[] }) {
  const pathname = usePathname();
  const spaceId = useSpaceContext(spaceIds);
  const base = spaceId ? `/spaces/${spaceId}` : null;

  const items = [
    { href: "/spaces", label: "Spaces", icon: Layers, active: pathname === "/spaces" || pathname === "/spaces/new" },
    {
      href: base ?? "/spaces",
      label: "Overview",
      icon: LayoutGrid,
      active: !!base && pathname === base,
      disabled: !base,
    },
    {
      href: base ? `${base}/purchases` : "/spaces",
      label: "Purchases",
      icon: List,
      active: !!base && pathname.startsWith(`${base}/purchases`) && !pathname.endsWith("/new"),
      disabled: !base,
    },
    { href: "/account", label: "Me", icon: UserRound, active: pathname === "/account" },
  ];

  const showAdd = !!base && !pathname.endsWith("/new") && !pathname.endsWith("/edit");
  const addHref = base ? `${base}/purchases/new` : "/spaces";

  return (
    <>
      {/* Phone: bottom tab bar + floating add pill. */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-4">
          {items.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                aria-current={item.active ? "page" : undefined}
                aria-disabled={item.disabled || undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[0.6875rem] font-semibold tracking-[0.02em] ${
                  item.active ? "text-ink" : "text-ink-3"
                } ${item.disabled ? "pointer-events-none opacity-40" : ""}`}
              >
                <item.icon size={22} strokeWidth={item.active ? 2.25 : 1.75} aria-hidden />
                {item.label}
                <span aria-hidden className={`h-0.5 w-5 ${item.active ? "bg-ink" : "bg-transparent"}`} />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {showAdd && (
        <Link
          href={addHref}
          className="fixed bottom-[calc(5rem+var(--foot-offset,0px)+env(safe-area-inset-bottom))] left-1/2 z-40 inline-flex min-h-13 -translate-x-1/2 items-center gap-2 rounded-[var(--radius-pill)] bg-ink px-6 text-[0.9375rem] font-bold text-ground shadow-[var(--shadow-float)] transition-transform duration-150 active:scale-[0.98] lg:hidden"
        >
          <Plus size={20} strokeWidth={2.5} aria-hidden />
          Add purchase
        </Link>
      )}

      {/* Desktop: side rail. */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-card px-4 py-6 lg:flex">
        <Link href="/spaces" className="px-2">
          <Wordmark />
        </Link>
        {base && (
          <Link
            href={addHref}
            className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-pill)] bg-ink px-5 font-bold text-ground hover:bg-[#2c3038]"
          >
            <Plus size={18} strokeWidth={2.5} aria-hidden /> Add purchase
          </Link>
        )}
        <ul className="mt-8 flex flex-col gap-0.5">
          {items.slice(0, 3).map((item) => (
            <li key={item.label}>
              <RailLink {...item} />
            </li>
          ))}
          {base && (
            <li>
              <RailLink
                href={`${base}/settings`}
                label="Space settings"
                icon={Settings2}
                active={pathname === `${base}/settings`}
              />
            </li>
          )}
        </ul>
        <div className="mt-auto flex flex-col gap-0.5">
          <PrivacyToggle label className="justify-start px-2 font-semibold text-ink-2 hover:bg-ground/70 hover:text-ink" />
          <RailLink {...items[3]} label="Account" />
        </div>
      </aside>
    </>
  );
}

function RailLink({
  href,
  label,
  icon: Icon,
  active,
  disabled,
}: {
  href: string;
  label: string;
  icon: typeof Layers;
  active: boolean;
  disabled?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      aria-disabled={disabled || undefined}
      className={`flex min-h-10 items-center gap-3 px-2 font-semibold ${
        active ? "bg-ground text-ink" : "text-ink-2 hover:bg-ground/70 hover:text-ink"
      } ${disabled ? "pointer-events-none opacity-40" : ""}`}
    >
      <Icon size={18} strokeWidth={active ? 2.25 : 1.75} aria-hidden />
      {label}
    </Link>
  );
}
