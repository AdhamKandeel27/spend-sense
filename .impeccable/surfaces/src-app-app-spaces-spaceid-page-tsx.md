---
version: 1
slug: "src-app-app-spaces-spaceid-page-tsx"
primary_target: "src/app/(app)/spaces/[spaceId]/page.tsx"
related_targets: ["src/app/(app)"]
---

# Surface brief: Spend Sense app (spaces, purchases, add/edit)

Scope: the whole authenticated app shell. That covers the spaces list, the space overview, the purchases list (search, filters, export), the add/edit purchase form, the purchase detail, the space settings (categories and rooms), and sign-in. Mode: **Operate**. Phone first, and equally usable on desktop.

Audience and job: the owner is logging home-build purchases (photo, receipt, price, discount) right after buying, and reviewing what has been bought and what it cost. Important states: an empty space, a purchase with no photo, a discount, a long name, many categories, no search results, an upload in progress or failed.

Constraints: EGP; amounts are stored in minor units; receipts are private; no invented figures in the UI (sample data appears only in sketches).

## Direction contract

THESIS: Every category is a paint chip, and a space reads as a fan deck of where the money went. The deck refuses the category default: a white card list with a donut chart and one blue accent.

OWN-WORLD:
- **Ground:** cool chip-stock grey #F2F2EE with white cards on hairline #DEDED8 borders, and ink #1B1E23.
- **Space header:** each space owns a saturated chip colour (New Home: deep green #1F5A50) as its header field.
- **Category chips:** a strict deck order of hues (slate blue, brick, ochre, sage, plum, and onward), each carrying a two-letter mono chip code.
- **Type:** Archivo, with JetBrains Mono only for chip codes. All amounts use tabular figures.
- **Shape:** square corners. The only rounded shapes are the pill-shaped primary action and the die-cut notch.

STORY: The visitor sees at once how much a space has cost and which categories took it. They believe the record is complete because every purchase shows its photo and its chip. They add a purchase in seconds, find any past one by search or filter, and export the lot.

FIRST VIEWPORT (phone):
- **Header field** in the space's chip colour: the space name with a mono "SPACE 01" code, the "Spent so far" label, a 44px tabular total in EGP, and a line with the purchase count and an ochre "saved" chip. A die-cut notch sits at the bottom right.
- **Deck strip:** a 64px strip with one chip per category, each width proportional to its share, carrying its name and code. Below it, a legend of the top categories with right-aligned totals.
- **Recent purchases:** a two-column grid of square photos, each on a 6px band of its category's colour, with the name, the price, and the struck-through original when discounted.
- **Primary action:** a fixed, black, pill-shaped "＋ Add purchase" button centred above the bottom tab bar (Spaces, Purchases, Search, Me).
  - *Adaptation (finish review):* the shipped tab bar is Spaces, Overview, Purchases, Me. A space needs its overview as a home tab. Search is the first control on the Purchases tab, together with the filters, so a separate Search tab would only duplicate that screen.
- **Desktop:** a side rail replaces the tab bar, and the content runs to a 3–4 column grid.
- **Signature move:** the deck strip. It reappears as the filter control on the purchases list (tap a chip to filter) and as the chip band on every card.

Raised lines:
- From the Botanical Folio: every photo shares one square crop on one neutral ground.
- From the Developer Console: delete stays isolated and outline-only until focused.
- From Datamatics: amounts sit in tabular, right-aligned columns.
- From the Cassette J-Card: a running total is pinned to the foot of every list.
- From the Timetable Slide Rack: rank comes from weight and case inside a three-size scale.

FORM: Fan Deck (paint-store colour fan decks), position 6 of 7 on my ordered list. seed:31a0578936990943

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved
- How space colours are picked: auto-assigned from the deck order, or chosen by the user (M1: auto-assigned, with a picker in settings).
