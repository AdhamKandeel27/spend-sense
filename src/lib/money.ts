/** Money helpers. Amounts are integers in minor units (1 EGP = 100 piastres). */

export const MINOR = 100;

const formatters = new Map<string, Intl.NumberFormat>();

function formatter(fractionDigits: number) {
  const key = String(fractionDigits);
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat("en-EG", {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
    formatters.set(key, f);
  }
  return f;
}

/** 4125000 → "41,250" ; 4125050 → "41,250.50". Piastres only show when present. */
export function formatAmount(minor: number): string {
  const hasFraction = minor % MINOR !== 0;
  return formatter(hasFraction ? 2 : 0).format(minor / MINOR);
}

export function formatMoney(minor: number, currency = "EGP"): string {
  return `${formatAmount(minor)} ${currency}`;
}

/** Parses user input like "41,250.5" or "41250" into minor units. Null when blank or invalid. */
export function parseAmount(input: FormDataEntryValue | null | undefined): number | null {
  if (typeof input !== "string") return null;
  const cleaned = input.replace(/[,\s]/g, "").replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
  if (cleaned === "") return null;
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null;
  const [whole, frac = ""] = cleaned.split(".");
  return Number(whole) * MINOR + Number(frac.padEnd(2, "0"));
}

/** Minor units → plain input string ("24999" or "850.50"). */
export function toInputAmount(minor: number | null | undefined) {
  if (minor == null) return "";
  return minor % MINOR === 0 ? String(minor / MINOR) : (minor / MINOR).toFixed(2);
}

/** Discount as a whole percentage, or null when there is none. */
export function discountPercent(paid: number, original: number | null): number | null {
  if (!original || original <= paid) return null;
  return Math.round(((original - paid) / original) * 100);
}
