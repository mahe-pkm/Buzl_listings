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

## Data and Storage Architecture

PostgreSQL via Supabase is the Buzl Listing canonical system of record. It holds normalized relational business data, trusted lifecycle/verification state, ownership relationships, import provenance, and media metadata. PostGIS supports geospatial data; PostgreSQL JSONB is the first option for flexible or semi-structured source context.

```text
External / Buzl JSON
        ↓
Validation / Adapter
        ↓
PostgreSQL canonical model
        ├── Relational business data
        ├── JSONB source metadata where needed
        ├── PostGIS geospatial data
        └── Media references
                 ↓
          Supabase Storage
```

Raw JSON is not the canonical public business model. Where original payload preservation is useful, retain it in a dedicated import/audit/source-payload structure as JSONB, behind validation, RLS, lifecycle, privacy, and public-safe projection controls. Raw imported payloads must never be returned directly to anonymous/public users.

Binary listing media belongs in Supabase Storage; PostgreSQL holds its metadata and storage references. The current Planned media scope is logo and cover. A future-capable conceptual layout may support `business-media/{business_id}/logo/` and `cover/`, plus `gallery/`, `services/`, and `products/`; the latter three are future-compatible paths, not current implementation scope.

Media metadata may include `id`, `business_id`, `media_type`, `storage_path`, `caption`, `alt_text`, `sort_order`, `mime_type`, `width`, `height`, and `created_at`. Media access must eventually follow business ownership, publication, and privacy rules.

MongoDB is not part of the current architecture. It may be reconsidered only after a demonstrated requirement that PostgreSQL JSONB cannot reasonably satisfy, such as very large raw crawler snapshots, high-volume external document payloads, or large-scale unstructured enrichment archives.
