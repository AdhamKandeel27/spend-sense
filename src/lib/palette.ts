/**
 * The fan deck. Category chips take hues in strict deck order, so colours stay
 * spaced apart instead of turning to confetti. Space headers use the deeper
 * "header" chips. Stored as indexes so the palette can evolve.
 */
export const CHIP_COLORS = [
  { bg: "#3B5A8E", fg: "#F4F6FA", name: "Slate" },
  { bg: "#B04A3A", fg: "#FBF3F1", name: "Brick" },
  { bg: "#D69A2D", fg: "#1B1E23", name: "Ochre" },
  { bg: "#5B7F4E", fg: "#F3F7F1", name: "Sage" },
  { bg: "#6B4A6E", fg: "#F7F2F7", name: "Plum" },
  { bg: "#2E7C8A", fg: "#F0F7F8", name: "Teal" },
  { bg: "#C2672B", fg: "#FFF6EF", name: "Rust" },
  { bg: "#7C7A2E", fg: "#F8F7EC", name: "Olive" },
  { bg: "#B5577A", fg: "#FCF2F6", name: "Rose" },
  { bg: "#4A4F57", fg: "#F3F4F5", name: "Graphite" },
] as const;

export const UNCATEGORISED = { bg: "#C9C9C2", fg: "#1B1E23", name: "None" } as const;

export const SPACE_COLORS = [
  { bg: "#1F5A50", fg: "#F2F2EE", accent: "#D69A2D", name: "Deck green" },
  { bg: "#233A63", fg: "#F2F2EE", accent: "#D69A2D", name: "Navy" },
  { bg: "#6E2B2E", fg: "#F7EFEE", accent: "#E3B04B", name: "Oxblood" },
  { bg: "#4A2F4F", fg: "#F5EFF5", accent: "#E3B04B", name: "Aubergine" },
  { bg: "#1E4E5A", fg: "#EEF5F6", accent: "#E3B04B", name: "Deep teal" },
  { bg: "#5A4128", fg: "#F7F1EA", accent: "#E8C15A", name: "Umber" },
] as const;

export function chipColor(index: number | null | undefined) {
  if (index == null || index < 0) return UNCATEGORISED;
  return CHIP_COLORS[index % CHIP_COLORS.length];
}

export function spaceColor(index: number | null | undefined) {
  return SPACE_COLORS[Math.abs(index ?? 0) % SPACE_COLORS.length];
}

/** Two-letter chip code from a name: "Flooring & marble" → "FM", "Kitchen" → "KI". */
export function chipCode(name: string | null | undefined) {
  if (!name) return "—";
  const words = name
    .replace(/&/g, " ")
    .split(/\s+/)
    .filter((w) => /[\p{L}\p{N}]/u.test(w));
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return (words[0] ?? name).slice(0, 2).toUpperCase();
}

export const HOME_TEMPLATE = {
  categories: [
    "Flooring & marble",
    "Ceramics & tiles",
    "Kitchen",
    "Appliances",
    "Lighting & electrical",
    "Plumbing & sanitary",
    "Furniture",
    "Paint & finishes",
    "Doors & windows",
    "Other",
  ],
  rooms: [
    "Whole house",
    "Kitchen",
    "Living room",
    "Reception",
    "Dining",
    "Master bedroom",
    "Bedroom 2",
    "Master bath",
    "Guest bath",
    "Balcony",
  ],
};
