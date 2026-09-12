# Current Project State

**Current phase:** Rapid MVP Prototype Build Contract ready / locked; prototype implementation is next
**Application code:** Day 1 secure foundation complete; authenticated business workflow not implemented
**Database migrations:** Secure Day 1 foundation applied and runtime-tested locally
**Local Supabase app stack:** Running locally on repository-specific ports
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

## Day 1 implementation status

- **Day 1 Core Workflow is COMPLETE and verified.**
- **Authentication & Shell:**
  - Supabase SSR cookie auth with session verification in `src/lib/supabase/server.ts` and `src/middleware.ts`.
  - `/login` page with Buzl branding, demo accounts (`owner@buzl.test`, `admin@buzl.test`), and sanitized redirect handling.
  - Authenticated dashboard shell (`src/app/dashboard/layout.tsx` and `src/app/admin/layout.tsx`) with responsive desktop/mobile sidebar, topbar with user context and avatar, and sign-out.
- **Business Management & CRUD:**
  - Full multi-section business form (`src/components/business/BusinessForm.tsx`) matching the locked 6-step flow:
    1. Business Identity (canonical name, description, year established)
    2. Contact / NAP (primary/alt/WhatsApp phone, business contact email strictly separated from auth email, show_email toggle, website URL)
    3. Category & Services (curated active category + owner-defined service names)
    4. Location (Storefront with address & coordinates; Service-Area with named service areas and no street address; Hybrid with both)
    5. Hours & Social (7-day schedule grid with closed/24h toggles; Facebook, Instagram, LinkedIn, YouTube)
    6. Public-Safe Preview, Duplicate Warning & Publication Controls
  - Database RPC integration: `create_business_for_current_user`, `transition_business_publication`, and `set_business_verification`.
  - Public-Safe Preview component (`src/components/business/BusinessPreviewCard.tsx`) with zero leakage of private coordinates, auth email, or internal states.
  - Non-blocking duplicate warning querying matching normalized phone and website domain.
  - Data table views with real-time search toolbar and status filtering (`src/components/dashboard/BusinessTableView.tsx`).
  - Owner dashboard (`/dashboard`), owner business list (`/dashboard/businesses`), creation (`/dashboard/businesses/new`), and edit (`/dashboard/businesses/[id]/edit`).
  - Admin management portal (`/admin/businesses`) with publish, suspend, and verify moderation controls.
- **Review & Verification:**
  - Independent Product Review: PASS (100% adherence to `MVP_BUILD_CONTRACT.md`, `BUSINESS_FIELD_MATRIX.md`, and `USER_JOURNEYS.md`).
  - Independent Security Review: CLEARANCE CONFIRMED (Zero data leakage, RLS isolation verified, open redirect prevented).
  - Independent UI Review: PASS (Buzl design tokens, `@theme` integration, pill status badges, responsive mobile drawer).
  - Production build (`npm run build`) and linter (`npm run lint`) pass cleanly with 0 errors and 0 warnings.
  - Automated integration test suite (`scripts/verify-day1-workflow.mjs`) ran and passed all 6 end-to-end scenarios against local Supabase.

## Next exact task

Day 2 — Public Directory, Discovery, Search, SEO & Deployment:
1. Public canonical listing page (`/business/[slug]`) using `get_published_business_public`.
2. Historical slug redirects (`slug_history`).
3. PostgreSQL full-text search (`/search`).
4. Category discovery (`/categories/[slug]`) and location discovery (`/locations/[slug]`).
5. LocalBusiness JSON-LD, sitemap, robots.txt, and metadata.

## Agent handoff instruction

A new coding/planning agent should read:

1. `AGENTS.md`
2. this file
3. `docs/DECISIONS.md`
4. `docs/specs/MVP_BUILD_CONTRACT.md`
5. only the feature/spec files needed for Day 2 public directory work.
