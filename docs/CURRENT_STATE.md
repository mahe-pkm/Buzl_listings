# Current Project State

**Current phase:** Rapid MVP Prototype Build Contract ready / locked; prototype implementation is next
**Application code:** Not started  
**Database migrations:** Not started  
**Local Supabase app stack:** Not initialized  
**Phase 0:** Complete  
**Phase 1:** Complete, with one deliberately deferred provider decision  
**Phase 2:** Rapid prototype exception approved: remaining detailed Phase 2 workstreams are consolidated in the MVP Build Contract rather than separately completed.

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

## Normal detailed Phase 2 path — deferred

For the normal production-oriented Phase 2 path, do not scaffold or write migrations until Phase 2 separately locks:

- tables/columns/types
- constraints/indexes
- RLS
- ownership model
- service/tag model
- routes
- map provider
- auth UX

The rapid internal prototype is the approved exception: its locked `docs/specs/MVP_BUILD_CONTRACT.md` authorizes the minimum scaffolding, migrations, RLS, and implementation needed for the prototype while leaving the detailed production workstreams deferred.

## Phase 2.1 — Business Field Matrix

- `docs/specs/BUSINESS_FIELD_MATRIX.md` is complete / locked as the authoritative product/data field contract for subsequent Phase 2 work.
- OD-01 through OD-12 are locked, including the approved minimum publishable record, India-first globally extensible geography, and service-area privacy.
- At the Phase 2.1 checkpoint, no implementation work had started and Phase 3 was not authorized; the later Rapid MVP Build Contract below supersedes that implementation gate for the internal prototype only.

## Phase 2.2 — User Journeys

- `docs/specs/USER_JOURNEYS.md` is complete / locked; it defines implementation-neutral MVP journeys J01 through J24.
- It preserves the Phase 2.1 minimum publishable record, service-area privacy, publication/verification separation, and feature-gated external registration.
- No application code, Next.js scaffolding, Supabase initialization, database schema, SQL, RLS policy, migration, provider selection, or implementation work has started.

## Rapid MVP Build Contract

- `docs/specs/MVP_BUILD_CONTRACT.md` is READY / LOCKED for the fast internal prototype.
- It consolidates the minimum implementation decisions for database structure, permissions, duplicate handling, publication/verification, taxonomy/services, locations, routes, SEO, auth, public IA, maps/location behavior, and prototype QA.
- Remaining detailed Phase 2 documents are deferred because their necessary MVP decisions are consolidated in the Build Contract; they are not individually complete.
- Prototype implementation is the next authorized task. Do not treat this authorization as production hardening or as completion of the deferred detailed workstreams.

## Next exact task

Prototype implementation from `docs/specs/MVP_BUILD_CONTRACT.md`.

## Agent handoff instruction

A new coding/planning agent should read:

1. `AGENTS.md`
2. this file
3. `docs/DECISIONS.md`
4. `docs/exec-plans/PHASE_02_MVP.md`
5. only the feature/spec files needed for the active Phase 2 task

For this rapid internal prototype, begin implementation only from the locked `docs/specs/MVP_BUILD_CONTRACT.md`. The normal detailed Phase 2 exit criteria remain deferred for later production hardening.
