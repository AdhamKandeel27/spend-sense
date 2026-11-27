import { auth } from "@/lib/auth";
import { listPurchasesForExport, type PurchaseFilters } from "@/lib/data";
import { MINOR } from "@/lib/money";

const SORTS = new Set(["newest", "oldest", "highest", "lowest"]);

/** CSV of the space's purchases, honouring the same filters as the list. */
export async function GET(request: Request, ctx: RouteContext<"/api/spaces/[spaceId]/export">) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { spaceId } = await ctx.params;
  const sp = new URL(request.url).searchParams;
  const sort = sp.get("sort") ?? "";
  const filters: PurchaseFilters = {
    q: sp.get("q") ?? undefined,
    category: sp.get("category") ?? undefined,
    room: sp.get("room") ?? undefined,
    vendor: sp.get("vendor") ?? undefined,
    from: sp.get("from") ?? undefined,
    to: sp.get("to") ?? undefined,
    sort: SORTS.has(sort) ? (sort as PurchaseFilters["sort"]) : undefined,
  };

  const result = await listPurchasesForExport(spaceId, session.user.id, filters);
  if (!result) return new Response("Not found", { status: 404 });

  const money = (minor: number | null) => (minor == null ? "" : (minor / MINOR).toFixed(2));
  const header = [
    "Date",
    "Item",
    "Category",
    "Room / area",
    "Vendor",
    "Quantity",
    "Unit",
    "Unit price",
    `Paid (${result.space.currency})`,
    `Before discount (${result.space.currency})`,
    `Saved (${result.space.currency})`,
    "Photos/receipts",
    "Notes",
  ];
  const lines = result.rows.map((r) =>
    [
      r.purchasedOn,
      r.name,
      r.categoryName ?? "",
      r.roomName ?? "",
      r.vendorName ?? "",
      Number(r.quantity).toString(),
      r.unit ?? "",
      money(r.unitPrice),
      money(r.totalPaid),
      money(r.originalTotal),
      r.originalTotal ? money(r.originalTotal - r.totalPaid) : "",
      r.photoId || r.receiptCount ? "yes" : "",
      r.notes ?? "",
    ]
      .map(csvCell)
      .join(","),
  );

  // BOM so Excel opens UTF-8 (Arabic names) correctly.
  const body = "﻿" + [header.map(csvCell).join(","), ...lines].join("\r\n");
  const safeName = result.space.name.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").toLowerCase() || "space";
  const date = new Date().toISOString().slice(0, 10);

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="spend-sense-${encodeURIComponent(safeName)}-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

function csvCell(value: string) {
  // Neutralise spreadsheet formula injection, then quote.
  const v = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}
