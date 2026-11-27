"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";
import { signOut } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return (
    <Button
      variant="secondary"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await signOut();
        router.replace("/sign-in");
        router.refresh();
      }}
    >
      <LogOut size={16} aria-hidden /> {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
