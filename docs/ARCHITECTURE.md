# Architecture — Phase 1 Decision Lock

## High-level shape

```text
Browser
  ↓
Next.js application
  ↓
Server-side authorization / validation
  ↓
Supabase
  ├── PostgreSQL
  ├── Auth
  └── Storage
```

## Public pages

Public listing/category/location pages should favor server rendering or static optimization to support:

- crawlability
- fast first load
- low client JavaScript
- stable metadata
- structured data

Public listings use a stable canonical route conceptually shaped as `/business/{slug}`. Category and location are browse attributes, not part of the listing's canonical identity. Historical slugs must redirect permanently to the current canonical URL.

Category, location, and selected category-plus-location landing pages may be public and indexable only when they pass content and inventory quality rules. Arbitrary filter URLs are not indexable landing pages.

## Authenticated dashboard

Business owners manage their listings from authenticated routes.

## Authorization

UI restrictions are not security boundaries.

Enforce access through:

- server-side authorization
- Supabase RLS
- ownership rules
- explicit admin permissions

## Database changes

All schema changes should be reproducible through version-controlled migrations.

The foundation schema will use PostgreSQL full-text search, `pg_trgm`, and PostGIS. No external search service is part of MVP. The database owns canonical address and coordinate data; map and geocoder providers are integration details behind provider-neutral interfaces.

## Listing model boundary

One MVP listing represents one physical establishment or one service-area business. A later organization/brand relationship can group multiple locations without changing the public-listing boundary.

Publication and verification are separate state machines. Server-side authorization and Supabase RLS must enforce ownership, roles, and all state transitions.

## Data provenance and duplicate workflow

Buzl- or owner-provided business data is authoritative. Legitimate provider identifiers may be stored as integration metadata, but scraped third-party records are not the source of truth.

Duplicate detection combines normalized phone/domain and legitimate external or Buzl IDs with name, address, postal code, coordinates, and trigram similarity. Uncertain matches enter review; they are never automatically merged.

## Future scale

Do not introduce microservices, external search clusters, queues, or distributed infrastructure until observed requirements justify them.
