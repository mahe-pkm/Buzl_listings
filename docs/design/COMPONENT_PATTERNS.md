# Buzl Listing — Component Patterns

## 1. Application shell

### Desktop sidebar

Observed:

- fixed left navigation
- white background
- thin right divider
- logo at top
- icon + label navigation
- selected item uses pale blue/lavender fill
- active icon uses Buzl blue
- utility/legal links sit near the bottom

Implementation rule:

- keep navigation visually quiet
- one selected item at a time
- active state must not rely on icon color alone
- use full-row click targets

### Top header

Observed:

- white surface
- subtle bottom separation/shadow
- greeting/context on left
- business/account selector toward right
- avatar on far right
- compact height

The Listing admin surface should follow the same hierarchy.

---

## 2. Primary button

Observed examples:

- `Add Citation`
- `Add New User`
- `Add Location`
- `Add Keyword`
- `Create Proposal`

Pattern:

- Buzl blue background
- white text
- plus icon where creation semantics apply
- ~8 px radius
- compact SaaS height
- clear horizontal padding

Required states:

- default
- hover
- focus-visible
- active
- disabled
- loading

Do not use the raw extractor's invalid background/text combination.

---

## 3. Secondary / outline button

Observed:

- `Filters`

Pattern:

- white background
- blue/dark-blue border
- blue/dark text
- icon may appear to the right
- same height/radius family as primary control

Use for secondary commands, not the main page action.

---

## 4. Search field

Observed:

- wide horizontal input
- search icon on left
- muted placeholder
- light border
- white background
- ~8 px radius
- often paired with Filter + primary CTA

Desktop toolbar pattern:

```text
[ Search ................................ ] [ Filters ] [ + Primary Action ]
```

When space becomes insufficient, controls should wrap/stack rather than compress below usable width.

---

## 5. Data table

Strong recurring Buzl pattern.

### Header

- pale blue-gray `surface-muted`
- dark text
- medium emphasis
- sort indicators for sortable columns
- subtle border
- rounded top corners at the table container level

### Rows

- white
- generous vertical rhythm
- subtle horizontal separators
- no zebra striping in the supplied screenshots
- action menu at far right

### Responsive requirement

Do not force dense desktop tables to shrink indefinitely.

For narrower layouts choose one per table:

- horizontal scroll with sticky first/action column, or
- transform rows into summary cards

The choice must be documented per feature.

---

## 6. Row action button

Observed:

- small rounded-square pale surface
- ellipsis icon
- edit icon in list-card views

Rules:

- provide accessible label (`More actions for {item}`)
- minimum practical touch/click target
- menu opens from the trigger
- Escape closes menu
- focus returns to trigger after close

---

## 7. Status badges

Observed categories:

- Active / Inactive
- High / Medium / Low
- In Focus
- GBP Linked

Pattern:

- pill shape
- pale semantic background
- colored label
- compact text
- status text always present

Do not use color alone.

---

## 8. Tabs

Observed on business detail/keyword surface:

- horizontal tabs
- text-only labels
- active tab uses Buzl blue
- active tab has blue underline
- inactive tabs remain dark neutral

For overflow:

- desktop may horizontally scroll if needed
- mobile should use scrollable tab strip or a documented alternative

---

## 9. Location/list card

Observed:

- large light-gray card
- business/location title
- address underneath
- status and `GBP Linked` metadata row
- last-updated metadata
- icon at left
- edit action at right
- low/no shadow
- rounded corners

Use this pattern where content is better understood as an object summary rather than a columnar table.

---

## 10. Form controls

The supplied screenshots show search inputs more clearly than full forms.

Until form screenshots/source CSS are available:

- use the same border/radius/type system as search
- labels above inputs
- helper/error text below
- do not invent a materially different form style
- use visible focus ring
- maintain semantic labels

---

## 11. Public listing CTA adaptation

Public listing pages should reuse the Buzl control DNA but use more visitor-focused labels such as:

- Call
- WhatsApp
- Visit Website
- Get Directions

These can use the same primary/secondary button system while maintaining semantic HTML links where navigation/contact is the actual action.
