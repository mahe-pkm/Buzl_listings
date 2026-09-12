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

## Day 1.5 implementation status

- **Day 1.5 — Internal Buzl Profile JSON Import with Buzl Member Support is COMPLETE and verified.**
- **Terminology & Identity Concept:**
  - Role terminology strictly updated: "Buzl Member" (`buzl_member`) is used exclusively (zero occurrences of "Staff").
  - `member_id` identity concept added to `public.profiles` (`member_id text unique check (...)`). Assigned via admin-only RPC `set_member_id`.
  - Buzl Member test account seeded: `member@buzl.test` (`role: 'buzl_member'`, `member_id: 'BUZL-M-1024'`); Admin test account assigned `member_id: 'BUZL-M-0001'`.
- **Database & Permissions:**
  - Migration `20260912150000_day1_5_member_and_import.sql` applied.
  - Helper `is_buzl_member()` returns true for `admin` and `buzl_member`.
  - Provenance audit columns added to `public.businesses`: `source_record_id`, `source_buss_id`, `source_loc_id`, `source_place_id`, `imported_by_user_id`, `imported_by_member_id`.
  - `created_source` column check constraint supports `'trusted_import'`.
  - pgTAP test suite `supabase/tests/day1_5_import_runtime.sql` passes (verifying admin-only member_id assignment, member RPC checks, and denial of direct publication).
- **Schema & Adapter Layer:**
  - Strict Zod schema `BuzlProfileImportSchema` (`src/lib/import/schema.ts`) validates legacy payload structure, coerced coordinates, and arrays.
  - Adapter `mapBuzlProfileToListing()` (`src/lib/import/adapter.ts`) isolates legacy data from canonical schema.
  - Robust Indian address parser (`parseIndianAddress`) extracts PIN, state, city, and locality.
  - Category matcher (`matchCategory`) runs exact and alias matching; flags `status: 'review_required'` when source category is not active (e.g. Laptech's "Electronics repair shop").
  - Service-area privacy: `show_street_address` is strictly false, address lines cleared, source coordinates flagged `isSuppressedFromPublic: true` and held for internal review only.
- **Route & UI Implementation:**
  - Importer routes: `/admin/businesses/import` and `/internal/businesses/import` (redirect).
  - Middleware & layouts allow `admin` and `buzl_member`; strictly deny `business_owner` (redirects to `/dashboard`) and anonymous (redirects to `/login`).
  - Comprehensive 8-section review interface (`src/components/import/BuzlProfileImporter.tsx`):
    1. Source Identity & Provenance (recordId, bussId, locId, placeId, legacy status)
    2. Import Actor Attribution (name, role, member_id badge, traceable audit)
    3. Business Information (canonical name, phone, contact email, website, highlights)
    4. Classification & Category Match (source category, match status badge, category picker)
    5. Location & Delivery Mode (mode, raw address, city/state, service areas, internal coordinates)
    6. Services Provided (scrollable chips with count)
    7. Warnings & Duplicate Signals (real-time duplicate detection across phone, domain, legacy IDs)
    8. Privacy Controls (show_email toggle, show_street_address locked to false for service area)
  - Live right-column Public-Safe Preview using `BusinessPreviewCard` with zero leakage.
  - Success modal ("BUZL PROFILE IMPORTED") detailing Business ID, Member ID attribution, and draft status.
  - Single-click "Load Laptech Sample Profile" for instant validation.
- **Verification & Review:**
  - Independent Product Review: PASS (100% compliant with specifications).
  - Independent Security Review: PASS (Strict authorization, anti-spoofing, publication enforcement).
  - Independent Privacy Review: PASS (Zero coordinate leakage, service-area address suppression, contact email hidden by default).
  - Automated integration test suite (`scripts/verify-day1-5-import.mjs`): 9 out of 9 tests passed.
  - Full pgTAP database test suite (`npx supabase test db`): 2 of 2 test files passed.
  - Linting (`npm run lint`): 0 errors, 0 warnings.
  - Production build (`npm run build`): Compiled and generated successfully with 0 errors across all 13 routes.
  - Browser Smoke Test (`npm run test:smoke`): 5 of 5 suites passed cleanly with 0 console errors, 0 hydration errors, 0 UI runtime issues across 8 routes, 3 user personas, and mobile viewport (375px).

## Browser Smoke Test Report (Pre-Day 2)

- **Local App URL:** `http://localhost:3000`
- **Engine:** Google Chrome (`1.63.0` via Playwright automation)
- **Routes Tested (8):**
  - `/dashboard`
  - `/admin/businesses`
  - `/admin/businesses/import`
  - `/internal/businesses/import`
  - `/login`
  - `/dashboard/businesses`
  - `/dashboard/businesses/new`
  - `/dashboard/businesses/[id]/edit`
- **Account Flows Tested (3 personas):**
  1. `owner@buzl.test` (/login → /dashboard → business list → 6-step creation form → preview → submit for review)
  2. `member@buzl.test` (/login → /admin/businesses/import → load Laptech sample → 8 review sections → confirm CATEGORY REVIEW REQUIRED → confirm service-area privacy → select category → create draft → verify 26 services & Member ID BUZL-M-1024)
  3. `admin@buzl.test` (/login → /admin/businesses → table view → publish listing → confirm published state → suspend listing → confirm suspended state)
  4. Anonymous user denied protected routes and redirected to `/login`
  5. Business Owner denied importer routes and redirected to `/dashboard`
  6. Mobile width (375x667): Hamburger header, accessible slide-out drawer, 0px horizontal scroll overflow
- **Integration Defects Resolved:**
  1. Root Next.js route collision: removed `app/.gitkeep` at root which had taken precedence over `src/app`.
  2. Server Action constraint: extracted synchronous `parseEwkbPoint` from `'use server'` action file into `src/lib/geo.ts`.
  3. Prerender bailout: isolated `useSearchParams` inside `<Suspense>` in `src/app/login/page.tsx`.
  4. Form accessibility: added semantic `id`, `name`, and matching `htmlFor` attributes across `BusinessForm.tsx`.
- **Telemetry & Artifacts:**
  - Console Errors: 0 errors
  - Page / Hydration Errors: 0 errors
  - UI Runtime Errors: 0 errors
  - 13 verification screenshots captured in `tests/screenshots/`

---

## Day 2 — Public Directory, Search, Discovery, SEO & Staging Readiness: COMPLETE

- **Database & RPC Layer (`supabase/migrations/20260912160000_day2_public_directory.sql`):**
  - Applied migration with GIN `pg_trgm` indexes across `businesses`, `categories`, `services`, and `service_areas`.
  - 8 hardened `SECURITY DEFINER` RPCs with `search_path = pg_catalog, public`, explicit privilege revocation, bounded pagination (`limit 1..50`, `offset >= 0`), bounded input (`query <= 100 chars`, `slug <= 160 chars`), and published-only predicates.
  - Table `public.approved_combination_indexes` with RLS enforcing editorial approval for indexed location+category combination pages.
- **5 User Constraints Verified:**
  1. **Constraint 1 (Factual Content):** Categories and locations use stored factual names, counts, and listing cards; no invented marketing descriptions.
  2. **Constraint 2 (Combination Indexability Gate):** Approved combinations (`chennai/retail-store`) receive `robots: { index: true }` and enter `sitemap.xml`; unapproved combinations (`chennai/clinic`) render cleanly but receive `robots: { index: false, follow: true }` and are excluded from `sitemap.xml`.
  3. **Constraint 3 (Trusted Timezone Live Hours):** Live "Open Now" / "Closed" status claims require a trusted timezone (`IN` → `Asia/Kolkata`); unmapped/unknown timezones display operating hours without live-status claims.
  4. **Constraint 4 (Hardened RPCs & Strict Privacy):** Complete suppression of private street addresses, postal codes, and coordinates for service-area listings; zero internal user IDs, member IDs, or provenance IDs in public projections; contact email rendered only when `show_email = true`.
  5. **Constraint 5 (Recently Published Businesses):** Homepage section titled "Recently Published Businesses" querying `publication_status = 'published' order by updated_at desc limit 6`; no artificial "Featured" or paid rankings.
- **Public App Router Routes (10):**
  - `/` (Homepage with search hero, active categories, top cities, recently published listings)
  - `/business/[slug]` (Canonical listing detail with 301 slug redirect handling, 404 for non-published, breadcrumbs, action buttons, hours, services, and Schema.org `LocalBusiness` JSON-LD)
  - `/search` (Full-text & trigram search by name, service, location, and category; `robots: { index: false }`)
  - `/category/[slug]` (Category discovery with factual count and listings)
  - `/categories/[slug]` (HTTP 301 permanent redirect to `/category/[slug]`)
  - `/location/[slug]` (City & regional discovery)
  - `/locations/[slug]` (HTTP 301 permanent redirect to `/location/[slug]`)
  - `/location/[slug]/[categorySlug]` (Curated combination discovery with indexability gate)
  - `/sitemap.xml` (Dynamic sitemap with published listings, active categories, active locations, and approved combinations)
  - `/robots.txt` (Crawler permissions allowing public directory, disallowing `/admin/`, `/dashboard/`, `/internal/`, `/login`, `/search`)
  - `/_not-found` (Accessible 404 page with search input and directory navigation)
- **Review Subagent Audits (4 PASS):**
  - **Product Reviewer:** PASS (100% compliant with MVP Build Contract, Business Field Matrix, and User Journeys)
  - **SEO Reviewer:** PASS (Metadata, canonicals, Schema.org LocalBusiness & BreadcrumbList, sitemap, and robots verified)
  - **Security & Privacy Reviewer:** PASS (Hardened RPCs, zero privacy leaks, email privacy, and timezone defenses verified)
  - **UI Reviewer:** PASS (Buzl design tokens, mobile responsiveness at 375px, desktop readability, and action CTAs verified)
- **Automated Test Results:**
  - `scripts/verify-day2-public.mjs`: 58/58 checks passed
  - `npm run test:smoke:public`: 41/41 browser checks passed
  - `npm run test:smoke`: 5/5 persona regression suites passed
  - `npm run lint`: 0 errors, 0 warnings
  - `npm run build`: Production build succeeded in 740ms across all 22 routes

---

## Staging Readiness & Review Package: COMPLETE

- **Search Engine Staging Safety:**
  - Centralized staging detection via `src/lib/staging.ts` (`isStagingEnvironment()`).
  - Staging `robots.txt` disallows all crawlers (`User-Agent: * \n Disallow: /`).
  - Next.js root layout injects `<meta name="robots" content="noindex, nofollow, nocache" />` when staging.
  - Next.js middleware enforces HTTP response header `X-Robots-Tag: noindex, nofollow, noarchive`.
  - Canonical production SEO logic remains 100% untouched when `NEXT_PUBLIC_IS_STAGING` is false or unset.
- **Staging Database & Seeding Automation:**
  - Idempotent seeder script `scripts/seed-staging.mjs` provisions 3 test personas (`admin@buzl.test`, `member@buzl.test`, `owner@buzl.test`) with trusted `app_metadata` roles and `member_id` assignments.
  - Seeds safe demonstration listings across all location modes (`storefront`, `service_area`, `hybrid`) and publication statuses (`draft`, `pending`, `published`, `suspended`), including approved combination index `chennai / retail-store`.
  - Service-area listings strictly enforce zero leakage of street addresses or coordinates in public projections.
- **Reviewer Package (`docs/REVIEW_PACKAGE.md`):**
  - Comprehensive handoff document covering project info, baseline commit `46c454a`, staging URL instructions, persona credentials, core review flows (Owner, Buzl Member, Admin, Public), verified vs. deferred features, non-blocking hardening, reviewer checklist, 16 screenshots inventory, deployment/rollback guides, and blocker audit.
- **Quality & Verification:**
  - Production compile (`npm run build`) succeeded in 740ms with 0 errors.
  - Linter (`npm run lint`) passed with 0 errors and 0 warnings.
  - Verification suite `verify-day2-public.mjs`: 58/58 checks passed.
  - Browser smoke test `test:smoke:public`: 41/41 checks passed.
  - Persona smoke test `test:smoke`: 5/5 suites passed with 0 console errors, 0 hydration errors.
  - Staging protection runtime test: verified `robots.txt` disallows `/`, `X-Robots-Tag: noindex`, and meta robots `noindex, nofollow`.

## Release-Security Hardening: COMPLETE

- **Commit:** `13cff2e` (`chore(security): harden staging release workflow`)
- **Credential Audit:** PASS — zero real service-role keys, production API keys, or plaintext passwords in tracked files. Supabase local dev demo anon keys (issuer: `supabase-demo`, role: `anon`) retained as safe local-only fallbacks in verification scripts.
- **Service-Role Fallback Removal:** All scripts requiring privileged Supabase client (`seed-staging.mjs`, `seed-buzl-member.mjs`, `verify-day1-5-import.mjs`) now require `SUPABASE_SERVICE_ROLE_KEY` from env — zero hardcoded fallbacks.
- **Plaintext Password Removal:** `password123` removed from `login/page.tsx` demo fill, `seed-staging.mjs`, `verify-day1-workflow.mjs`, `verify-day1-5-import.mjs`. All persona passwords sourced from `STAGING_*_PASSWORD` env vars.
- **Staging Seed Safety Gates (5 mandatory):**
  1. `BUZL_ENV=staging` — explicit staging intent
  2. `ALLOW_STAGING_SEED=true` — explicit operator confirmation
  3. `NEXT_PUBLIC_SUPABASE_URL` — required (abort if missing)
  4. `STAGING_SUPABASE_PROJECT_REF` — required, exact match against URL hostname (abort on mismatch)
  5. `SUPABASE_SERVICE_ROLE_KEY` — required (abort if missing)
  - Privileged client constructed ONLY after all gates pass.
- **Negative Seed Tests (6/6 DENIED):**
  - staging intent absent → DENIED
  - operator confirmation absent → DENIED
  - URL absent → DENIED
  - project-ref mismatch → DENIED
  - service credential absent → DENIED
  - production-like ref without exact match → DENIED
- **Staging Indexing Protection (4 layers):**
  1. `layout.tsx` — `robots: { index: false, follow: false }` when staging
  2. `middleware.ts` — `X-Robots-Tag: noindex, nofollow, noarchive` HTTP header
  3. `robots.ts` — `Disallow: /` for all user agents
  4. `sitemap.ts` — returns empty array `[]`
- **Production Indexing:** Verified unchanged — `isStagingEnvironment()` returns false when staging env vars are unset, all SEO/sitemap/robots logic operates normally.
- **Temporary File Hygiene:** `.temp/` added to `.gitignore`; tunnel binary excluded from version control.
- **Documentation:** `REVIEW_PACKAGE.md` updated with complete safety gates, all required env vars, and safe operator sequence.
- **Quality Verification:**
  - `npm run lint`: PASS (0 errors, 0 warnings)
  - `npm run build`: PASS (exit code 0, compiled in 530ms, TypeScript in 1173ms, 16 pages generated)

## Hostinger VPS staging deployment — ACTIVE

- **Public staging app:** `https://listing.rclk.in`
- **Public staging API/Auth:** `https://api-listing.rclk.in`
- **Application source deployed:** `9f0f6f6 docs(architecture): lock PostgreSQL and media storage strategy`
- **Isolation:** Buzl runs as its own Compose project, database, volumes, generated secrets, and proxy services. The pre-existing Supabase project was left running and healthy.
- **Database:** Day 1, Day 1.5, and Day 2 migrations were applied in order to the isolated Buzl database only.
- **Demo data:** The guarded staging seed completed with server-only, randomly generated persona credentials. Credentials are not committed or included in project documentation.
- **Internal demo login helper:** The staging-only login cards retrieve the server-held demo credentials at runtime to fill the sign-in form. This is intentionally limited to the internal staging environment; it must be removed or protected before any public release.
- **Indexing safety:** The live staging app returns noindex response headers and meta tags; `robots.txt` disallows all crawling; `sitemap.xml` contains zero URLs.
- **Validation:** The Linux production image build and Linux lint check passed. Public HTTPS app, API, directory listing, and approved location/category route checks passed.

## Next exact task

Perform project-owner staging review using the separately provided persona credentials. Keep staging noindex until an explicit production-release task is approved.
