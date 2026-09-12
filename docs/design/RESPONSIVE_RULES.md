# Buzl Listing — Responsive Rules

## Confidence note

No mobile/tablet screenshots were supplied. The following rules are implementation recommendations based on the desktop Buzl system and must be validated when mobile references become available.

## Breakpoint strategy

Use the framework's standard breakpoint system unless the existing Buzl source defines a different approved scale.

Avoid designing component behavior around many one-off viewport widths.

## Sidebar

Desktop:
- persistent left sidebar

Tablet/mobile proposal:
- collapse navigation into a drawer
- retain logo/context in top app bar
- menu button must be keyboard/screen-reader accessible

## Toolbars

Desktop:

```text
search | filters | primary action
```

Tablet:
- search may remain full-row
- filters/action can sit below or to the right depending width

Mobile:
- full-width search
- filter and primary action below
- primary action must remain obvious

## Tables

Never render unreadably compressed columns.

Choose:

### Option A — horizontal table

Use when users must compare many columns.

Requirements:
- horizontal scroll
- visible overflow affordance
- sticky key column where helpful
- action column remains usable

### Option B — responsive cards

Use when each row represents one business/location and comparison is secondary.

Use labels + values in a stacked card.

## Tabs

If tabs exceed viewport width:

- horizontal scroll
- preserve active indicator
- avoid wrapping labels into multiple confusing rows

## Public listing pages

Mobile priority order:

1. business name/category/status
2. Call / WhatsApp / Directions / Website
3. address/map
4. opening hours
5. services
6. about/additional details

Sticky mobile contact actions may be considered later, but must not obscure content or harm accessibility.

## Touch

Interactive targets should aim for at least 44×44 px on touch layouts.

Compact desktop controls may visually appear smaller but should preserve a sufficiently large interaction hit area where practical.

## Text overflow

Business names:
- wrap naturally in detail/public views
- clamp only in compact list/table summaries

Addresses:
- allow wrapping
- do not truncate the canonical address on the public business page

URLs:
- use readable label text instead of exposing huge raw URLs when possible

## Verification needed

Capture at least:

- one mobile dashboard/list view
- one mobile table-heavy view
- one mobile business detail/public listing view

Then replace these provisional responsive rules with source-verified behavior.
