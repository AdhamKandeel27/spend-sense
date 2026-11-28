"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui";

/**
 * Destructive actions stay set apart and need a second, deliberate tap.
 */
export function ConfirmDelete({
  label,
  confirmLabel,
  description,
  onConfirm,
}: {
  label: string;
  confirmLabel: string;
  description: string;
  onConfirm: () => Promise<void>;
}) {
  const [armed, setArmed] = useState(false);
  const [pending, start] = useTransition();

  if (!armed) {
    return (
      <Button variant="danger" onClick={() => setArmed(true)}>
        <Trash2 size={16} aria-hidden /> {label}
      </Button>
    );
  }
  return (
    <div role="alertdialog" aria-label={label} className="flex flex-col gap-3 border border-danger/40 bg-danger-tint p-4">
      <p className="text-[0.9375rem] text-ink">{description}</p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="danger"
          className="bg-danger !text-white hover:brightness-110"
          pending={pending}
          pendingLabel="Deleting…"
          onClick={() => start(onConfirm)}
          autoFocus
        >
          {confirmLabel}
        </Button>
        <Button variant="ghost" onClick={() => setArmed(false)} disabled={pending}>
          Keep it
        </Button>
      </div>
    </div>
  );
}
