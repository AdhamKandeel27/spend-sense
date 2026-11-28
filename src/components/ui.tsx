import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { chipCode, chipColor } from "@/lib/palette";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "space";

const base =
  "inline-flex items-center justify-center gap-2 font-semibold select-none whitespace-nowrap transition-[background-color,color,border-color,box-shadow,transform,opacity] duration-150 ease-[var(--ease-out-expo)] active:translate-y-px disabled:pointer-events-none [&:disabled:not([data-pending])]:opacity-50";

const variants: Record<Variant, string> = {
  // The pill is reserved for the primary action.
  primary: "rounded-[var(--radius-pill)] bg-ink text-ground hover:bg-[#2c3038] px-5 min-h-12",
  space: "rounded-[var(--radius-pill)] bg-[var(--space-bg)] text-[var(--space-fg)] hover:brightness-110 px-5 min-h-12",
  secondary: "border border-line-strong bg-card text-ink hover:border-ink px-4 min-h-11",
  ghost: "text-ink hover:bg-black/5 px-3 min-h-11",
  // Destructive: outline only, until hovered or focused.
  danger:
    "border border-danger/60 text-danger bg-transparent hover:bg-danger hover:text-white focus-visible:bg-danger focus-visible:text-white px-4 min-h-11",
};

/**
 * `pending` keeps the button at full colour and the same width: the label
 * and the busy state (spinner + `pendingLabel`) share one grid cell, so the
 * button is sized for whichever is wider and never jumps when you tap it.
 */
export function Button({
  variant = "secondary",
  className = "",
  pending = false,
  pendingLabel,
  disabled,
  children,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; pending?: boolean; pendingLabel?: string }) {
  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      data-pending={pending || undefined}
      {...props}
    >
      <span className="grid">
        <span className={`inline-flex items-center justify-center gap-2 [grid-area:1/1] ${pending ? "invisible" : ""}`}>{children}</span>
        <span
          aria-hidden={!pending}
          className={`inline-flex items-center justify-center gap-2 [grid-area:1/1] ${pending ? "" : "invisible"}`}
        >
          {pending && <span className="btn-spinner" />}
          {pendingLabel ?? <span className="sr-only">Working…</span>}
        </span>
      </span>
    </button>
  );
}

export function ButtonLink({
  variant = "secondary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className = "",
}: {
  label: ReactNode;
  htmlFor: string;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={htmlFor} className="text-[0.8125rem] font-semibold text-ink-2">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-[0.8125rem] font-medium text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[0.8125rem] text-ink-3">{hint}</p>
      ) : null}
    </div>
  );
}

/** A category paint chip: colour square + mono code + optional name. */
export function Chip({
  name,
  color,
  showName = true,
  className = "",
}: {
  name: string | null;
  color: number | null;
  showName?: boolean;
  className?: string;
}) {
  const c = chipColor(name ? color : -1);
  return (
    <span className={`inline-flex min-w-0 items-center gap-2 ${className}`}>
      <span
        aria-hidden
        className="chip-code inline-grid h-5 min-w-7 shrink-0 place-items-center px-1"
        style={{ background: c.bg, color: c.fg }}
      >
        {chipCode(name)}
      </span>
      {showName && <span className="truncate">{name ?? "Uncategorised"}</span>}
    </span>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 border border-dashed border-line-strong bg-card/60 p-6">
      <h2 className="text-title font-bold">{title}</h2>
      {children && <div className="max-w-[52ch] text-ink-2">{children}</div>}
      {action}
    </div>
  );
}

export function PageTitle({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <h1 className="text-title font-extrabold tracking-[-0.01em]">{children}</h1>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
