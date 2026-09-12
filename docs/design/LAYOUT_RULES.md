# Buzl Listing — Layout Rules

## Source scope

The supplied references are desktop screenshots at roughly 1600 px viewport width. Exact responsive breakpoints are not visible in the source and therefore are not treated as extracted facts.

## Desktop admin shell

Observed structure:

```text
┌────────────── sidebar ──────────────┬──────── top header ──────────┐
│                                     │                              │
│                                     ├──────────────────────────────┤
│                                     │                              │
│                                     │       main content           │
│                                     │                              │
└─────────────────────────────────────┴──────────────────────────────┘
```

Approximate visual behavior:

- sidebar around 280 px at the 1600 px reference width
- main content uses ~28–32 px horizontal inset
- toolbar appears near top of content
- wide tables/cards fill available content width
- top header aligns with main shell rather than floating card UI

Treat exact dimensions as implementation targets to verify, not immutable source values.

## Content hierarchy

Preferred page sequence:

```text
Page context/title
  ↓
Search / filters / primary action
  ↓
divider or breathing space
  ↓
table/list/card content
  ↓
pagination / continuation
```

## Density

Admin pages should remain compact:

- table text mostly 13–14 px
- navigation 16 px
- major app heading around 20 px
- metadata 12–13 px

Public listing pages should be more relaxed:

- wider line-height
- larger business title
- content sections with more vertical spacing
- stronger mobile CTA hierarchy

## Containers

Use one main content width strategy per surface.

### Dashboard

Fluid width inside the application shell.

### Public directory

Use a centered max-width container so very wide desktops do not create excessively long reading lines.

Suggested public layout concept:

```text
max-width: 1200–1280px
```

This is a proposed implementation constraint, not an extracted dashboard value.

## Spacing rule

Use semantic spacing tokens from `DESIGN_TOKENS.md`.

Avoid reproducing the extractor's 1 px / 2 px / 3 px values as general layout spacing.

## Borders

Use borders to structure:

- search fields
- tables
- card boundaries when needed
- headers/dividers

Avoid adding borders around every section.

## Public listing information hierarchy

Recommended:

```text
Breadcrumbs
Business header
  - name
  - primary category
  - verification/status
  - primary CTAs

Main grid
  - business details
  - contact/NAP
  - map/location

Services
Hours
About
Categories/tags
Related businesses
```

The public surface should retain Buzl branding while prioritizing crawlable business information.
