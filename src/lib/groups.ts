import type { PurchaseCard } from "@/lib/data";

/** What a grouped tile adds on top of its lead purchase. */
export type GroupSummary = {
  count: number;
  totalPaid: number;
  /** Sum of "before discount" (or paid, when there was none), for the badge. */
  originalTotal: number | null;
  /** Summed quantity, only when every batch uses the same unit. */
  quantity: string | null;
  unit: string | null;
};

export type DisplayCard = PurchaseCard & { group?: GroupSummary };

/**
 * Collapses batches of the same item into one card, in the position of the
 * first batch the list shows. Totals elsewhere still count each purchase
 * once; this is display only.
 */
export function groupCards(rows: PurchaseCard[]): DisplayCard[] {
  const members = new Map<string, PurchaseCard[]>();
  for (const r of rows) if (r.groupId) members.set(r.groupId, [...(members.get(r.groupId) ?? []), r]);

  const out: DisplayCard[] = [];
  const placed = new Set<string>();
  for (const r of rows) {
    const list = r.groupId ? members.get(r.groupId)! : [];
    if (!r.groupId || list.length < 2) {
      out.push(r);
      continue;
    }
    if (placed.has(r.groupId)) continue;
    placed.add(r.groupId);
    out.push({ ...r, photoId: list.find((m) => m.photoId)?.photoId ?? null, group: summarise(list) });
  }
  return out;
}

export function summarise(list: Pick<PurchaseCard, "totalPaid" | "originalTotal" | "quantity" | "unit">[]): GroupSummary {
  const totalPaid = list.reduce((s, m) => s + m.totalPaid, 0);
  const before = list.reduce((s, m) => s + (m.originalTotal ?? m.totalPaid), 0);
  const sameUnit = list.every((m) => (m.unit ?? "") === (list[0].unit ?? ""));
  const qty = list.reduce((s, m) => s + Number(m.quantity), 0);
  return {
    count: list.length,
    totalPaid,
    originalTotal: before > totalPaid ? before : null,
    quantity: sameUnit ? String(Math.round(qty * 1000) / 1000) : null,
    unit: sameUnit ? list[0].unit : null,
  };
}

/** Loose comparison for "you bought this before": case, spacing, × vs x and punctuation don't matter. */
export function normaliseName(s: string) {
  return s
    .toLowerCase()
    .replace(/×/g, "x")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}
