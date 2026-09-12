# Current Project State

**Current phase:** Phase 2 started — Phase 2.1 Business Field Matrix complete / locked; awaiting project-owner review and Git checkpoint
**Application code:** Not started  
**Database migrations:** Not started  
**Local Supabase app stack:** Not initialized  
**Phase 0:** Complete  
**Phase 1:** Complete, with one deliberately deferred provider decision  
**Phase 2:** In progress; Phase 2.2 User Journeys is next, but must not start until directed

## Git checkpoints recorded by the project owner

```text
50ffe3c  chore: establish phase 0 project baseline
d19c105  docs(design): establish Buzl design system baseline
```

## Completed

### Project control

- agent workflow
- research/document separation
- Git-based handoff strategy
- project plans/spec structure

### Phase 1 research

- competitor/directory patterns
- open-source directory repositories
- SEO/canonical architecture
- maps/geocoding options
- business data-model direction
- search direction
- PostGIS direction
- duplicate detection
- moderation/verification concepts
- Buzl design system extraction

### Phase 1 decision lock

Accepted:

- own Next.js/Supabase architecture
- primary reference repo strategy
- stable business canonical URL
- controlled SEO landing pages
- one listing per establishment/service-area listing
- storefront/service-area/hybrid modes
- separate publication/verification states
- PostgreSQL FTS + pg_trgm
- PostGIS from foundation
- layered duplicate detection
- provider-neutral map integration
- authoritative Buzl/owner business data
- citation-safe NAP
- curated hierarchical categories
- Supabase Auth
- Buzl design-system reuse

Deferred:

- final map/geocoder provider selection

## Phase 1 accepted/deferred count

```text
Accepted: 16
Deferred: 1
Rejected: 0
```

## Important implementation status

No Next.js application scaffolding should exist yet.

No database migration should be written until Phase 2 locks:

- tables/columns/types
- constraints/indexes
- RLS
- ownership model
- service/tag model
- routes
- map provider
- auth UX

## Phase 2.1 — Business Field Matrix

- `docs/specs/BUSINESS_FIELD_MATRIX.md` is complete / locked as the authoritative product/data field contract for subsequent Phase 2 work.
- OD-01 through OD-12 are locked, including the approved minimum publishable record, India-first globally extensible geography, and service-area privacy.
- No application code, Next.js scaffolding, Supabase initialization, database schema, SQL, RLS policy, migration, provider selection, or implementation work has started.
- Phase 3 is not authorized.

## Next exact task

Phase 2.2 — User Journeys. Do not start it until the project owner directs the next task.

## Agent handoff instruction

A new coding/planning agent should read:

1. `AGENTS.md`
2. this file
3. `docs/DECISIONS.md`
4. `docs/exec-plans/PHASE_02_MVP.md`
5. only the feature/spec files needed for the active Phase 2 task

Do not start application coding unless Phase 2 exit criteria are met and the project owner explicitly authorizes Phase 3.
