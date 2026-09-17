# Buzl Listing — Architecture / Product Decisions

This file is the authoritative lightweight ADR log.

Statuses:

- **Accepted** — implementation/specification must follow this decision.
- **Deferred** — deliberately unresolved; resolve in the stated phase.
- **Superseded** — replaced by a later decision.

---

## DEC-001 — Next.js

**Status:** Accepted  
**Decision:** Use Next.js for the application.  
**Reason:** Strong fit for SEO-facing public pages plus authenticated application flows.

## DEC-002 — Supabase

**Status:** Accepted  
**Decision:** Use Supabase for PostgreSQL, Auth, Storage, and RLS.  
**Reason:** Fits the application model and supports efficient local development.

## DEC-003 — Local Supabase via Docker

**Status:** Accepted  
**Decision:** Use Supabase CLI with Docker Desktop locally.  
**Reason:** Reproducible local testing and migration-driven development.

## DEC-004 — Git as cross-agent memory

**Status:** Accepted  
**Decision:** Git + repository documentation are the persistent project state across Codex, Antigravity, and other coding agents.  
**Reason:** The project must not depend on one agent's chat history.

## DEC-005 — Raw research is not committed

**Status:** Accepted  
**Decision:** Keep exploratory material in `.research/` and ignore it in Git.  
**Reason:** Preserve research locally while keeping tracked project specifications clean.

---

## DEC-006 — Own the Buzl application architecture

**Status:** Accepted  
**Phase 1 source:** P1-01  
**Decision:** Build Buzl Listing on an owned Next.js + Supabase architecture rather than forking a complete directory product as the permanent base.  
**Reason:** Citation integrity, Buzl design, location modeling, verification, duplicate handling, and future Buzl integrations require product-specific architecture.

## DEC-007 — Directory Starter is the primary reference repository

**Status:** Accepted  
**Phase 1 source:** P1-02  
**Decision:** Use `gijsverheijke/directorystarter` as the primary directory architecture reference, not as an upstream product dependency.  
**Reason:** It closely matches the intended stack and directory patterns while allowing Buzl to own its data model and implementation.

## DEC-008 — Canonical business URLs are independent of category/location

**Status:** Accepted  
**Phase 1 source:** P1-03  
**Decision:** A public business listing has a stable canonical route conceptually shaped as:

```text
/business/{business-slug}
```

Category and location are business attributes and discovery dimensions, not required segments of the canonical business URL.

If a published slug changes, retain a redirect from the old slug.

**Reason:** Businesses can move, change category, or correct names without destroying URL history.

## DEC-009 — SEO landing pages are explicitly controlled

**Status:** Accepted  
**Phase 1 source:** P1-04  
**Decision:** Support intentional category, location, and selected category+location landing pages. Do not make every search/filter/facet combination indexable.  
**Reason:** Prevent thin/duplicate crawl spaces and preserve useful directory landing pages.

## DEC-010 — One public listing represents one local establishment/service-area listing

**Status:** Accepted  
**Phase 1 source:** P1-05  
**Decision:** In MVP, one `business` listing represents one local establishment or one service-area business.  
**Reason:** Maps cleanly to LocalBusiness/citation semantics. Multi-branch brands can later group multiple listings under an organization/brand concept.

## DEC-011 — Support storefront, service-area, and hybrid businesses

**Status:** Accepted  
**Phase 1 source:** P1-06  
**Decision:** Model:

```text
storefront
service_area
hybrid
```

Street-address visibility is a separate property from internally storing an address.

**Reason:** Home-service and service-area businesses must not be forced into fake storefront behavior.

## DEC-012 — Publication and verification are separate states

**Status:** Accepted  
**Phase 1 source:** P1-07  
**Decision:** Keep separate state machines.

Publication:

```text
draft
pending
published
rejected
suspended
archived
```

Verification:

```text
unverified
pending
verified
failed
```

**Reason:** A listing can be published but unverified, or verified and later suspended.

## DEC-013 — PostgreSQL search first

**Status:** Accepted  
**Phase 1 source:** P1-08  
**Decision:** Use PostgreSQL Full Text Search plus `pg_trgm` for MVP search/fuzzy matching.  
**Reason:** Avoid premature external search infrastructure while retaining strong search capabilities.

## DEC-014 — Enable PostGIS from the foundation

**Status:** Accepted  
**Phase 1 source:** P1-09  
**Decision:** Enable PostGIS and store business coordinates in an indexable geospatial form.  
**Reason:** Supports future proximity search and prevents a later geographic schema rewrite.

## DEC-015 — Duplicate detection is layered and reviewable

**Status:** Accepted  
**Phase 1 source:** P1-10  
**Decision:** Combine strong identifiers with structured/fuzzy signals.

Strong examples:

- normalized primary phone
- normalized website domain
- legitimate external provider ID
- Buzl internal business/client ID

Context/fuzzy examples:

- normalized business name
- city/postal code
- normalized address
- geographic proximity
- trigram similarity

Uncertain matches must be flagged for review rather than auto-merged.

## DEC-016 — Map/geocoder integration is provider-neutral

**Status:** Accepted  
**Phase 1 source:** P1-11  
**Decision:** Keep provider-specific geocoding/map details behind a small integration boundary.  
**Reason:** Business data and core application logic must not be tightly coupled to one map vendor.

## DEC-017 — Final map/geocoding provider

**Status:** Deferred to Phase 2  
**Phase 1 source:** P1-12  
**Decision:** Choose the provider after testing Indian address quality, production terms, storage rights, attribution, and expected cost.  
**Shortlist:** MapTiler, LocationIQ, Geoapify, Google Maps Platform, Mapbox.

## DEC-018 — Buzl/owner-provided business data is authoritative

**Status:** Accepted  
**Phase 1 source:** P1-13  
**Decision:** Business-owner or Buzl-provided data is the source of truth. Do not design the product around scraped third-party directory/map records.  
**Reason:** Citation quality requires controlled provenance and legally/operationally reliable business records.

## DEC-019 — NAP is stored citation-safely

**Status:** Accepted  
**Phase 1 source:** P1-14  
**Decision:** Canonical business name, primary phone, and structured address are controlled source fields. Store normalized matching/search forms separately where needed.  
**Reason:** Display/citation fidelity and matching requirements are different concerns.

## DEC-020 — Use a curated hierarchical Buzl category taxonomy

**Status:** Accepted  
**Phase 1 source:** P1-15  
**Decision:** Start with a curated hierarchical taxonomy rather than copying an enormous external directory category tree.  
**Reason:** Keeps taxonomy manageable while allowing expansion without schema redesign.

## DEC-021 — Supabase Auth remains the authentication layer

**Status:** Accepted  
**Phase 1 source:** P1-16  
**Decision:** Use Supabase Auth.  
**Deferred detail:** Phase 2 selects email/password versus magic-link onboarding for MVP.  
**Reason:** Auth provider architecture is settled; UX method does not need to be guessed during Phase 1.

## DEC-022 — Reuse the Buzl design system

**Status:** Accepted  
**Phase 1 source:** P1-17  
**Decision:** The Listing application uses the tracked Buzl design system under `docs/design/`.  
**Reason:** Listing is part of the Buzl product family and should not introduce an unrelated visual language.

## DEC-023 — PostgreSQL remains the canonical data platform

**Status:** Accepted
**Decision:** Use PostgreSQL via Supabase as the Buzl Listing canonical database. Use PostGIS for geospatial data, JSONB for flexible validated source payloads, PostgreSQL Full Text Search plus `pg_trgm` for search, Supabase Auth for authentication, and Supabase Storage for binary media with PostgreSQL metadata/references.
**MongoDB:** Not approved for the current architecture.
**Reason:** The existing stack satisfies current relational, geospatial, flexible JSON, search, media-reference, RLS, and transaction requirements without introducing another operational data platform.
**Future reconsideration:** Requires demonstrated technical need and explicit architecture/product approval.

---

# Phase 1 closeout

Phase 1 decision result:

```text
Accepted: 16
Deferred: 1
Rejected: 0
```

Deferred:

- DEC-017 — final map/geocoding provider

Additional implementation details intentionally left for Phase 2:

- exact Supabase Auth UX method
- exact category/location route shapes beyond the canonical business route
- category/location indexation thresholds
- service data representation
- final database table/column definitions
- RLS policies
- external-user moderation launch policy
- map provider
- production hosting
- exact component implementation library

---

# Boss Review — 2026-09-17

Decisions recorded following product review with Balaji. These revisions supersede specific earlier deferred/locked items where stated.

## DEC-024 — Gallery approved

**Status:** Accepted
**Supersedes:** OD-05 gallery portion ("gallery is FUTURE")
**Decision:** Business gallery is approved for upcoming implementation. Binary media stored in Supabase Storage with PostgreSQL metadata.
**Gallery image limit:** Requires product decision (not yet specified by Balaji).
**Reason:** Boss review promoted gallery from deferred to approved scope.

## DEC-025 — Business Products

**Status:** Accepted
**Decision:** Business profiles may include up to 20 products. Each product has: name, description, image. Optional fields (price, product/external URL) require further product decision before implementation.
**Reason:** New feature approved in Boss review to enrich business profiles.

## DEC-026 — Services expanded to name + description

**Status:** Accepted
**Supersedes:** OD-02 ("service descriptions and a controlled service taxonomy are FUTURE")
**Decision:** Services now support both service name and service description. Maximum 20 services per business.
**Reason:** Boss review approved service descriptions and set a practical limit.

## DEC-027 — Google Places location search

**Status:** Accepted
**Supersedes:** DEC-017 provider deferral (partially — selects Google for address/place search UX)
**Decision:** Google Maps / Places API replaces manual latitude/longitude entry in the business creation/edit UI. Users search for a business or address, select from Places suggestions, and the system populates address fields and stores Place ID and coordinates internally. Latitude/longitude remain internal for geospatial functionality but are no longer manually entered by normal users.
**Provider/API details:** Pending provider configuration.
**Reason:** Boss review selected Google Places for location UX. Existing service-area privacy rules remain unchanged.

## DEC-028 — Email OTP authentication

**Status:** Accepted
**Decision:** Email OTP is an approved authentication method for upcoming implementation.
**Provider/configuration:** Pending provider configuration.
**Reason:** Boss review specifically prioritized Email OTP.

## DEC-029 — WhatsApp OTP authentication

**Status:** Accepted
**Decision:** WhatsApp OTP is an approved authentication method for upcoming implementation.
**Provider/configuration:** Pending provider configuration.
**Reason:** Boss review specifically prioritized WhatsApp OTP.

## DEC-030 — Google Business Profile URL

**Status:** Accepted
**Decision:** A Google Business Profile URL is collected from the business and displayed publicly as a link/action (e.g., "View on Google"). Stored separately from `place_id`. No deeper GBP API integration is planned at this time.
**Reason:** Boss review approved this as a new public-facing business field.

## DEC-031 — Google OAuth status

**Status:** Paused / Requires product confirmation
**Previous:** DEC-021 deferred social auth to Phase 2; roadmap section 2.2 listed Google OAuth as planned.
**Decision:** The GOOGLE-AUTH implementation task (started by Codex) is paused. Boss review specifically prioritized Email OTP (DEC-028) and WhatsApp OTP (DEC-029) over Google OAuth. Google OAuth is not cancelled but requires explicit product confirmation before resuming.
**Reason:** Boss review reprioritized authentication methods.

## DEC-032 — Automatic website generation (future direction)

**Status:** Future
**Decision:** Automatic website generation from structured Buzl Listing business data is recorded as a future product direction. Potential flow: Buzl Listing profile data → auto-generated website → preview → Buzl-hosted option → "Want this website on your own domain?" → contact Buzl for hosting/custom domain/customization. This is future scope only, not current implementation.
**Reason:** Discussed in Boss review as long-term product direction.
