# Approved Technology Direction

## Application

- Next.js
- App Router
- TypeScript
- React Server Components where appropriate
- Server rendering / static generation for public SEO pages

## Backend

- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage
- Row Level Security
- Supabase APIs where useful
- PostgreSQL Full Text Search and `pg_trgm` for MVP discovery
- PostGIS for coordinates and future proximity queries

## Local development

- Docker Desktop
- Supabase CLI
- Local Supabase stack
- Version-controlled SQL migrations

## Styling

Final design system will be extracted from the existing Buzl dashboard.

Until then:

- use semantic design tokens
- avoid app-wide hard-coded temporary colors
- centralize typography, spacing, radius, shadow, and color values

## Maps

Provider is intentionally deferred to Phase 2. Use a provider-neutral map/geocoder boundary; do not use public OpenStreetMap Foundation tile or Nominatim infrastructure as production backend.

## Search

Start with PostgreSQL-backed search/filtering. Do not introduce a dedicated search service during MVP unless real requirements justify it.

## Deployment

Not locked yet. Hosting/deployment is a later architecture decision after the MVP requirements are finalized.
