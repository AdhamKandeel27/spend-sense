import { formatAmount } from "@/lib/money";

/**
 * A money amount that the privacy toggle can hide. Both forms are always in
 * the page; CSS on <html data-hide-money> picks one, so hiding is instant,
 * works in server and client components, and never flashes the real value.
 */
export function Money({ minor, className = "" }: { minor: number; className?: string }) {
  return (
    <span className={`money ${className}`}>
      <span className="money-value">{formatAmount(minor)}</span>
      <span className="money-mask" role="img" aria-label="Amount hidden">
        •••••
      </span>
    </span>
  );
}
