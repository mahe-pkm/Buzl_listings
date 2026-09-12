# Architecture / Product Decisions

Use this file as a lightweight ADR log.

## DEC-001 — Next.js

**Status:** Accepted  
**Decision:** Use Next.js for the application.  
**Reason:** Strong fit for SEO-facing public pages plus authenticated application flows.

## DEC-002 — Supabase

**Status:** Accepted  
**Decision:** Use Supabase for PostgreSQL, Auth, Storage, and RLS.  
**Reason:** Matches the required app model and supports efficient local development.

## DEC-003 — Local Supabase via Docker

**Status:** Accepted  
**Decision:** Use Supabase CLI with Docker Desktop locally.  
**Reason:** Reproducible local testing and migration-driven development.

## DEC-004 — Git as agent handoff memory

**Status:** Accepted  
**Decision:** Git + repository documentation are the persistent state across Codex and Antigravity.  
**Reason:** Avoid dependence on one agent's conversation history.

## DEC-005 — Raw research is not committed

**Status:** Accepted  
**Decision:** Keep exploratory material in `.research/` and ignore it in Git.  
**Reason:** Keep the repository focused while preserving local investigation.

## DEC-006 — Open-source strategy

**Status:** Accepted  
**Decision:** Build Buzl Listing on an owned Next.js + Supabase architecture. Use MIT-licensed directory projects only as reviewed implementation references; do not fork a complete directory product or copy GPL/AGPL code.  
**Reason:** Citation integrity, Buzl design, India-focused locations, verification, duplicate handling, and future integrations require control of the product model.

## DEC-007 — Primary directory reference

**Status:** Accepted  
**Decision:** Treat `gijsverheijke/directorystarter` as the primary architecture reference, not an upstream dependency.  
**Reason:** Its App Router, Supabase, RLS, server-rendered pages, listing lifecycle, search, and sitemap patterns align closely with Buzl's direction.

## DEC-008 — Stable listing URLs

**Status:** Accepted  
**Decision:** A public listing has one canonical URL independent of category and location, following the conceptual form `/business/{slug}`. Historical slugs must permanently redirect to the current canonical URL.  
**Reason:** Businesses can move or change category without losing URL equity or citations.

## DEC-009 — Controlled directory indexation

**Status:** Accepted  
**Decision:** Index explicit category, location, and selected category-plus-location landing pages only. Search, sort, and arbitrary facet URLs are not an unlimited indexable page system.  
**Reason:** Prevent thin or near-duplicate crawl spaces while retaining useful discovery pages.

## DEC-010 — Listing unit and service areas

**Status:** Accepted  
**Decision:** One MVP listing represents one physical establishment or one service-area business. Support `storefront`, `service_area`, and `hybrid` location modes, with street-address visibility controlled separately.  
**Reason:** This fits LocalBusiness semantics and service businesses without prematurely building multi-branch organization management.

## DEC-011 — Listing lifecycle and verification

**Status:** Accepted  
**Decision:** Publication (`draft`, `pending`, `published`, `rejected`, `suspended`, `archived`) and verification (`unverified`, `pending`, `verified`, `failed`) are independent state machines.  
**Reason:** Publication is not evidence of verification, and verified businesses may still require suspension.

## DEC-012 — Search and geographic foundation

**Status:** Accepted  
**Decision:** Start search in PostgreSQL using full-text search and `pg_trgm`; enable PostGIS and store an indexable geography point from the foundation phase. Do not add an external search service for MVP.  
**Reason:** This provides relevant text matching and a safe path to proximity search without premature infrastructure.

## DEC-013 — Duplicate handling and data provenance

**Status:** Accepted  
**Decision:** Identify likely duplicates with normalized phone, website domain, legitimate external IDs, Buzl IDs, name/address context, and fuzzy similarity. Flag uncertain matches for review; never auto-merge fuzzy matches. Owner- or Buzl-provided data is the canonical record, not scraped third-party data.  
**Reason:** Citation quality depends on avoiding conflicting listings while preserving legitimate records.

## DEC-014 — Map provider boundary

**Status:** Accepted  
**Decision:** Keep map and geocoding logic behind provider-neutral interfaces. Do not use OpenStreetMap Foundation public tile or Nominatim infrastructure as the production backend.  
**Reason:** Provider substitution, commercial usage limits, and address-data licensing must not distort the core listing model.

## DEC-015 — Map provider selection

**Status:** Deferred to Phase 2  
**Decision:** Select a managed provider after estimating Indian-address quality, onboarding geocodes, public map loads, permanent-storage rights, attribution, and cost. The shortlist is MapTiler, LocationIQ, Geoapify, Google Maps Platform, and Mapbox.  
**Reason:** This choice has material cost and licensing consequences that research alone cannot settle.

## DEC-016 — Citation-safe NAP and taxonomy

**Status:** Accepted  
**Decision:** Preserve canonical owner-facing business name, primary phone, and structured address while maintaining separate normalized matching values. Use a curated, hierarchical Buzl category taxonomy; services and tags remain distinct concepts.  
**Reason:** Accurate citations and manageable SEO require controlled data, not a copied mega-directory taxonomy or free-form keyword fields.

## DEC-017 — Authentication direction

**Status:** Accepted with Phase 2 selection pending  
**Decision:** Use Supabase Auth. The first credential experience will be email/password or magic link; social authentication is not required for MVP.  
**Reason:** The backend choice is locked, while the onboarding UX choice should be finalized with the MVP flow.

## DEC-018 — Design-system continuity

**Status:** Accepted  
**Decision:** Reuse the documented Buzl design system and semantic token layer; do not create a separate directory visual language.  
**Reason:** The listing product must remain visually coherent with Buzl and avoid scattered temporary values.

## Remaining Phase 2 decisions

- exact database schema, constraints, RLS policies, and migrations
- final map provider and its storage/attribution contract
- first authentication credential method
- final seed taxonomy and indexation thresholds
- production hosting and deployment design
- final moderation and trusted-client launch policy
