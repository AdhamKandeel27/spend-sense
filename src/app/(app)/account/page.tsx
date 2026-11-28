import type { Metadata } from "next";
import { Suspense } from "react";
import { PrivacyDefault } from "@/components/privacy-toggle";
import { requireUser } from "@/lib/session";
import { SignOutButton } from "./sign-out-button";

export const metadata: Metadata = { title: "Account" };

export default function AccountPage() {
  return (
    <main className="pb-shell mx-auto w-full max-w-lg px-5 pt-[max(1.5rem,env(safe-area-inset-top))] lg:pt-10">
      <h1 className="text-title font-extrabold">Account</h1>
      <Suspense fallback={<div className="mt-6 h-32 loading-placeholder bg-line" />}>
        <AccountDetails />
      </Suspense>
      <section className="mt-10">
        <h2 className="text-[1rem] font-bold">Hide amounts</h2>
        <p className="mt-1 mb-4 max-w-[60ch] text-[0.9375rem] text-ink-2">
          Choose how the app opens. You can always tap the eye at the top of a page to show or hide amounts until you next open
          the app. Saved on this device.
        </p>
        <PrivacyDefault />
      </section>
      <section className="mt-10">
        <h2 className="text-[1rem] font-bold">Install on your phone</h2>
        <ul className="mt-2 flex max-w-[60ch] flex-col gap-2 text-[0.9375rem] text-ink-2">
          <li>
            <strong className="text-ink">iPhone (Safari):</strong> tap Share, then “Add to Home Screen”.
          </li>
          <li>
            <strong className="text-ink">Android (Chrome):</strong> open the ⋮ menu, then “Install app” or “Add to Home screen”.
          </li>
        </ul>
      </section>
    </main>
  );
}

async function AccountDetails() {
  const user = await requireUser();
  return (
    <div className="mt-6 border border-line bg-card">
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-3 p-4 text-[0.9375rem]">
        <dt className="text-ink-3">Name</dt>
        <dd className="truncate font-medium">{user.name}</dd>
        <dt className="text-ink-3">Email</dt>
        <dd className="truncate font-medium">{user.email}</dd>
      </dl>
      <div className="border-t border-line p-4">
        <SignOutButton />
      </div>
    </div>
  );
}
