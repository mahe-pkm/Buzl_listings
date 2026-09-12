# Buzl Listing — Project Plan

## Current status

| Phase | Status |
|---|---|
| Phase 0 — Project Control Layer | Complete |
| Phase 1 — Research & Decision Lock | Complete |
| Phase 2 — MVP Specification Lock | Next |
| Phase 3 — Technical Foundation | Not started |
| Phase 4 — Business Listing MVP | Not started |
| Phase 5 — Discovery | Not started |
| Phase 6 — SEO Hardening | Not started |
| Phase 7 — Admin & Moderation | Not started |

## Phase 0 — Project Control Layer

**Status: Complete**

Completed:

- repository control/documentation structure
- `.research/` workspace and Git ignore rule
- agent handoff workflow
- current-state tracking
- Phase 0 baseline commit

Baseline commit recorded by the project owner:

```text
50ffe3c  chore: establish phase 0 project baseline
```

---

## Phase 1 — Research & Decision Lock

**Status: Complete**

Research completed:

- open-source directory projects
- competitor/directory patterns
- local SEO architecture
- canonical URL strategy
- business/location data-model direction
- Postgres search
- PostGIS/geospatial direction
- duplicate detection
- moderation/verification concepts
- maps/geocoding options
- Buzl dashboard design-system extraction

Design baseline commit recorded by the project owner:

```text
d19c105  docs(design): establish Buzl design system baseline
```

Phase 1 decisions are now recorded in `docs/DECISIONS.md`.

One research item is deliberately deferred:

- final map/geocoding provider selection

That choice will be resolved during Phase 2 after an India-address quality, terms, and cost comparison.

---

## Phase 2 — MVP Specification Lock

**Status: Next**

Goal: convert the accepted Phase 1 architecture into implementation-ready specifications without asking a coding agent to invent product requirements.

Lock:

- final business field set
- database tables/columns
- primary/foreign keys
- indexes
- PostGIS column design
- RLS policies
- ownership/membership model
- duplicate scoring/handling rules
- verification model
- external-user moderation policy
- exact onboarding flow
- category taxonomy seed strategy
- service representation
- location hierarchy and seed strategy
- exact public route structure
- category/location indexation thresholds
- map/geocoder provider
- auth method for MVP
- media/storage rules
- public listing information architecture
- admin MVP boundary

Exit criteria:

> A coding agent can scaffold the application and migrations from repository specifications without researching or inventing product architecture.

---

## Phase 3 — Technical Foundation

Implement only after Phase 2 is locked:

- Next.js application
- TypeScript
- Buzl design-token integration
- Supabase local development stack
- PostgreSQL extensions
- database migrations
- RLS baseline
- authentication
- application shell
- validation
- testing/lint/typecheck/build baseline

---

## Phase 4 — Business Listing MVP

Implement:

```text
Register / login
        ↓
Create business
        ↓
Business identity + NAP
        ↓
Category + services
        ↓
Location / service area
        ↓
Map coordinates
        ↓
Preview
        ↓
Publish / submit
        ↓
Public canonical listing
```

---

## Phase 5 — Directory Discovery

Implement:

- directory home
- business search
- category pages
- location pages
- selected category + location landing pages
- related businesses

---

## Phase 6 — SEO Hardening

Verify:

- metadata
- canonical handling
- slug redirects
- LocalBusiness JSON-LD
- breadcrumbs
- sitemaps
- robots/crawl controls
- internal linking
- thin-page controls
- performance
- accessibility

---

## Phase 7 — Admin & Moderation

Implement:

- listing review queue
- approve / reject
- suspend / archive
- duplicate review
- verification review
- category/location administration
- user/business management
- audit information
