# Buzl Listing — Architecture

**Status:** Phase 1 architecture locked; Phase 2 will convert this into implementation-ready schemas/routes/policies.

## 1. System shape

```text
Public visitor / authenticated user
               ↓
          Next.js App
               ↓
 server validation + authorization
               ↓
            Supabase
   ┌───────────┼───────────┐
PostgreSQL    Auth       Storage
   │
   ├── RLS
   ├── Full Text Search
   ├── pg_trgm
   └── PostGIS
```

## 2. Architectural principles

1. Buzl owns the application and data model.
2. Public SEO pages are server-first.
3. Git + tracked docs are shared agent memory.
4. Database changes are migration-driven.
5. Authorization is enforced server/database-side.
6. Citation NAP is controlled source data.
7. Search starts in PostgreSQL.
8. Geospatial support is available from the foundation.
9. Map provider details are isolated from the domain model.
10. Do not introduce distributed infrastructure without measured need.

## 3. Public surface

Public pages should favor server rendering or static optimization where appropriate.

Primary goals:

- crawlability
- stable metadata/canonical tags
- low client JavaScript
- Core Web Vitals
- accessible semantic HTML
- LocalBusiness structured data

### Canonical listing

Conceptual route:

```text
/business/{business-slug}
```

The canonical listing route does not structurally depend on category or location.

### Discovery pages

The product may expose controlled pages for:

```text
category
location
selected category + location
```

Exact path shapes and indexation thresholds are locked in Phase 2.

Arbitrary search/filter combinations are not automatically SEO landing pages.

## 4. Authenticated surface

Business owners/users manage listing data through protected application routes.

The dashboard should reuse the established Buzl design system.

## 5. Business ownership

The public business record and user ownership/management relationship must remain conceptually separable.

This allows:

- Buzl-created listings before an owner account exists
- future claim flows
- multiple business managers later
- ownership changes without replacing the public business record

The exact membership table/policies are a Phase 2 schema decision.

## 6. Listing semantics

One public listing represents one:

- storefront establishment, or
- service-area business, or
- hybrid business

Multi-location brands can later group multiple listings under a higher-level organization/brand entity.

## 7. State architecture

### Publication

```text
draft
pending
published
rejected
suspended
archived
```

### Verification

```text
unverified
pending
verified
failed
```

These are intentionally independent.

## 8. Search

Initial search architecture:

```text
PostgreSQL Full Text Search
        +
pg_trgm fuzzy similarity
        +
structured category/location filters
        +
PostGIS proximity when required
```

No dedicated external search platform is approved for MVP.

## 9. Geospatial architecture

Enable PostGIS during foundation work.

Store an indexable geographic point for businesses with coordinates.

Coordinates/geographic data are Buzl domain data, not opaque provider objects.

Potential future uses:

- distance sorting
- near-me search
- radius filters
- duplicate proximity signals
- service-area features

## 10. Maps/geocoding boundary

Application/domain code should call a provider-neutral integration layer.

Conceptually:

```ts
interface Geocoder {
  searchAddress(query: string): Promise<AddressCandidate[]>
  reverseGeocode(lat: number, lng: number): Promise<AddressCandidate | null>
}
```

Exact interface/code is not locked yet.

Final provider is deferred to Phase 2.

## 11. Data provenance

Authoritative source:

- Buzl administrator/client entry
- business-owner entry
- later trusted import/integration

Third-party identifiers can be stored as references where legitimate, but a third-party platform must not become the Buzl primary key or source of truth.

## 12. Open-source usage

Reference open-source implementations selectively.

Primary directory reference:

```text
gijsverheijke/directorystarter
```

Do not inherit a complete external directory architecture blindly.

Review license and implementation quality before adapting any source code.

## 13. Authorization

UI hiding is never an authorization boundary.

Enforce:

- Supabase RLS
- server-side authorization
- business ownership/membership checks
- explicit admin permissions

Never trust client-provided role/owner fields.

## 14. Future scale

Do not introduce:

- microservices
- queues
- external search clusters
- distributed caches
- event buses

until observed requirements justify them.

Next.js + PostgreSQL/Supabase is the approved MVP architecture.
