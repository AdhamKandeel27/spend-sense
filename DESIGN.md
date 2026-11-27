---
name: Spend Sense
description: A visual record of everything you buy, filed like paint chips into the projects of your life.
colors:
  ground: "#f2f2ee"
  card: "#ffffff"
  line: "#deded8"
  line-strong: "#c9c9c2"
  photo-well: "#e6e6e1"
  ink: "#1b1e23"
  ink-hover: "#2c3038"
  ink-2: "#4d5158"
  ink-3: "#686c73"
  ochre: "#d69a2d"
  danger: "#a3302a"
  danger-tint: "#f6e7e5"
  ok: "#2f6b45"
  ok-tint: "#e7f0ea"
  chip-slate: "#3b5a8e"
  chip-brick: "#b04a3a"
  chip-ochre: "#d69a2d"
  chip-sage: "#5b7f4e"
  chip-plum: "#6b4a6e"
  chip-teal: "#2e7c8a"
  chip-rust: "#c2672b"
  chip-olive: "#7c7a2e"
  chip-rose: "#b5577a"
  chip-graphite: "#4a4f57"
  chip-none: "#c9c9c2"
  space-deck-green: "#1f5a50"
  space-navy: "#233a63"
  space-oxblood: "#6e2b2e"
  space-aubergine: "#4a2f4f"
  space-deep-teal: "#1e4e5a"
  space-umber: "#5a4128"
  space-accent-gold: "#e3b04b"
  space-accent-straw: "#e8c15a"
typography:
  display:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.75rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.025em"
    fontFeature: "\"tnum\" 1, \"lnum\" 1"
  headline:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.625rem"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 800
    lineHeight: "1.6rem"
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: "1.4rem"
  label:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: "1rem"
    letterSpacing: "0.08em"
  chip-code:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.6875rem"
    fontWeight: 500
    letterSpacing: "0.02em"
rounded:
  none: "0px"
  pill: "999px"
spacing:
  deck-gap: "2px"
  xs: "6px"
  sm: "10px"
  md: "16px"
  gutter: "20px"
  gutter-desktop: "40px"
  section: "40px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    rounded: "{rounded.pill}"
    padding: "0 20px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.ink-hover}"
  button-space:
    backgroundColor: "{colors.space-deck-green}"
    textColor: "{colors.ground}"
    rounded: "{rounded.pill}"
    padding: "0 20px"
    height: "48px"
  button-secondary:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "44px"
  button-ghost:
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "44px"
  button-danger:
    textColor: "{colors.danger}"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "44px"
  button-danger-hover:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.card}"
  add-pill:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "52px"
  field:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "10px 12px"
    height: "46px"
  chip:
    typography: "{typography.chip-code}"
    rounded: "{rounded.none}"
    padding: "0 4px"
    height: "20px"
    width: "28px"
  saved-chip:
    backgroundColor: "{colors.ochre}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "2px 6px"
  space-header:
    backgroundColor: "{colors.space-deck-green}"
    textColor: "{colors.ground}"
    rounded: "{rounded.none}"
    padding: "24px 20px"
  deck-strip:
    rounded: "{rounded.none}"
    height: "64px"
  purchase-tile:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "10px"
  tab-bar:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink-3}"
    height: "64px"
  empty-state:
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "24px"
  confirm-panel:
    backgroundColor: "{colors.danger-tint}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "16px"
---

# Design System: Spend Sense

## Overview

**Creative North Star: "The Fan Deck"**

Every category is a paint chip, and a space reads as a fan deck of where the money went. The ground is cool chip-stock grey, records sit on white cards edged with hairlines, and text is near-black ink. Colour almost never decorates. It comes from two places only: the category chips, which take hues in strict deck order, and each space's own deep header chip, which floods the top of every screen in that space and carries its total.

The world is square and printed. Corners are square everywhere except two shapes: the pill on the primary action and the round die-cut notch punched out of chip headers. Rank comes from weight and case inside a three-size scale, not from a ladder of sizes. Every amount is set in tabular figures so totals line up in columns. The photo is the record, so every purchase tile leads with one square crop on one neutral well.

The density is that of a well-kept ledger: compact, hairline-divided, and calm, with a single authored moment of motion when a space opens and its deck fans out.

**Key Characteristics:**
- Chip-stock ground (`ground`), white cards on hairlines, ink text.
- Category colour comes in strict deck order, with a two-letter JetBrains Mono chip code on every chip.
- Each space owns a saturated header chip and a warm accent, set as scoped CSS variables.
- Square corners. Only the primary-action pill and the die-cut notch are round.
- Tabular figures for every amount. A running total sits at the foot of every list.
- One motion moment: the deck strip fans out from the left.

## Colors

A quiet neutral field carries all the structure, and colour comes in as paint chips: ten category hues in deck order, six deep space headers, and an ochre "saved" marker.

### Primary
- **Ink** (`ink`): body text, the primary pill, the floating add pill, the focus ring (2px solid, 2px offset), the active tab underline, and the selected state of toggles and filter buttons (ink fill, ground text). It hovers to **Ink Lifted** (`ink-hover`).
- **Space Header Chip** (`space-deck-green` and siblings): the header field of a space, its scoped buttons (`button-space`), its in-content links ("See all"), its caret colour, and the space cards on the Spaces index. The six header chips are Deck Green, Navy, Oxblood, Aubergine, Deep Teal, and Umber. Each pairs with a pale foreground (#f2f2ee to #f7f1ea) and a warm accent: Ochre for Deck Green and Navy, **Gold** (`space-accent-gold`) for Oxblood, Aubergine, and Deep Teal, and **Straw** (`space-accent-straw`) for Umber. Inside a space they are exposed as `--space-bg`, `--space-fg`, and `--space-accent`; the defaults on `:root` are Deck Green.

### Secondary
- **Ochre** (`ochre`): the "saved" chip in the space header, the discount badge (−17%) on tiles and on the detail price block, the NEW badge on freshly added photos, and text selection. Ink text always sits on it.
- **The Category Deck** (`chip-slate` through `chip-graphite`): Slate, Brick, Ochre, Sage, Plum, Teal, Rust, Olive, Rose, Graphite, assigned by index in that order. Foregrounds are pale tints of each hue (for example #f4f6fa on Slate) except Ochre, which takes ink. **Uncategorised** (`chip-none`) is the strong hairline grey with ink text.

### Neutral
- **Chip-Stock Ground** (`ground`): the page background, the rail's active item fill, and the running-total bar.
- **Card White** (`card`): purchase tiles, fields, secondary buttons, the tab bar (at 95% with a backdrop blur), and the desktop rail.
- **Hairline** (`line`): card borders and list dividers.
- **Strong Hairline** (`line-strong`): field and secondary-button borders, dashed empty-state borders, and the scrollbar thumb.
- **Photo Well** (`photo-well`): the backing of every photo and the missing-photo placeholder.
- **Ink 2** (`ink-2`): secondary text, field labels, and section labels.
- **Ink 3** (`ink-3`): tertiary text, placeholders, inactive tabs, struck-through original prices, and currency suffixes.
- **Danger** (`danger`) with **Danger Tint** (`danger-tint`): destructive actions, field errors, and the armed confirm panel. **Ok** (`ok`) with **Ok Tint** (`ok-tint`): the "Saved" status banner.

### Named Rules
**The Deck Order Rule.** Categories take chip hues strictly by index (`index % 10`), never by hand-picked meaning. Keeping the order keeps adjacent hues spaced apart instead of turning to confetti.

**The Two Sources Rule.** Colour on a screen comes from the category chips or from the current space's chip variables. A new surface does not introduce another accent.

**The Ink On Ochre Rule.** Ochre and every space accent always carry ink text, never white.

## Typography

**Display Font:** Archivo (variable, with a width axis), falling back to ui-sans-serif, system-ui
**Body Font:** Archivo
**Label/Mono Font:** JetBrains Mono 500, used only for chip codes

**Character:** A sturdy grotesque at heavy weights for amounts and titles, with a small mono for the printed chip codes, the way a paint chip prints its code under its name.

### Hierarchy
- **Display** (800, `2.75rem` on phone and 3.5rem on desktop, line-height 1, −0.025em, tabular): the space total in the header. Price displays one step down follow the same treatment: 2.25rem on the detail price block and 2rem on space cards.
- **Headline** (800, 1.625rem, −0.015em, balanced wrap): the purchase name on the detail page.
- **Title** (800, 1.25rem): page titles ("Purchases", "Your spaces"). Empty-state titles take 700.
- **Body** (400, 0.9375rem / 1.4rem): all running text. Supporting copy caps at 52ch in empty states. Smaller working sizes are 0.875rem (tile names, legends, lists) and 0.8125rem (field labels, hints, errors), both at 500 to 600 when they label something.
- **Label** (600, 0.75rem, 0.08em tracking, uppercase): section headings ("By room", "Recent purchases", "Receipts & invoices") and the space name in the header.
- **Chip Code** (JetBrains Mono 500, 0.6875rem, 0.02em): the two-letter category code and the "SPACE 01" code.

### Named Rules
**The Three Sizes Rule.** The token scale is label, body, and title, and rank comes from weight and case within it. The two working sizes (0.875rem and 0.8125rem) only make dense metadata quieter; they never create rank. Only amounts and the purchase name go above title.

**The Tabular Rule.** Every amount uses tabular, lining figures (`tnum`, `lnum`), and amounts in lists sit right-aligned with a smaller, lighter currency suffix (EGP) after them.

**The Mono Is For Codes Rule.** JetBrains Mono appears only on chip codes. It never sets prose, amounts, or labels.

## Layout

The phone is the primary canvas. Content runs in a single column with a 20px side gutter (`gutter`) inside a 72rem (max-w-6xl) container; on desktop (from 1024px) the gutter widens to 40px (`gutter-desktop`) and a 240px side rail replaces the bottom tab bar.

- **Space screens** open with the full-bleed space header, then the deck strip about 28px below it, the legend and the by-room list (two columns on desktop), and the purchase grid 40px (`section`) further down.
- **Purchase grids** run 2 columns on phone, 3 from 640px, and 4 from 1024px, with a 10px gap (`sm`).
- **Detail and form screens** split 5:6 on desktop: media on the left, sticky at the top, and details on the right, with a 40px column gap.
- **Lists** are hairline-divided rows: a 56px thumbnail, name with vendor and date, then category, room, receipt, and amount columns from 640px.
- **The foot** of a phone screen holds the tab bar (64px), the floating add pill above it, and, on lists, a running-total bar between them. Content reserves room for all three with a 9rem bottom pad plus the safe-area inset.
- Safe-area insets are honoured at the top of headers and the bottom of the tab bar.

## Elevation & Depth

The system is flat and drawn with hairlines. Depth is a response to state, not a resting property, with two exceptions: the floating add pill, which floats over content, and the space cards on the Spaces index, which are physical chips lifted off the ground.

### Shadow Vocabulary
- **Lift** (`box-shadow: 0 1px 2px rgb(27 30 35 / 0.06), 0 8px 24px -12px rgb(27 30 35 / 0.18)`): purchase tiles on hover, and space cards at rest.
- **Float** (`box-shadow: 0 2px 4px rgb(27 30 35 / 0.12), 0 12px 32px -8px rgb(27 30 35 / 0.35)`): the floating add pill only.
- **Inset ink ring** (`box-shadow: inset 0 0 0 1px` ink): doubles a 1px border to read as 2px on focused fields and selected option cards; in danger on invalid fields.

### Named Rules
**The Flat Card Rule.** White cards rest flat on a hairline. They lift only on hover.

**The Translucent Chrome Rule.** The tab bar and the running-total bar sit at 95% opacity with a medium backdrop blur, so the deck and the photos stay faintly visible beneath them.

## Shapes

Square corners everywhere: cards, tiles, fields, secondary and danger buttons, chips, badges, the deck strip, and photos (`rounded.none`). Two round shapes exist. The **pill** (`rounded.pill`) is reserved for the primary action: the primary and space buttons and the add pill. The **die-cut notch** is a 28px ground-coloured circle cut into the bottom-right edge of every chip header (the space header, space cards, and the auth brand panel), hanging 14px below the edge.

Photos share one square crop. Receipts use a 3:4 crop. Each purchase tile carries a 6px band of its category colour between photo and text. The deck strip divides into chips with 2px ground gaps (`deck-gap`).

### Named Rules
**The One Pill Rule.** A pill means "this is the primary action". No chip, badge, tag, or secondary control is ever rounded.

## Components

### Buttons
Confident and squared off, with a pill reserved for the one thing to do.
- **Shape:** square (0px), except primary and space buttons, which are pills (999px).
- **Primary:** ink fill with ground text, 48px tall with 20px side padding, weight 600. It hovers to Ink Lifted.
- **Space:** the current space's header chip with its foreground, as a pill. It hovers with brightness 110%.
- **Secondary:** card white with a strong-hairline border, 44px tall with 16px side padding. The border turns ink on hover.
- **Ghost:** text only, 44px tall, with a 5% black wash on hover.
- **Danger:** outline only (danger at 60% for the border, danger text) until it is hovered or focused, when it fills danger with white text.
- **All buttons:** a 150ms transition on ease-out-expo `cubic-bezier(0.16, 1, 0.3, 1)`, a 1px press-down on active, and 50% opacity when disabled.

### Chips
- **Category chip:** a 20px-tall colour block, at least 28px wide, with the two-letter mono code in the chip's foreground, followed by the category name when there is room. It appears in list rows, on the detail page above the name, beside the category field label (16px tall there), and as an editable swatch in settings.
- **Saved chip:** an ochre block with ink text, weight 700, tabular, padded 2px by 6px. It is used for the header's saved total and for the −% discount badges.

### Cards / Containers
- **Corner Style:** square.
- **Background:** card white on the ground.
- **Shadow Strategy:** flat at rest, Lift on hover (see Elevation & Depth).
- **Border:** 1px hairline, turning strong on hover.
- **Internal Padding:** 10px on tiles and 16px on price blocks and panels.
- **Empty state:** a dashed strong-hairline box on card white at 60%, with a title, up to 52ch of body copy, and an optional primary action, all left-aligned.

### Inputs / Fields
- **Style:** card white, a 1px strong-hairline border, square, 46px minimum height, and 10px by 12px padding. Selects carry a 16px ink chevron drawn in SVG.
- **Hover:** the border darkens to Ink 3.
- **Focus:** the border turns ink and an inset 1px ink ring doubles it. There is no glow.
- **Error:** the danger border and ring, with a 0.8125rem danger message below. Errors clear as soon as the field is edited.
- **Labels:** 0.8125rem, weight 600, in Ink 2, above the field with a 6px gap.
- **Amount fields** use tabular figures: 1.5rem at weight 800 for "Total paid".

### Navigation
- **Phone tab bar:** fixed to the bottom in card white at 95% with a backdrop blur and a hairline top edge. Four tabs (Spaces, Overview, Purchases, Me), each 64px tall, with a 22px line icon above an 0.6875rem semibold label. Inactive tabs are Ink 3 at a 1.75 stroke. The active tab is ink at a 2.25 stroke with a 20px by 2px ink underline. Tabs that need a space are disabled at 40% until one has been visited.
- **Floating add pill:** "Add purchase" in an ink pill 52px tall, with the Float shadow, centred above the tab bar (and above the running-total bar when one is shown). It scales to 98% on press and hides on new and edit screens.
- **Desktop rail:** 240px wide in card white with a hairline right edge, holding the wordmark, the add pill (as a primary button), then 40px-tall rail links with 18px icons. The active link fills with ground. Account sits at the foot of the rail.

### Space Header (signature)
The space's own paint chip, full-bleed at the top of the overview. It holds a label row with the space name (linking back to the Spaces index), the mono "SPACE 01" code, and a settings icon on phone; then "Spent so far" at 0.8125rem and 80% opacity, the Display total with a lighter EGP suffix, and a line with the purchase count and the saved chip in the space accent. The die-cut notch sits at the bottom right.

### Deck Strip (signature)
A 64px row of category chips, each as wide as its share of spending (minimum 1.5%), separated by 2px gaps. Each chip shows as much as its width allows, in this order: name, code, then share. A code is never clipped to one letter; below two characters' width the chip is pure colour. The strip reappears as the category filter on the purchases list (tap a chip to filter, and the others dim to 30%), and in miniature as the 6px band on every tile. When a space opens, the chips fan in from the left (`scaleX` from 0 to 1 over 700ms on ease-out-expo, staggered 45ms per chip). Before any purchase exists it is a dashed placeholder: "The deck fills in as you add purchases."

### Deck Legend
A two-column definition list: a 10px square swatch, the name, and the count in Ink 3, with right-aligned tabular totals and a 0.75rem EGP suffix.

### Purchase Tile
A white card on a hairline: a square photo on the photo well, the ochre −% badge at the top left, a receipt marker (a 28px white square at 90%) at the top right, the 6px category band, the name clamped to two lines, and the price at weight 800 with the struck original in Ink 3.

### Running Total Bar
A bar on the ground at 95% with a blur, pinned above the tab bar (and to the bottom of the viewport on desktop). It holds the count on the left and the tabular total with its EGP suffix on the right, plus "saved" from 640px.

### Two-Step Delete
Destructive actions are set apart behind a hairline rule and need a second, deliberate tap. The first tap arms an outline-only danger button. The armed state is a danger-tint panel with a danger hairline at 40%, the description of what will be lost, a filled danger confirm button ("Delete for good") that takes focus, and a ghost "Keep it".

### Wordmark
Three fanned chips (Slate, Ochre, Brick, rotated −18° and −6°) with a notch dot, beside "Spend Sense" at 1.0625rem and weight 800. It has a light tone for use on the space chip.

## Do's and Don'ts

### Do:
- **Do** set every amount in tabular figures, right-aligned in lists, with the currency as a smaller, lighter suffix.
- **Do** assign category colours by deck index and print the two-letter mono code on the chip.
- **Do** wrap every space screen in the space scope so its header chip, accent, links, and caret all follow `--space-bg`, `--space-fg`, and `--space-accent`.
- **Do** keep corners square. Use the pill (999px) only for the primary action, and the notch only on chip headers.
- **Do** lead every purchase with its square photo on the photo well, banded 6px in its category colour.
- **Do** pin a running total to the foot of every list of purchases.
- **Do** keep delete isolated, outline-only until it is hovered or focused, and confirmed with a second tap.
- **Do** honour reduced motion. The deck fan collapses to an instant.

### Don't:
- **Don't** use the category default this world refuses: a white card list with a donut chart and one blue accent.
- **Don't** round cards, chips, badges, fields, or secondary buttons.
- **Don't** introduce an accent outside the category deck, the space chips, and ochre.
- **Don't** put white text on ochre or on a space accent.
- **Don't** use JetBrains Mono for anything but chip codes.
- **Don't** create rank with a new size above title. Use weight and case; only amounts and the purchase name go larger.
- **Don't** shadow a white card at rest. Lift is a hover response, and Float belongs only to the add pill.
- **Don't** fill a destructive button before it is armed or focused.
