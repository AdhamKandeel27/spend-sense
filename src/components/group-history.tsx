import { Layers, ReceiptText } from "lucide-react";
import Link from "next/link";
import type { GroupMember } from "@/lib/data";
import { formatDay } from "@/lib/dates";
import { summarise } from "@/lib/groups";
import { formatAmount } from "@/lib/money";
import { SubmitButton } from "./submit-button";

const fmtQty = (q: number) => new Intl.NumberFormat("en", { maximumFractionDigits: 3 }).format(q);

/**
 * "Bought 2 times": the combined total of an item bought in batches, then
 * each batch with its own date, quantity, price and store.
 */
export function GroupHistory({
  members,
  currentId,
  currency,
  hrefFor,
  separate,
}: {
  members: GroupMember[];
  currentId: string;
  currency: string;
  hrefFor: (id: string) => string;
  /** Owner only: takes the current purchase out of the group. */
  separate?: () => Promise<void>;
}) {
  if (members.length < 2) return null;
  const sum = summarise(members);
  const qty = sum.quantity != null ? Number(sum.quantity) : null;
  const avg = qty && qty > 0 ? Math.round(sum.totalPaid / qty) : null;

  return (
    <section aria-labelledby="group-title" className="border border-line bg-card">
      <div className="flex items-start gap-3 border-b border-line p-4">
        <Layers size={18} aria-hidden className="mt-0.5 shrink-0 text-[var(--space-bg)]" />
        <div className="min-w-0">
          <h2 id="group-title" className="font-bold">
            Bought {members.length} times
          </h2>
          <p className="num mt-0.5 text-[0.875rem] text-ink-2">
            {qty != null && (qty !== members.length || sum.unit) ? `${fmtQty(qty)}${sum.unit ? ` ${sum.unit}` : " items"} · ` : ""}
            <strong className="text-ink">
              {formatAmount(sum.totalPaid)} {currency}
            </strong>{" "}
            in total
            {avg != null && (qty !== members.length || sum.unit)
              ? ` · avg ${formatAmount(avg)} ${currency}${sum.unit ? ` / ${sum.unit}` : " each"}`
              : ""}
          </p>
        </div>
      </div>

      <ol>
        {members.map((m) => {
          const q = Number(m.quantity);
          const each = m.unitPrice ?? (q > 0 ? Math.round(m.totalPaid / q) : null);
          const current = m.id === currentId;
          const body = (
            <>
              <span className="min-w-0">
                <span className="block font-medium">
                  {formatDay(m.purchasedOn)}
                  {current && <span className="ml-2 bg-ochre px-1 text-[0.6875rem] font-bold text-ink">THIS ONE</span>}
                </span>
                <span className="num block truncate text-[0.8125rem] text-ink-3">
                  {[
                    `${fmtQty(q)}${m.unit ? ` ${m.unit}` : q === 1 ? " item" : " items"}`,
                    q !== 1 && each != null ? `${formatAmount(each)} each` : null,
                    m.vendorName,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                {m.receiptCount > 0 && <ReceiptText size={15} aria-label="Has receipt" className="text-ink-3" />}
                <span className="num font-extrabold">{formatAmount(m.totalPaid)}</span>
              </span>
            </>
          );
          return (
            <li key={m.id} className="border-b border-line last:border-b-0">
              {current ? (
                <div className="flex items-center justify-between gap-3 bg-ground/60 px-4 py-2.5">{body}</div>
              ) : (
                <Link href={hrefFor(m.id)} className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-ground/60">
                  {body}
                </Link>
              )}
            </li>
          );
        })}
      </ol>

      {separate && (
        <form action={separate} className="border-t border-line px-4 py-2.5">
          <SubmitButton variant="ghost" pendingLabel="Separating…" className="-ml-3 min-h-9 text-[0.8125rem] text-ink-2">
            Not the same item? Separate this purchase
          </SubmitButton>
        </form>
      )}
    </section>
  );
}
