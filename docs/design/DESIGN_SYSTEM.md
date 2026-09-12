# Buzl Listing — Design System

**Status:** Source-backed baseline  
**Source set:** Existing Buzl Business Copilot desktop screenshots + extracted `DESIGN.md` + extracted `SKILL.md`  
**Purpose:** Reuse the established Buzl visual language in the new Listing application without repeatedly reverse-engineering the dashboard.

## 1. Design intent

The existing Buzl interface is a clean, restrained, desktop-first SaaS/admin system built around:

- a strong Buzl blue
- white content surfaces
- pale blue-gray structural surfaces
- dark navy-gray text
- simple outlined controls
- compact data tables
- low-elevation cards
- rounded but not overly soft controls
- line icons
- clear status badges
- generous horizontal spacing

The Listing application should feel like the same Buzl product family.

## 2. Important extraction corrections

The automated extractor is useful, but several generated values/labels should **not** be copied literally.

### Confirmed useful extraction

- Brand blue appears as `#004AAD`.
- Primary text appears as `#2A3547`.
- Muted/table-header surface appears as `#F2F5FA`.
- White is the dominant elevated/content surface.
- Extracted type sizes broadly match the screenshots.
- Extracted motion durations of roughly 150–300 ms are suitable.
- The generated font alias indicates an Avantt-family font is being used.

### Incorrect or low-confidence extraction

The extractor labeled:

- `surface.base = #000000`
- `text.secondary = #0000EE`
- the page as a "documentation site"
- the product/brand as "Locations"
- `button-primary` with the same token for background and text
- `radius.md = 16px` as the standard button/input radius

These conflict with the screenshots.

For the new app:

- page/content background must default to white/light surfaces, not black
- browser-default hyperlink blue `#0000EE` must not become a brand token
- the source is Buzl Business Copilot, not a documentation site
- primary buttons use Buzl blue with white text
- visible control radii are closer to 7–8 px on most desktop controls

## 3. Brand foundations

### Core colors

Use the semantic tokens in `DESIGN_TOKENS.md`.

Primary visual anchors:

- Buzl blue: `#004AAD`
- Primary text: `#2A3547`
- White: `#FFFFFF`
- Table/header muted surface: `#F2F5FA`
- Secondary card surface: approximately `#F7F7F7`

Avoid introducing a second competing blue.

## 4. Typography

The extractor reports a generated font alias:

```text
__avantt_90bbe1
```

This strongly indicates an Avantt-family font loaded through the existing application build.

**Do not hard-code the generated `__avantt_*` name** in the new app. Generated aliases can change between builds.

Preferred implementation:

```text
font.family.sans = Avantt, <approved fallback stack>
```

The exact font source/weight files should be confirmed from the existing Buzl project before production.

Observed/extracted size scale:

- 12 px — metadata / helper text
- ~13–14 px — dense table/body content
- 16 px — navigation and standard emphasized text
- 18 px — larger controls/section emphasis
- 20 px — top greeting / major UI heading
- 24–28 px — larger headings where needed

Observed body text is compact and should not be inflated unnecessarily in admin/data surfaces.

## 5. Shape language

Preferred radii:

- 7–8 px: buttons, inputs, icon action buttons, standard cards
- 12–16 px: larger containers only when visually appropriate
- pill radius: statuses/badges only

Do not make every component pill-shaped.

## 6. Elevation

The screenshots are mostly border-driven rather than shadow-heavy.

Use:

- thin muted borders for tables/inputs
- subtle elevation only for floating menus/dialogs
- very light card elevation if needed

Avoid large marketing-style shadows inside the dashboard.

## 7. Iconography

Observed style:

- simple line icons
- dark neutral icons in inactive state
- Buzl blue for active/selected states
- compact icon + label navigation
- square/rounded action buttons for ellipsis/edit actions

Use one consistent icon family across the new application.

## 8. Product-family rule

The new Listing app has two distinct surfaces:

### Authenticated/dashboard surfaces

May directly reuse the dense Buzl admin language:

- sidebar
- top bar
- tables
- filters
- form controls
- status pills
- action menus

### Public SEO/listing surfaces

Should reuse the **same tokens and component DNA**, but should not blindly copy the dense admin layout.

Public pages need:

- more breathable content composition
- readable business details
- clear contact actions
- map/location block
- category/service chips
- strong mobile behavior
- crawlable semantic HTML

The design system is shared; the information density is different.

## 9. Accessibility

Target WCAG 2.2 AA.

Must include:

- visible keyboard focus
- semantic labels
- non-color status cues
- contrast validation
- keyboard-operable menus
- accessible tables
- 44×44 px touch target where practical on touch layouts
- reduced-motion respect

The screenshots are reference visuals, not proof that every existing component already satisfies WCAG.

## 10. Source confidence

### High confidence

- primary blue
- primary dark text
- white background
- pale table-header surface
- sidebar/table/control visual language
- compact SaaS typography
- outlined secondary controls
- pill status badges
- active navigation highlighting

### Medium confidence

- exact border gray
- exact badge colors
- exact spacing scale
- exact font weights
- exact card radius

### Pending verification

- exact Avantt font files/weights
- mobile layout
- tablet behavior
- dark mode (none shown)
- complete hover/focus/disabled states
