import { Eye } from "lucide-react";

export function ViewOnlyNote({ name }: { name: string }) {
  return (
    <p className="mt-5 flex items-center gap-2 border border-line bg-card px-3 py-2.5 text-[0.875rem] text-ink-2">
      <Eye size={16} aria-hidden className="shrink-0" />
      <span>
        View only · shared with <strong className="font-semibold text-ink">{name}</strong>
      </span>
    </p>
  );
}
