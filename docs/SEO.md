# SEO & Citation Requirements — Phase 1 Direction

SEO is part of the platform architecture.

## Public pages

Each public listing should have:

- canonical URL
- unique title
- unique meta description where data allows
- semantic headings
- business NAP
- category
- address
- map/directions link
- business hours
- services
- breadcrumbs
- Open Graph metadata
- structured data

## Canonical routes and indexation

- Each listing has one canonical URL, conceptually `/business/{slug}`.
- Category and location changes must not alter a listing's canonical URL.
- Retain historical slugs and issue permanent redirects when a slug changes.
- Index category, location, and selected category-plus-location pages only when they have real listings and useful unique context.
- Keep internal search, sorting, open-now, distance, tag, map-view, and other arbitrary facet URLs out of the indexable landing-page system.

## Structured data

Primary candidate:

- `LocalBusiness` or a more specific subtype

Additional schemas where valid:

- `Organization`
- `WebSite`
- `BreadcrumbList`

Generate schema only from actual stored business data.

Use the most specific valid `LocalBusiness` subtype when known. Each physical establishment or public service-area listing is a separate schema entity. Never invent values to complete schema.

## Citation integrity

The business name, address, and phone number must remain consistent wherever rendered.

## Technical SEO

- XML sitemap
- robots.txt
- clean URLs
- crawlable pagination
- internal linking
- mobile-first output
- good Core Web Vitals
- accessible HTML

At scale, generate a sitemap index and split canonical URLs by content class. A sitemap file must remain within Google's 50,000 URL and 50 MB uncompressed limits. Exclude drafts, pending/rejected/suspended records, internal routes, and non-canonical facets.

## Citation source of truth

The same canonical business record must drive visible NAP, JSON-LD, Open Graph data, listing cards, and sitemap URLs. Do not create independent SEO copies of business name, phone, or address.
