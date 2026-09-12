# Buzl Listing — Approved Technology Direction

**Status:** Phase 1 architecture locked.  
**Next review:** Phase 2 specification lock.

## Application

- Next.js
- App Router
- TypeScript
- React Server Components where appropriate
- server rendering / static optimization for public SEO pages
- client components only where interaction requires them

## Database / backend platform

- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage
- Row Level Security
- migration-driven schema changes

## PostgreSQL capabilities approved for MVP

### Full Text Search

Use PostgreSQL/Supabase Full Text Search for the initial directory search.

### `pg_trgm`

Use trigram similarity for fuzzy matching where needed, especially:

- business names
- addresses
- duplicate detection

### PostGIS

Enable PostGIS during the technical foundation.

Use it for:

- canonical business geographic points
- future radius / "near me" queries
- proximity signals in duplicate detection
- service-area/geographic features where appropriate

Do not wait for a later search rewrite to introduce geospatial storage.

## Search infrastructure

Do **not** introduce Algolia, Elasticsearch, OpenSearch, or another dedicated search engine for MVP.

Revisit only if measured search quality/scale requirements exceed PostgreSQL.

## Local development

- Docker Desktop
- Supabase CLI
- local Supabase stack
- version-controlled SQL migrations
- deterministic local seed data after schema lock

## Styling / UI

Use the tracked Buzl design system:

```text
docs/design/
```

Rules:

- reuse Buzl design tokens
- use semantic tokens
- do not scatter raw temporary colors
- dashboard surfaces may use the dense Buzl admin language
- public listing pages should use the same product DNA with more readable public-facing composition

The final component/styling implementation library is still a Phase 2/3 implementation choice and must not override the Buzl design system.

## Maps / geocoding

### Architecture decision

Map/geocoder integration must be provider-neutral at the application/domain level.

### Final provider

**Deferred to Phase 2.**

Shortlist from research:

- MapTiler
- LocationIQ
- Geoapify
- Google Maps Platform
- Mapbox

Before locking a provider, compare:

- Indian address/geocoding quality
- map-load cost
- autocomplete cost
- permanent storage rights
- attribution requirements
- production terms
- expected traffic

Do not use OSMF public tile/Nominatim infrastructure as the production backend.

## Authentication

Use Supabase Auth.

The exact MVP method remains to be selected in Phase 2:

- email + password, or
- magic link

Social login is not required for MVP.

## Deployment

Production hosting remains intentionally unlocked.

Do not choose deployment infrastructure before Phase 2/3 requirements are stable.
