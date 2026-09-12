# Buzl Listing — SEO & Citation Architecture

**Status:** Phase 1 SEO architecture locked; Phase 2 will lock exact routes/indexation thresholds.

## 1. Core principle

SEO is part of the data and routing architecture, not a later plugin.

Every published business page must be generated from the same canonical business record that powers visible NAP and structured data.

## 2. Canonical business route

Accepted conceptual route:

```text
/business/{business-slug}
```

Do not put required city/category segments into the canonical business URL.

Reason:

- businesses move
- categories change
- names can be corrected

A location/category change must not force a new canonical listing URL.

## 3. Slug changes

If a published business slug changes:

1. store the old slug
2. permanently redirect old URL → current canonical URL
3. update sitemap/internal links to the new canonical URL

Do not silently allow old URLs to become duplicate live pages.

## 4. Discovery landing pages

Support intentional pages for:

```text
category
location
selected category + location
```

Exact route patterns are Phase 2 decisions.

Only useful combinations should become indexable.

## 5. Filter/facet control

Do not automatically expose every combination of:

- sort
- open now
- tags
- distance
- view mode
- arbitrary query parameters

as indexable SEO pages.

Search/filter URLs are application states unless explicitly promoted to approved landing pages.

## 6. LocalBusiness structured data

Every published listing should emit `LocalBusiness` JSON-LD using the most specific valid subtype available.

Generate from real stored data only.

Potential fields:

- `@type`
- `name`
- canonical `url`
- `telephone`
- address
- geo
- opening hours
- image
- `sameAs` where valid

Do not invent missing values to make schema appear complete.

## 7. One listing = one LocalBusiness location/service-area entity

MVP aligns one public listing to one establishment/service-area business.

A brand with multiple branches should eventually have multiple location listings grouped under a higher-level brand/organization concept.

## 8. Citation integrity

One canonical source must drive:

- business name
- public primary phone
- public structured address
- listing header/cards
- metadata where appropriate
- LocalBusiness JSON-LD

Do not maintain independently editable NAP copies for "SEO".

## 9. Service-area businesses

A service-area business may:

- retain an internal/private street address
- expose approved service-area information publicly
- hide exact street address when required by the product policy

Do not fabricate storefront addresses for SEO.

## 10. Sitemap architecture

Include only canonical public URLs.

Do not include:

- drafts
- pending
- rejected
- suspended
- archived
- account/dashboard routes
- internal search/filter URLs

As scale grows, use a sitemap index and segmented sitemap files.

Conceptually:

```text
/sitemap.xml
  ├── business sitemap(s)
  ├── categories sitemap
  └── locations sitemap
```

## 11. Metadata

Each public business should have meaningful:

- title
- meta description when sufficient real data exists
- canonical
- Open Graph data
- breadcrumb context

Potential title pattern:

```text
{Business Name} in {City} | {Primary Category} | Buzl
```

This is a template direction, not permission to invent city/category values.

## 12. Thin-page protection

A database combination does not automatically deserve an indexable URL.

Phase 2 must define a quality/indexation policy for:

- empty location pages
- low-inventory category pages
- category+location pages
- pagination
- duplicate taxonomies

## 13. Performance/accessibility

Public directory SEO depends on:

- server-first output
- semantic HTML
- image optimization
- controlled JS
- strong Core Web Vitals
- accessible interaction patterns
