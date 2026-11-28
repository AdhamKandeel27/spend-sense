import { Suspense } from "react";
import { AppNav } from "@/components/app-nav";
import { listSpaceIds } from "@/lib/data";

async function Nav() {
  return <AppNav spaceIds={await listSpaceIds()} />;
}

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh">
      <Suspense>
        <Nav />
      </Suspense>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
