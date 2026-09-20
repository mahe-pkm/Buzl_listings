# Current Project State

## Auth V2 Phase 3 Business Contact Email verification — local review ready (2026-09-20)

- Implementation branch: `codex/auth-v2-phase-3-business-email-verification`, based on checkpoint `e812e9b`.
- Added owner-authorized, rate-limited challenge issuance with a 30-minute expiry. The app generates a cryptographically random opaque token and PostgreSQL stores only its SHA-256 digest.
- Challenge replacement is serialized on the business row, older active challenges are invalidated, failed SMTP delivery discards the unusable new challenge, and the existing row-locking consumption primitive remains authoritative for replay, expiry, and email-mismatch denial.
- Added server-only SMTP delivery for the professional `Verify your business email — Buzl Listing` message. SMTP credentials remain server-side; no new mail vendor was selected. Local verification uses an isolated transport contract and requires configured SMTP for a real inbox E2E.
- Added `/verify-business-email` confirmation/success/failure UX. Public links contain only the opaque token; successful verification removes the token from the URL and stores only a short-lived HTTP-only return-path cookie.
- Business Contact Email status now supports no-email, not-verified, sent, changed-email, and verified states. Changed emails must be saved before verification; draft saving remains allowed.
- Owner submission UI now requires verified Business Contact Email, while the existing database transition gate remains authoritative.
- Internal lists and profile controls now label Listing Verification separately from Business Email verification. Admin manual contact-email verification has a distinct confirmed action; ordinary Buzl Members retain no authority.
- Added 14 Phase 3 pgTAP assertions. Full database result: 9 files / 111 tests PASS. Transactional mail/token contract, lint (0 errors, 15 pre-existing warnings), production build, `git diff --check`, invalid-link UX, and 375/390/430 mobile overflow checks pass.
- Staging and production were untouched. Next gate: `AUTH_V2_PHASE_3_LOCAL_EMAIL_E2E` with a configured local/test SMTP inbox.

## Auth V2 Phase 2 WhatsApp-first UI — locally implemented, E2E gated (2026-09-20)

- Implementation branch: `codex/auth-v2-phase-2-whatsapp-first`, based on Phase 1 metadata checkpoint `5d59d16`.
- WhatsApp is now the default public authentication method on both `/login` and `/signup`; Email Code and Password remain available as secondary methods.
- The public flow normalizes India-first and international numbers to E.164, calls Supabase `signInWithOtp()` with `shouldCreateUser: true`, verifies with `verifyOtp({ type: 'sms' })`, masks the destination, enforces a resend cooldown, and returns non-enumerating errors.
- Public requests contain no role, account-status, member ID, or permission-preset metadata. Trusted profile/role provisioning remains database-controlled.
- Successful authentication resolves the active profile and routes Business Owners solely from `profiles.onboarding_completed_at`; internal role routes remain unchanged.
- Added `/onboarding`, reusing the existing eight-step Business Form. Saving the first valid business draft calls the self-only `complete_user_onboarding()` RPC through an authenticated server action, then routes to the existing dashboard editor.
- Business contact phone, WhatsApp phone, and email fields start blank. Auth phone/email are not copied into listing data.
- Route guards now enforce incomplete-owner onboarding and continue denying Business Owners access to `/admin/*` and `/review/*`.
- Automated Auth V2 contract checks pass. Local browser smoke passes at 375px, 390px, and 430px using an intercepted/mock OTP transport; this is UI/contract evidence only and is not claimed as real OTP E2E.
- `npm run lint`: PASS with 15 pre-existing warnings and zero errors.
- `npm run build`: PASS.
- `npx supabase test db`: PASS — 8 files, 97 tests.
- No live OTP was sent. Staging and production were not modified.
- The previously audited unconfirmed phone-only local user/profile remains untouched. A clean real unknown-phone E2E requires operator approval before removing that artifact.
- CAPTCHA remains required before public staging release; this phase preserves the Supabase `captchaToken` integration point but does not add an unapproved provider.
- Business-contact-email delivery and optional Auth email/password settings remain Phase 3.
- Next gate: `LOCAL_TEST_ARTIFACT_CLEANUP_APPROVAL`.

## Auth V2 Phase 1 database foundation — review ready (2026-09-20)

- Architecture approval checkpoint: `45d9c22 docs(auth): approve WhatsApp-first auth architecture v2`.
- Implementation branch: `codex/auth-v2-phase-1-db`.
- Added migration `20260920130000_auth_v2_database_foundation.sql`.
- Added `profiles.onboarding_completed_at`; new Auth users remain null. Backfill marks only existing internal (`admin`/`buzl_member`) profiles or profiles with an existing `business_managers` relationship as complete.
- Added self-only, active-profile, idempotent `complete_user_onboarding()` and removed direct authenticated profile insertion/onboarding-column update privileges.
- Added `businesses.business_contact_email_verified_at` without any blind verification backfill.
- Added normalized-email change detection that preserves verification for case-only changes and clears it for an effective email change.
- Added private `business_email_verification_challenges` storage with a unique 32-byte token hash, expiry/single-use constraints, RLS, no anon/authenticated table access, and a service-role-only row-locking consumption RPC.
- Added admin-only manual business-contact-email verification. Business Owners and ordinary Buzl Members receive no verification authority.
- Split structural publishability from the new verified-email submission gate. Existing published rows remain operational without fabricated verification history; every future pending/published transition requires an actual verification timestamp.
- Added focused `auth_v2_business_email_runtime.sql` coverage with 34 assertions and updated existing test fixtures to satisfy the new email gate without weakening their original RBAC/category/location checks.
- `npm run lint`: PASS with 15 pre-existing warnings and zero errors.
- `npm run build`: PASS.
- `npm run test:guards`: PASS.
- `git diff --check`: PASS.
- Applied the pending migration to the existing local Supabase database with `npx supabase migration up --local`; no database reset or data deletion was performed.
- `npx supabase test db`: PASS — 8 files, 97 tests, including all 34 focused Auth V2 assertions.
- Existing local listing audit before/after migration: 12 published, 1 pending, and 0 with trusted business-email verification evidence. No timestamp was backfilled. Existing published rows remain operational; the pending row requires real/manual verification before publication. No explicit grandfathering flag or product decision is required.
- Local phone-only artifact audit: one Auth user found, profile found, phone unconfirmed, no business relationship. It is safe to remove before controlled V2 E2E testing, but Phase 1 did not delete it.
- Onboarding backfill result: 5 established/internal profiles marked complete and 2 profiles left incomplete under the documented evidence-based rule.
- Docker Desktop 4.78's management process still has a generated Unix-socket startup issue, but the existing isolated local Supabase database remained reachable for migration and the complete pgTAP suite. Timestamped runtime-directory backups contain generated sockets only; no Docker images or volumes were altered.
- Staging and production remain untouched. No OTP, Auth UI, or Meta-provider behavior changed.
- Next exact action: independent database/security review of the migration, RPC privileges, legacy compatibility behavior, and pgTAP evidence.

## Authentication Architecture V2 — approved for Phase 1 database foundation (2026-09-20)

- New locked product direction: WhatsApp OTP is the default public Business Owner signup and login method.
- Unknown verified phone -> new Supabase Auth user -> active profile -> trusted `business_owner` role -> onboarding.
- Existing verified phone -> same Supabase UID/profile/role -> dashboard or unfinished onboarding.
- Public signup can never create `admin`, `buzl_member`, or the `listing_manager` permission preset; internal accounts remain invited/admin-created.
- Supabase remains the OTP, identity, verification, and session authority. Meta remains delivery only through the existing signed Send SMS Hook and approved `buzl_listing_otp` / `en` template.
- Account status, listing publication status, and listing verification status remain independent.
- Auth phone and optional Auth email remain private credentials. They are never copied automatically to listing contact fields.
- Business contact email verification is mandatory before `draft -> pending`; saving an unverified draft remains allowed.
- One user to many businesses is already supported by `business_managers`; no phone-to-business uniqueness rule is approved.
- Current profile provisioning correctly defaults a public Auth user to active `business_owner` through trusted database/app-metadata enforcement. Implementation must add regression tests proving public metadata cannot inject privilege.
- Required future migrations: `profiles.onboarding_completed_at`, `businesses.business_contact_email_verified_at`, and a private hashed single-use business-email verification challenge table, plus a server-enforced submission gate.
- The phone-link registry is not required for normal public Business Owners. Any future internal-account phone credential must be attached through an authenticated/admin-authorized same-UID flow.
- Old “unknown phone must not create an account” and “no public signup” assumptions are superseded for Auth V2 but remain historical in locked prototype documents until a separately approved implementation update.
- Possible local phone-only test artifact: `REVIEW_REQUIRED`; the isolated local Supabase Docker runtime was unavailable during the read-only audit, so nothing was inspected destructively or removed.
- Architecture: `docs/AUTH_ARCHITECTURE_V2.md`.
- Independent architecture review passed. The database foundation may proceed, but historical business contact emails must not be marked verified without actual verification evidence.
- Active task: `AUTH-WHATSAPP-FIRST-V2`, AgentRelay status `REVIEW` pending implementation resume.
- Next gate after Phase 1: `AUTH_V2_PHASE_1_DB_REVIEW`.
- No runtime Auth code, database, Supabase configuration, staging environment, or production environment was changed by this architecture task.

## WhatsApp OTP Meta live integration — paused before genuine Supabase OTP request (2026-09-19)

> Historical delivery checkpoint. Its former unknown-phone restriction is superseded by Authentication Architecture V2; the delivery implementation and evidence remain preserved.

- Active branch: `feature/whatsapp-otp-meta-live`, based on `fe13135`.
- Implemented a server-only Meta WhatsApp Cloud delivery adapter for the API-confirmed `buzl_listing_otp` / `en` authentication template.
- Implemented the self-hosted Supabase Send SMS Auth Hook endpoint with Standard Webhooks signature verification and fail-closed behavior.
- Supabase remains the sole OTP generator, verifier, identity, session, role, and account-status authority; the application does not persist or log OTP values.
- Added contract coverage for the Graph endpoint, template parameter mapping, signed-hook verification, and sanitized provider failures.
- Direct Meta template delivery and operator receipt confirmation passed with the API-confirmed `en` language.
- Local Auth runtime now has phone Auth enabled, SMS autoconfirm disabled, the signed Send SMS Hook enabled at the reachable `host.docker.internal:3000` route, and matching Auth/app signing secrets stored only in ignored `.env.local`.
- Runtime signature checks passed: valid Standard Webhooks signature accepted by the verifier; missing and invalid signatures rejected; provider delivery was disabled during this check and no message was sent.
- Local quality gates passed: provider contract, production build, lint with no errors, all 63 database tests, Supabase CLI environment resolution, Auth-container hook reachability, and runtime signature validation. Existing email-OTP and password browser flows passed; the older fixture script still assumes the pre-tab password form and requires separate maintenance.
- No genuine Supabase phone OTP has been requested yet. OTP verification, session validation, profile resolution, RBAC validation, and WhatsApp UI enablement remain gated.
- Staging and production were not deployed or modified for this task.
- Exact next action: request exactly one genuine Supabase-generated phone OTP, stop for operator receipt confirmation, and do not verify or enable the UI until the operator completes the next gate.

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
- **Plaintext Password Removal:** the legacy hard-coded test password was removed from `login/page.tsx` demo fill, `seed-staging.mjs`, `verify-day1-workflow.mjs`, and `verify-day1-5-import.mjs`. All persona passwords are sourced from `STAGING_*_PASSWORD` env vars.
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

## Docker application packaging — COMPLETE

- The repository contains a reproducible standalone Next.js production image,
  root application-only Compose workflow, health endpoint, and safe local
  Docker environment template.
- Local Docker server-side Supabase calls may use `SUPABASE_INTERNAL_URL`; the
  browser continues to use `NEXT_PUBLIC_SUPABASE_URL`.
- Docker packaging does not create or modify a Supabase stack and is compatible
  with the isolated VPS `buzl-listing` Compose project.
- Native lint/build, Docker build/config, image secret audit, healthcheck,
  restart/stop-start, and the Dockerized public smoke suite (41/41) passed.
- Local authenticated smoke fixtures are deterministic and local-only:
  `test:fixtures:auth` creates or updates the three role fixtures from ignored
  local environment variables, resets their current credentials, preserves the
  expected roles, and synchronizes Buzl Member identifiers without duplicates.
- Native and Docker browser checks passed for Business Owner, Buzl Member, and
  Admin login flows, including protected-route role boundaries and anonymous
  redirects. Server-side Supabase clients now derive their auth-cookie name
  from the public URL so Docker's internal service URL cannot hide browser
  sessions from middleware.

## Boss Review Scope Update (2026-09-17): COMPLETE

Product review with Balaji approved the following scope additions. All changes are documentation-only. No code, migration, or deployment changes were made.

### Approved additions

| Feature | Status | Decision |
|---|---|---|
| Gallery | Approved for upcoming implementation (image limit requires product decision) | DEC-024 |
| Products | Approved — max 20 per business (name, description, image; optional price/URL require product decision) | DEC-025 |
| Services | Expanded: name + description, max 20 per business | DEC-026 |
| Google Places search | Approved — replaces manual lat/lng entry in UI; API details pending provider configuration | DEC-027 |
| Email OTP | Approved — provider/config pending provider configuration | DEC-028 |
| WhatsApp OTP | Approved — provider/config pending approved messaging provider configuration | DEC-029 |
| Google Business Profile URL | Approved — new public-facing field, stored separately from place_id | DEC-030 |
| Google OAuth | Paused — requires product confirmation (Boss review prioritized OTP methods) | DEC-031 |
| Automatic website generation | Recorded as future direction only | DEC-032 |

### Documentation updated

- `docs/DECISIONS.md` — DEC-024 through DEC-032 with formal OD revisions
- `docs/ROADMAP.md` — new implementation priorities, auth update, gallery promotion, auto website future
- `docs/PRODUCT.md` — expanded business profile model, location UX, media architecture, auth updates, GBP URL, future direction
- `docs/specs/BUSINESS_FIELD_MATRIX.md` — OD-02 and OD-05 revision markers, Boss Review revision table
- `docs/CURRENT_STATE.md` — this section
- `CHANGELOG.md` — Boss Review scope update entry

### Pending Provider Configuration

- Google Places API credentials and configuration details
- Email OTP provider and configuration
- WhatsApp OTP provider and configuration

## Business Profile Expansion Staging Deployment (2026-09-17): COMPLETE

Implementation and staging deployment of approved Boss review additions:
- **Feature Merge**: `feature/business-profile-expansion` merged into `main` (`b656802`).
- **Services**: expanded to `service_name` + `service_description`, max 20 per business enforced by database trigger `trg_enforce_business_services_limit` and server actions.
- **Products**: new `public.business_products` table with name, description, image, and sort_order. Max 20 per business enforced by database trigger `trg_enforce_business_products_limit`. Full RLS isolation (`products_manager_or_admin`) and prevent-reassignment trigger.
- **Media Architecture & Gallery**: `public.business_media` updated with partial unique index `business_media_singleton_kind_idx` for single active logo and single active cover per business, while gallery allows unlimited items with captions and sort orders. Storage bucket `business-media` configured with 5MB max file size, MIME whitelist, and RLS policies for public CDN read and manager-only upload/delete.
- **Google Business Profile URL**: `google_business_profile_url` added to `businesses` with `^https?://` constraint and update permissions. Stored separately from `place_id`. Exposed publicly as "View on Google".
- **Business Form & Preview Card**: Form updated to 8 structured steps (Identity, Contact, Category & Services, Products, Media & Gallery, Location, Hours & Social, Preview & Submit). Live upload, delete, captioning, and reordering.
- **Public Business Page**: Rendered with cover photo banner, logo avatar, "View on Google" action button, service descriptions, products grid with images, and photo gallery with captions.
- **Staging Database Migration**: `20260917190000_business_profile_expansion.sql` applied cleanly to isolated staging PostgreSQL container `buzl-listing-db-1`.
- **Staging Container Deployment**: `buzl-listing-app-1` rebuilt and reloaded on VPS `213.210.37.204`. Unrelated Supabase and production containers untouched (12-day uptime intact).
- **Staging Smoke Verification**: 37/37 Playwright checks passed (`scripts/staging-profile-expansion-smoke.mjs`).

## Google Places Location Integration (2026-09-17): IMPLEMENTED & VERIFIED

Implementation of approved Google Places Location search replacing manual latitude/longitude typing:
- **Branch**: `feature/google-places-location` based on `main @ c8f67b8`.
- **Provider Architecture**: Clean abstraction with `PlacesProvider` interface. Server-side `GooglePlacesProvider` (direct Maps API client with 6s timeout) and `MockPlacesProvider` (deterministic Indian & global locations).
- **Production Safeguards**: `getPlacesProvider()` strictly forbids mock provider in production (`APP_ENV === 'production'`). In staging/production without key, it yields `NOT_CONFIGURED` (HTTP 503) without leaking mock data.
- **API Proxy Routes**: Authenticated routes `/api/places/autocomplete` and `/api/places/details` requiring active sessions (`getSessionUser()`), strict query/placeId length and regex bounds, and `Cache-Control: private, no-store`.
- **Database Schema**: Migration `20260917200000_google_places_location.sql` applied:
  - Added `place_id text check (place_id is null or char_length(btrim(place_id)) between 1 and 255)` to `public.businesses`.
  - Added partial index `businesses_place_id_idx on public.businesses (place_id) where place_id is not null`.
  - Granted `update (place_id)` to `authenticated`.
  - Updated `create_business_for_current_user` RPC with `p_place_id text default null`.
- **UX Integration**: `PlacesLocationSearch.tsx` embedded in Step 6 (Location) of `BusinessForm.tsx`. Auto-fills address lines, locality, city, state, postal code, and internal coordinates. Manual lat/long text fields removed from normal UI.
- **Invariants Maintained**:
  - Canonical Business Name Safety: selecting a place never overwrites `canonical_name`.
  - Service-Area Privacy: street address and coordinates strictly suppressed.
  - Legacy Listings: listings without `place_id` remain valid, editable, and publishable.
- **Quality Checks & Reviews**:
  - `npx supabase test db`: 5 test files, 38 tests, 0 failures (PASS).
  - `npm run lint`: 0 errors (PASS).
  - `npm run build`: 100% clean production build (PASS).
  - `node scripts/verify-google-places-flow.mjs`: 100% passing automated flow test.
  - `node scripts/browser-smoke-test-places.mjs`: 100% passing browser smoke test.
  - Independent Security Review: FINAL VERDICT PASS_WITH_NOTES (0 critical / 0 high findings). Applied defense-in-depth hardening:
    - Added `sessionToken` bounds (`<= 64`) and format regex (`/^[a-zA-Z0-9_\-]+$/`) in `/api/places/autocomplete` and `/api/places/details`.
    - Added explicit coordinate boundaries (`lat` in `[-90, 90]`, `lng` in `[-180, 180]`, `!isNaN`) in `updateBusiness`.
    - Enhanced production guard in `getPlacesProvider()` to check `NODE_ENV === 'production'` alongside `APP_ENV === 'production'`.
- **Live Provider State**:
  - Offline/Mock Provider: 100% verified across 8 representative mock locations in India and UK.
  - Live Google Provider: Fully verified with real Google Maps Platform API key (`GOOGLE_PLACES_MOCK=false`):
    - Autocomplete tested across all required locations (Chennai, Anna Nagar, Coimbatore, Munnar, Bengaluru, London): 100% PASS with Status `OK` and accurate predictions.
    - Place details lookup and address normalization verified for all required locations (coordinates, postal codes, locality, district, country codes).
    - Browser smoke test (`scripts/browser-smoke-test-places.mjs`) verified in Chromium with live Google Places: place search, auto-fill, PostGIS badge, listing creation, DB persistence (`ChIJm3EiiAdkUjoR4oGVuHcQoL0`), and pre-populated edit page all passed 100%.

## Google Places Location Integration Staging Deployment (2026-09-17): COMPLETE

- **Merge to Main**: `feature/google-places-location` merged into `main` (`511cecd`).
- **Staging Database Migration**: `20260917200000_google_places_location.sql` applied cleanly to isolated staging PostgreSQL container `buzl-listing-db-1`. Verified `place_id` column, `businesses_place_id_idx` index, and updated `create_business_for_current_user` RPC.
- **Server Secret Configuration**: Approved Google Places API key configured server-side in staging environment (`/opt/buzl-listing/.env`) with `GOOGLE_PLACES_MOCK=false`. Secret verified absent from client logs, responses, git, and documentation.
- **Staging Container Deployment**: `buzl-listing-app-1` rebuilt and recreated on Hostinger staging VPS (`213.210.37.204`). Unrelated Supabase and production containers left untouched (12-day uptime intact).
- **Staging Smoke Verification**: 33/33 checks passed (`scripts/staging-places-smoke.mjs`):
  - Authenticated proxy enforcement (401 on unauthenticated calls).
  - Staging indexing protections verified (`X-Robots-Tag: noindex, nofollow, noarchive`, `robots.txt: Disallow: /`, empty `sitemap.xml`).
  - Live Google Places autocomplete verified across Chennai, Coimbatore, Munnar, Anna Nagar.
  - Address auto-fill, PostGIS coordinate preservation, and `place_id` DB persistence verified.
  - Canonical business name protected against mutation.
  - Service-area address & coordinate suppression confirmed.
  - Backward compatibility verified for existing listings.

## Email OTP Authentication (2026-09-17): IMPLEMENTED & VERIFIED

- **Feature Branch**: `feature/email-otp-auth` based on `main @ e735192`.
- **Implementation**:
  - Implemented Supabase Auth GoTrue native OTP with 6-digit numeric verification tokens (`{{ .Token }}`).
  - Created customized magic link / OTP email template in `supabase/templates/magic_link.html`.
  - Configured `[auth.email.template.magic_link]` in `supabase/config.toml` with `otp_length = 6` and `otp_expiry = 600` (10 minutes).
  - Modernized `src/app/login/page.tsx` with dual-mode tabs ("Email Code (OTP)" default and "Password" fallback):
    - Two-stage OTP flow: Email entry -> 6-digit code entry with accessible numeric formatting (`inputMode="numeric"`, `pattern="[0-9]*"`, `maxLength={6}`).
    - 60-second countdown cooldown preventing resend spam.
    - Brute-force protection: 5-attempt limit with 5-minute lockout timer.
    - Open redirect protection (`getSafeRedirectUrl`) preventing external URL or protocol-relative redirects.
    - Safe post-login navigation based on verified user role.
    - Retained prototype demo credentials helper for immediate staging evaluation.
  - Modernized `src/app/signup/page.tsx` with unified "Email Code (OTP)" fast passwordless onboarding alongside "Password" creation.
- **Identity & Authorization Invariants**:
  - Existing Admin (`admin@buzl.test`), Buzl Member (`member@buzl.test`), Listing Manager (`manager@buzl.test`), and Owner (`owner@buzl.test`) retain their exact Supabase Auth UIDs, roles, `member_id` assignments, and permission presets.
  - Zero duplicate records created in `auth.users` or `public.profiles`.
  - New users are safely assigned `business_owner` by the PostgreSQL `handle_new_user()` trigger; client input cannot assign elevated roles.
  - Account status enforcement: Inactive and suspended accounts are strictly signed out and redirected by middleware (`src/middleware.ts`), server auth (`src/lib/supabase/server.ts`), and database RPCs/RLS.
  - Invariant `AUTH EMAIL != BUSINESS CONTACT EMAIL` strictly preserved: business creation via authenticated session leaves `business_contact_email` unset unless explicitly typed.
- **Verification & Testing**:
  - Automated flow test suite (`scripts/verify-email-otp-flow.mjs`): 49/49 checks passed (100%).
  - Playwright browser smoke test (`scripts/browser-smoke-test-otp.mjs`): 100% passed across owner OTP login, logout, password login regression, and new user signup OTP.
  - Database test suites (`npx supabase test db`): 5 suites, 38 tests passed.
  - Next.js build (`npm run build`): Clean with 0 errors.
  - Linting (`npm run lint`): Clean with 0 errors.
  - Whitespace / formatting (`git diff --check`): Clean.
  - Independent security review (`Independent Security Reviewer`): Verdict **PASS_WITH_NOTES** (0 critical / 0 high vulnerabilities).
- **Live Staging GoTrue & Hostinger SMTP Deployment (2026-09-17)**:
  - Configured live Hostinger SMTP credentials in `/opt/buzl-listing/.env`:
    - `SMTP_HOST=smtp.hostinger.com`
    - `SMTP_PORT=465` (SSL)
    - `SMTP_USER=listing@rclk.in`
    - `SMTP_ADMIN_EMAIL=listing@rclk.in`
    - `SMTP_SENDER_NAME=Buzl Listing`
    - `SMTP_PASS` configured securely server-side only.
  - Deployed public branded verification template to `/public/templates/magic_link.html` served directly at `https://listing.rclk.in/templates/magic_link.html`.
  - Configured `buzl-listing-auth-1` with:
    - `GOTRUE_MAILER_TEMPLATES_MAGIC_LINK: https://listing.rclk.in/templates/magic_link.html`
    - `GOTRUE_MAILER_SUBJECTS_MAGIC_LINK: "Your Buzl Verification Code"`
    - `GOTRUE_MAILER_OTP_EXP: 600` (10 minutes)
    - `GOTRUE_MAILER_OTP_LENGTH: 6` (6-digit numeric token)
  - Deployed updated web application container (`buzl-listing-app-1`) on staging VPS (`213.210.37.204`).
  - Staging verification:
    - Live external SMTP delivery confirmed via Hostinger IMAP (`listing@rclk.in`): Real email received from `"Buzl Listing" <listing@rclk.in>` with Subject `"Your Buzl Verification Code"` containing the live 6-digit OTP token.
    - Browser smoke tests passed on `https://listing.rclk.in`: Dual tabs UI, Password login regression (Admin redirect to `/admin/businesses`), OTP request stage, 60s cooldown timer, invalid OTP rejection, and brute-force attempt countdown.

## Current git status

Working tree: branch `main`
Latest commit: `ed82816`
Status: Fully implemented, verified locally, merged to main, deployed to staging VPS, and verified live on staging.

## Provider Reference Cleanup (2026-09-17): COMPLETE

- Removed personal provider attribution from project and repository history.
- Rewrote historical commits and synchronized canonical refs.
- New canonical main HEAD: `d30cadf`.
- Staging synchronized to canonical main.

## Business Owner UX Review (2026-09-18): COMPLETE

- **Task**: `BUSINESS-OWNER-UX-REVIEW`
- **Branch**: `main` (merged from `feature/business-owner-ux-review`)
- **Status**: `COMPLETE`
- **Scope**: Polished end-to-end business owner experience across authentication, onboarding, 8-step business form, preview, listing readiness, and dashboard management.
- **Key Deliverables**:
  - **Auth UI Responsiveness**: Eliminated horizontal scroll on 375px/390px/430px viewports, padded cards with `p-6 sm:p-8`, and ensured comfortable input typing targets (293px+ width).
  - **Google Business Profile Link**: Added dedicated owner-editable GBP URL field in Step 2 with copy: `Paste the link to your business on Google. This will appear as "View on Google" on your public listing.`
  - **Services & Products UX**: Updated Step 3 to `What services does your business offer?` with counter `X / 20 Services` and empty state card; updated Step 4 to `Step 4: Products & Offerings (Optional)` with counter `X / 20 Products` and friendly empty state.
  - **Zero Jargon Purge**: Replaced `PostGIS Ready` and `Geospatial Coordinates` in Step 6 with `✓ Location verified — Map location saved`. Replaced `Public-Safe Output` badge with `Public Listing Preview`. Replaced Topbar `Canonical Slug:` with `Listing URL:`.
  - **Listing Readiness Summary**: Added checklist card at top of Step 8 showing completed required sections (Name, Phone, Category, Location) and optional items (Services, Logo, GBP) before submission.
  - **Lifecycle Banners**: Added persistent banners for *Pending Review* (explaining moderation review and allowing ongoing edits) and *Published Listing* (providing direct `View Public Listing ↗` link to `/business/${slug}`).
  - **Table Actions**: Added `View Listing ↗` action for published businesses in `BusinessTableView` and dashboard recent listings.
- **Local Verification**:
  - `npm run lint`: PASS (0 errors)
  - `npm run build`: PASS (all 32 routes compiled cleanly)
  - `git diff --check`: PASS (0 whitespace errors)
  - `npx supabase test db`: PASS (5 suites, 38 tests)
  - `node scripts/verify-email-otp-flow.mjs`: PASS (49/49 checks)
- **Staging Deployment & Verification**:
  - Deployed to staging VPS (`https://listing.rclk.in`) on commit `ed82816`.
  - App container rebuilt and restarted cleanly (`buzl-listing-app-1`).
  - Staging health check (`/api/health`): HTTP 200, `X-Robots-Tag: noindex, nofollow, noarchive`.
  - Staging robots.txt (`/robots.txt`): HTTP 200, `User-Agent: *\nDisallow: /`.
  - Staging sitemap (`/sitemap.xml`): HTTP 200, empty `<urlset>`.
  - Automated staging browser smoke test (`scripts/browser-smoke-test-business-owner-ux.mjs` against `https://listing.rclk.in`): 5/5 suites PASS (100%) across desktop and mobile viewports (375px, 390px, 430px).

## WhatsApp UI Staging Preview (2026-09-18): COMPLETE

- **Task**: `WHATSAPP-UI-PREVIEW`
- **Branch**: `main` (merged from `feature/whatsapp-ui-preview`)
- **Status**: `COMPLETE` (Live delivery remains paused on `feature/whatsapp-otp-auth` pending operator Meta credentials)
- **Scope**: Expose WhatsApp OTP interface on staging login and signup for stakeholder review without enabling live delivery.
- **Key Deliverables**:
  - **Reused Foundation**: Shared provider-neutral phone normalization (`src/lib/whatsapp/phone.ts`) and types (`src/lib/whatsapp/types.ts`).
  - **Auth Tabs Structure**: Updated tab order to `[ Email Code (OTP) ]` (default), `[ WhatsApp OTP ]`, `[ Password ]` across both `/login` and `/signup`.
  - **Explanatory Availability Notice**: Clear notice banner titled "WhatsApp verification is coming soon" explaining OTP delivery is being activated with a direct "Use Email Code →" switch button.
  - **Input Controls**: Country code dropdown with common calling codes (+91 India default) and phone input field, optimized for mobile with `min-w-0` to eliminate horizontal overflow.
  - **No Fake OTP Screens**: Client-side validation ensures phone format correctness; valid numbers present an activation notification pointing to Email OTP / Password, strictly avoiding fake OTP token entry screens.
  - **Brand Tokens**: Built using Buzl primary `#004AAD`, slate text `#2A3547`, and neutral styling without dominant third-party greens.
- **Verification**:
  - `npm run lint`: PASS (0 errors)
  - `npm run build`: PASS (32 routes)
  - `npx supabase test db`: PASS (5 suites, 38 tests)
  - `node scripts/verify-email-otp-flow.mjs`: PASS (49/49 checks)
  - `scripts/browser-smoke-test-business-owner-ux.mjs`: PASS (100% across 375px, 390px, 430px viewports and desktop)

## Staging Team Review (2026-09-18): COMPLETE

- **Task**: `STAGING-TEAM-REVIEW`
- **Branch**: `main`
- **Status**: `COMPLETE`
- **Scope**: Comprehensive product, security, mobile, and UX review of the staging deployment (`https://listing.rclk.in`) on commit `42c06d2`.
- **Review Artifact**: `docs/STAGING_TEAM_REVIEW.md`
- **Key Findings & Verification**:
  - **Staging Indexing Defense**: `/api/health` returns `X-Robots-Tag: noindex, nofollow, noarchive`; `/robots.txt` disallows all crawlers; `/sitemap.xml` provides empty `<urlset>`.
  - **Auth & WhatsApp UI**: Email OTP default active tab; WhatsApp UI tab properly positioned with explanatory coming soon banner, country selector, and input validation without fake token screens; Password login fallback operational.
  - **Owner Journey (8 Steps)**: Traversal verified from details, contact/GBP URL, services, products, media, location, hours/social, to preview. Step 8 Listing Readiness checklist confirmed; creation and review submission triggers pending review toast and persistent pending banner.
  - **Admin Moderation & RBAC**: Pending list review, single-click publish, status badges, and direct `View Public Listing ↗` link verified.
  - **Public Directory & Invariant Privacy**: Verified public listing presentation including NAP, Google CTA, services, and products. Strict zero-data-leakage verified: no `place_id`, no `latitude`/`longitude`, no `PostGIS`, no `member_id`, no `auth email`/`phone`, and service-area private addresses shielded.
  - **Mobile Viewports**: 375px, 390px, and 430px viewports verified with zero horizontal overflow (`scrollWidth === clientWidth`) and comfortable touch target widths.
  - **Review Audit Suite**: `scripts/staging-team-review-audit.mjs` executed against staging with 34/34 checks passing (100%).
- **Product Decisions Cataloged**: 9 architectural product decisions surfaced and documented in `docs/STAGING_TEAM_REVIEW.md` (Product price/URL, gallery image caps, edit re-review behavior, claim listing, website generation, and multi-method OTP).
- **Decision Verdict**: **APPROVED / GO** (0 blocking bugs).

## Form Steps Reorder: Location Step 2 & Contact Step 3 (2026-09-18): COMPLETE

- **Task**: `REORDER-FORM-STEPS-LOCATION-CONTACT`
- **Branch**: `feature/reorder-form-steps-location-contact`
- **Status**: `COMPLETE`
- **Scope**: Reorder the multi-step business listing onboarding form (`BusinessForm.tsx`) so that **Location** is Step 2 and **Contact** is Step 3.
- **Updated Step Sequence**:
  1. **Step 1: Business Details** (Name, Established Year, Description)
  2. **Step 2: Location & Coverage Mode** (Storefront / Service-Area / Hybrid, Google Places verification, Address / Coverage areas)
  3. **Step 3: Contact Information** (Primary Phone, Alternate, WhatsApp, Contact Email with privacy toggle, Website URL, GBP Link)
  4. **Step 4: Primary Category & Services** (Primary category selector, curated services list with descriptions)
  5. **Step 5: Products & Offerings (Optional)** (Product showcase items, descriptions, images)
  6. **Step 6: Media & Photo Gallery** (Logo, Cover photo, Photo gallery)
  7. **Step 7: Business Hours & Social Links** (7-day schedule, social links)
  8. **Step 8: Preview & Submit** (Readiness Summary, Live Public Preview, Draft Save & Submit for Review)
- **Key Deliverables**:
  - `STEPS` constant in `src/components/business/BusinessForm.tsx` reordered to match the new flow.
  - `validateCurrentStep()` updated: Step 2 validates Location requirements, Step 3 validates Contact/Phone/URLs, Step 4 validates Category & Services, Step 5 validates Products.
  - JSX step blocks rearranged into sequential order (1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8).
  - Automated smoke test suites (`scripts/browser-smoke-test-business-owner-ux.mjs`, `scripts/staging-team-review-audit.mjs`) updated to traverse the new step order.
- **Verification Results**:
  - `npm run lint`: PASS (0 errors)
  - `npm run build`: PASS (all 32 routes compiled and optimized cleanly)
  - `git diff --check`: PASS (0 whitespace errors)
  - `npx supabase test db`: PASS (5 suites, 38 tests)
  - `node scripts/verify-email-otp-flow.mjs`: PASS (49/49 checks)

## Platform Admin User Management UX (2026-09-18): COMPLETE & DEPLOYED TO STAGING

- **Task**: `ADMIN-USER-MANAGEMENT-UX`
- **Branch**: `main` (merged via `--no-ff` from `feature/admin-user-management-ux`)
- **Main HEAD**: `8fc99ddd7ad190616e3d46f8d4adadaf6608c3d0`
- **Staging Deployment**: `https://listing.rclk.in` (Container `buzl-listing-app-1` rebuilt and active)
- **Status**: `COMPLETE`
- **Scope**: Expose and improve the Platform Admin User Management experience (`/admin/users`, `/admin/users/new`, `/admin/users/[id]`) with admin navigation discoverability, summary metrics, live search/filtering, responsive mobile stacked cards, dynamic role-conditional invite form, organized user detail page with associated businesses, admin self-protection, last active admin protection, and full automated browser smoke tests.
- **Key Deliverables**:
  - **Admin Navigation (`Sidebar.tsx`)**: Added first-class `Users` (`/admin/users`) and `Add User` (`/admin/users/new`) entries under Platform Admin navigation with active-route highlighting.
  - **Summary Metrics & User List (`UserListClient.tsx`)**: 5 summary metrics cards (Total Users, Business Owners, Buzl Members, Platform Admins, Suspended), live search input (name, email, Buzl Member ID), role filter pills (`All`, `Business Owners`, `Buzl Members`, `Admins`), status dropdown filter, and accessible colored status dots and role badges.
  - **Mobile Responsiveness**: Desktop table paired with mobile stacked card layout for `< md` screens; zero horizontal overflow verified across 375px, 390px, and 430px viewports (`scrollWidth <= clientWidth`).
  - **Dynamic Invite Form (`InviteUserForm.tsx`)**: Breadcrumb navigation (`← Back to Users`), role selector radio cards; conditional Buzl Member ID and Permission Preset select (`Onboarding Member`, `Listing Manager`, None) with human-readable descriptions for Buzl Members; administrator privilege warning for Admins; zero-jargon copy for Business Owners.
  - **User Detail & Management (`ManageUserForm.tsx`, `getUserBusinesses`)**: Profile header with initials avatar, metadata, role/status badges; Admin Self-Protection (disables role/status editing when admin edits own account with warning notice); Last Active Admin Protection (guards against demoting/deactivating the final active administrator); Authentication & Identity Details card; Associated Businesses card (lists businesses managed by user with manager role, city/state, and publication status); Danger Zone with Password Reset and session revocation modal.
  - **Automated Browser Smoke Suite (`scripts/browser-smoke-test-admin-users.mjs`)**: 9 comprehensive test suites validating sidebar navigation, list view, metrics, search, role filters, empty states, invite form conditional fields, user detail management, admin self-protection, modal confirmations, RBAC unauthorized denial (owner/member blocked from admin routes), and mobile viewports.
- **Verification Results**:
  - `npm run lint`: PASS (0 errors)
  - `npm run build`: PASS (all 32 routes compiled and optimized cleanly)
  - `git diff --check`: PASS (0 whitespace errors)
  - `npx supabase test db`: PASS (5 suites, 38 tests)
  - `node scripts/browser-smoke-test-admin-users.mjs`: PASS (all 9 suites pass against live staging https://listing.rclk.in, 100%)
  - Staging Health (`https://listing.rclk.in/api/health`): HTTP 200 `{"status":"ok"}`
  - Staging Indexing Guards: `X-Robots-Tag: noindex, nofollow, noarchive`, `robots.txt: Disallow /`, `sitemap.xml`: empty `<urlset>`
  - Isolation & Zero Interruption: Zero database migrations; no touching of production containers (`buzl-backend-prod`, `buzl-postgres-prod`).

## Admin and Buzl Member Dashboard Capability Audit (2026-09-18): COMPLETE & REVIEW_READY

- **Task**: `ADMIN-INTERNAL-DASHBOARD-AUDIT`
- **Branch**: `main`
- **Status**: `REVIEW_READY`
- **Scope**: Comprehensive read-only product, UX, and permission audit of Platform Admin and Buzl Member dashboards, role model, category management, listing management, moderation, and quality tools.
- **Key Deliverables**:
  - `docs/INTERNAL_DASHBOARD_CAPABILITY_AUDIT.md`: Authoritative audit document covering current architecture, role model, missing capabilities, category management proposal, and phased roadmap.
  - `docs/ADMIN_BUZL_MEMBER_FEATURE_MATRIX.md`: Complete capability, permission, priority (P0-P3), and architecture dependency matrix across Admin, Listing Manager, Onboarding Member, and Business Owner roles.
- **Key Findings**:
  - **Category Management UI is MISSING (P0)**: Database table `public.categories`, RLS policies, foreign keys, and trigger `categories_prevent_published_deactivation` are 100% ready, but zero UI or server actions exist. All taxonomy changes currently require raw SQL.
  - **Moderation Queue Navigation Blindspot (P0)**: Route `/review/businesses` exists with publication permissions for Listing Managers and Admins, but is completely missing from `Sidebar.tsx`.
  - **Platform Admin Dashboard Overview is Missing (P1)**: `/admin` redirects to `/admin/businesses` rather than providing an administrative overview.
- **Runtime Code Changes**: None (strictly read-only analysis).
- **Database Migrations**: None.

## Internal Dashboard Phase A: Navigation & Moderation Queue Discoverability (2026-09-18): COMPLETE & VERIFIED ON STAGING

- **Task**: `INTERNAL-DASHBOARD-PHASE-A`
- **Branch**: `main` (merged from `feature/internal-dashboard-navigation` via `--no-ff`)
- **Feature Commit**: `fcaf704`
- **Merge Commit**: `3a4c7a2`
- **Main HEAD**: `3a4c7a2`
- **Staging HEAD**: `3a4c7a2`
- **Staging URL**: `https://listing.rclk.in`
- **Status**: `COMPLETE`
- **Scope**: Implement Phase A of the internal dashboard enhancements: expose Moderation Queue in role-aware navigation with a pending-review count badge, create a protected review layout shell, fix Listing Manager review/edit discoverability bug, and preserve all existing RBAC invariants.
- **Key Deliverables**:
  - **Role-Aware Navigation (`Sidebar.tsx`)**:
    - **Platform Admin**: Overview (`/dashboard`), All Listings (`/admin/businesses`), Moderation Queue (`/review/businesses` + pending badge), Import Buzl Profile (`/admin/businesses/import`), Users (`/admin/users`), Add User (`/admin/users/new`).
    - **Listing Manager** (`buzl_member` + preset `listing_manager`): Overview (`/dashboard`), Listings (`/dashboard/businesses`), Add Business (`/dashboard/businesses/new`), Moderation Queue (`/review/businesses` + pending badge), Import Buzl Profile (`/admin/businesses/import`). Users & Admin items strictly hidden.
    - **Onboarding Member** (`buzl_member` + preset `onboarding_member`): Overview (`/dashboard`), My Listings (`/dashboard/businesses`), Add Business (`/dashboard/businesses/new`), Import Buzl Profile (`/admin/businesses/import`). Moderation Queue & Users strictly hidden.
    - **Business Owner**: Overview (`/dashboard`), My Businesses (`/dashboard/businesses`), Add Business (`/dashboard/businesses/new`). Internal items strictly hidden.
    - Accurate active-route highlighting for all navigation items with zero overlap.
  - **Pending-Review Badge (`Sidebar.tsx`, `business-actions.ts`)**:
    - Implemented `getPendingReviewCount()` querying `publication_status = 'pending'` with `{ count: 'exact', head: true }`.
    - Zero row payloads; authorized internal callers only (`isAdmin` or `listing.publish`); safe error logging without credential leakage.
    - Compact Buzl amber badge (`bg-[#FFF6DF] text-[#9A6700] border-[#FFE7A8]`): `0` is hidden, `1–99` shows exact number, `100+` shows `99+`.
  - **Review Section Layout (`src/app/review/layout.tsx`)**:
    - Created layout wrapping `/review/*` routes with standard sidebar shell.
    - Server-side authentication check redirects unauthenticated users to `/login?redirect=/review/businesses`.
    - Server-side moderation authorization check redirects unauthorized users (Onboarding Members, Business Owners) to `/dashboard`.
  - **Edit Permission Bug Fix (`BusinessTableView.tsx`, `AdminBusinessRowActions.tsx`)**:
    - Decoupled `canEdit` from delete permissions in `BusinessTableView.tsx`.
    - Explicitly passed `edit: user.permissions.includes('listing.edit')` from authenticated context on `/review/businesses`.
    - Listing Managers can now view listings and edit listing details directly from the moderation queue.
  - **Review Page Polish (`src/app/review/businesses/page.tsx`)**:
    - Title updated to "Moderation Review Queue".
    - Subtitle dynamically displays pending listing count.
    - Explicit moderation permissions provided: publish (`listing.publish`), suspend (`listing.suspend`), edit (`listing.edit`), verify (`false`), delete (`false`).
  - **Targeted Cache Revalidation (`business-actions.ts`)**:
    - Added `revalidatePath('/review/businesses')` across `transitionPublication`, `setVerification`, `deleteBusiness`, `createBusiness`, `updateBusiness`, and `createDraftFromImport`.
  - **Staging Deployment & Verification**:
    - Merged `feature/internal-dashboard-navigation` into `main` (`3a4c7a2`).
    - Staging container `buzl-listing-app-1` rebuilt and recreated on Hostinger staging VPS (`213.210.37.204`). Unrelated Supabase and production containers left untouched (12-day uptime intact).
    - Health check `https://listing.rclk.in/api/health` returned HTTP 200 `{"status":"ok"}`.
    - Live staging verification across all 4 personas (Admin, Listing Manager, Onboarding Member, Business Owner) passed 100%.
    - Staging indexing protections verified (`X-Robots-Tag: noindex, nofollow, noarchive`, `robots.txt: Disallow: /`, empty `sitemap.xml`).
  - **Automated Verification (`scripts/browser-smoke-test-internal-navigation.mjs`)**:
    - 12 comprehensive test suites validating Admin navigation, Listing Manager navigation, Onboarding Member navigation, Business Owner navigation, Direct URL RBAC denial, Listing Manager capabilities, explicit edit authorization, badge formatting, count freshness/revalidation after insert/delete, and mobile viewports (375px, 390px, 430px) passed 100% locally and on live staging.
- **Verification Results**:
  - `npm run lint`: PASS (0 errors)
  - `npm run build`: PASS (all 32 routes compiled and optimized cleanly)
  - `git diff --check`: PASS (0 whitespace errors)
  - `npx supabase test db`: PASS (5 suites, 38 tests pass)
  - `node scripts/browser-smoke-test-internal-navigation.mjs` (local): PASS (12/12 suites pass, 100%)
  - `node scripts/browser-smoke-test-internal-navigation.mjs` (staging): PASS (12/12 suites pass, 100%)
  - `node scripts/browser-smoke-test-admin-users.mjs`: PASS (9/9 suites pass, 100%)
  - `node scripts/browser-smoke-test-business-owner-ux.mjs`: PASS (5/5 suites pass, 100%)
- **Database Migrations**: NONE (0 database schema changes required).

## Internal Dashboard Phase B: Category Management (2026-09-18): COMPLETE & VERIFIED ON STAGING

- **Task**: `CATEGORY-MANAGEMENT`
- **Branch**: `main` (merged from `feature/category-management`)
- **Main HEAD**: `df08d57`
- **Staging URL**: `https://listing.rclk.in`
- **Status**: `COMPLETE` (Merged to main, deployed to staging VPS, and verified live across all 4 personas and mobile viewports)
- **Scope**: Internal Category Management UI & server actions for Platform Admins (taxonomy management) and Buzl Members (read-only reference), URL normalization bugfix, security credential hardening, pgTAP tests, Playwright smoke tests, staging Docker build deployment, and live staging verification. Zero DB migrations.
- **Key Deliverables**:
  - **URL Normalization Fix (`BusinessForm.tsx`, `business-actions.ts`)**:
    - Converted website and social URL inputs from `type="url"` to `type="text"` to eliminate browser native validation blocks on plain domains (e.g. `google.com`).
    - Added automatic `https://` prefixing on blur, step transition, and before saving.
    - Server-side normalization in `business-actions.ts` before inserting or updating listings in PostgreSQL.
  - **Staging Credential Hygiene & Security Gate 0 (PASS)**:
    - Rotated fixture passwords on staging VPS container using bcrypt.
    - Enabled `/api/internal/demo-credentials` on staging for prototype testing while strictly blocking production (HTTP 404).
    - Removed fallback plaintext passwords across all test scripts in `scripts/`.
  - **Category Taxonomy Management UI (`/admin/categories`, `CategoryManagementView.tsx`)**:
    - Summary metrics cards: Total, Active, Inactive, Top-Level, and In Use.
    - Live search by category name, slug, or parent name.
    - Status (`All`, `Active`, `Inactive`) and Hierarchy (`All`, `Top-Level`, `Subcategories`) filters.
    - Desktop table with tree indentation indicators, monospace slug tags, hierarchy badges, sort order, listings usage badges (`X pub / Y tot`), active/inactive status badges, and action controls.
    - Responsive mobile stacked cards for screens `< md` with zero horizontal overflow (tested across 375px, 390px, 430px).
    - Role-adaptive interface: Platform Admins have full management controls (`Add Category`, `Edit`, `Deactivate`/`Activate`); Listing Managers and Onboarding Members have a read-only reference view with "Read-Only Reference" badge and "View only" row labels. Business Owners and unauthenticated users are strictly denied.
  - **Accessible Modals & Safety Guards**:
    - Accessible Create/Edit Modal with auto-slug generation, parent dropdown (excluding self and descendants to prevent circular hierarchies), sort order, and active toggle.
    - Deactivation confirmation modal: blocks deactivating any category currently referenced by published listings, providing clear guidance and disabling the confirm button.
  - **Server Actions & Database Integrity (`src/lib/category-actions.ts`)**:
    - `listCategories()`: aggregated listing counts, hierarchy parent mapping, summary metrics calculation.
    - `createCategory()`: server-side name length (1–100), slug regex, duplicate slug uniqueness check, parent category active verification, path revalidation.
    - `updateCategory()`: name/slug validation, self-parent and circular descendant traversal detection, published listing deactivation guard with user-friendly error catching PostgreSQL trigger exception.
    - `toggleCategoryActive()`: toggles category state with identical published listing safety guard.
  - **Staging Deployment & Verification**:
    - Built production image with project flag `-p buzl-listing` ensuring image `buzl-listing-app` matches the latest commit (`df08d57`).
    - Recreated container `buzl-listing-app-1` on Hostinger staging VPS (`213.210.37.204`). Traefik proxy and network aliases intact.
    - Health endpoint `https://listing.rclk.in/api/health` confirmed HTTP 200 `{"status":"ok"}` with `X-Robots-Tag: noindex, nofollow, noarchive`.
    - Live staging automated verification (`scripts/browser-smoke-test-category-management.mjs`): 13/13 suites passed (100%).
    - Live staging regression verification: internal navigation (12/12 suites pass), admin user management (9/9 suites pass), business owner UX (5/5 suites pass).
- **Verification Results**:
  - `npm run lint`: PASS (0 errors)
  - `npm run build`: PASS (all 33 routes compiled cleanly with Turbopack)
  - `npx supabase test db`: PASS (6 suites, 43 tests pass)
  - `node scripts/browser-smoke-test-category-management.mjs` (local): PASS (13/13 suites pass, 100%)
  - `node scripts/browser-smoke-test-category-management.mjs` (staging): PASS (13/13 suites pass, 100%)
  - `node scripts/browser-smoke-test-internal-navigation.mjs` (staging): PASS (12/12 suites pass, 100%)
  - `node scripts/browser-smoke-test-admin-users.mjs` (staging): PASS (9/9 suites pass, 100%)
  - `node scripts/browser-smoke-test-business-owner-ux.mjs` (staging): PASS (5/5 suites pass, 100%)
- **Database Migrations**: NONE (0 database schema changes required).

### Internal Dashboard Phase C: Listing ID System (2026-09-18): MERGED & VERIFIED LIVE

- **Task**: LISTING-ID-SYSTEM
- **Branch**: feature/listing-id-system (merged to main at commit `c6a3558`)
- **Status**: COMPLETE
- **Scope**: Implemented a permanent human-readable Buzl Listing ID system (e.g., BZL-000001) using a PostgreSQL sequence allocator (MAXVALUE 999999) to ensure uniqueness, monotonicity, and immutability.
- **Key Deliverables**:
  - **Database Migration (`20260918140000_listing_id_system.sql`)**: 
    - Created sequence `business_listing_code_seq` (1 to 999999, NO CYCLE).
    - Added `listing_code` column with CHECK constraint (`^BZL-[0-9]{6}$`).
    - Deterministic backfill applied to existing records ordered by `created_at ASC`, `id ASC`.
    - INSERT trigger automatically forces assignment from the sequence, completely bypassing manual caller inputs.
    - UPDATE trigger enforces immutability, rejecting any change to `listing_code`.
  - **pgTAP Test Coverage (`listing_id_system_runtime.sql`)**:
    - Added 20 new pgTAP tests specifically covering the sequence constraints, trigger behaviors, manual injection protections, null-update rejections, and backfill validation.
  - **UI Integration**:
    - Dashboard listing overview table displays `listing_code` in a monospace badge and supports exact/partial ID search.
    - Business edit form (`BusinessForm.tsx`) presents a read-only badge with a one-click copy button for existing listings.
    - Admin `ManageUserForm` displays `listing_code` badges in the associated businesses list.
    - Internal dashboard routing preserves listing URL and query parameters.
  - **Smoke Testing (`browser-smoke-test-listing-id.mjs`)**:
    - Dedicated Playwright smoke test script verifies rendering, searchability, and copy functionality across Admin, Listing Manager, and Business Owner personas, including mobile viewport tests and staging fixture invariants.
- **Verification Results**:
  - `npm run lint`: PASS (0 errors)
  - `npm run build`: PASS (all 33 routes compiled cleanly)
  - `git diff --check`: PASS
  - `npx supabase test db`: PASS (7 suites, 63 tests pass)
  - `node scripts/browser-smoke-test-listing-id.mjs` (local & staging): PASS (All suites passed)
- **Database Migrations**: 1 new migration added (`20260918140000_listing_id_system.sql`).

## Admin and Member Operational Dashboard Phase 1 (2026-09-18): MERGED & VERIFIED LIVE

- **Task**: ADMIN-AND-MEMBER-DASHBOARD-P1
- **Branch**: `feature/admin-member-dashboard-p1` (merged to `main` at `522cfe9`)
- **Status**: COMPLETE
- **Commits**:
  - Feature Commit: `6d0b565`
  - Review Commit: `95d1229`
  - Merge Commit: `522cfe9`
  - Main HEAD: `522cfe9`
  - Staging HEAD: `522cfe9`
- **Scope**: Implemented first useful operational dashboard on `/dashboard` for Platform Admin, Buzl Listing Manager, and Buzl Onboarding Member, while strictly preserving the current Business Owner experience. Built entirely on existing schema with zero new migrations and zero external charting dependencies.
- **Key Deliverables**:
  - **Role-Aware Dashboard Routing (`src/app/dashboard/page.tsx`)**:
    - Dispatches to specialized server views based on authenticated user role and permission preset.
    - Preserves Business Owner isolation: Business Owners only see their own listings and owner KPI cards (`OwnerDashboardView.tsx`).
  - **Platform Admin View (`src/components/dashboard/AdminDashboardView.tsx`)**:
    - 6 operational KPI cards: Total Listings, Pending Review, Published Listings, Draft Listings, Verified Listings, and Unverified Listings (with secondary Suspended indicator).
    - Quick Actions grid linking directly to active routes: All Listings, Moderation Queue, Categories, Users, Import Buzl Profile, and Add Business.
    - Moderation Preview widget for pending listings with monospace `BZL-` badges.
    - Needs Attention widget surfacing data-quality issues: missing address/coordinates on storefront/hybrid, missing service areas on service-area/hybrid, missing logo, missing Google Business Profile, and unverified status.
    - Recent Listings widget and Category Overview widget.
  - **Listing Manager View (`src/components/dashboard/ListingManagerDashboardView.tsx`)**:
    - 4 operational KPIs: Pending Review, Published, Suspended, Unverified.
    - Quick Actions focused on review, listings, import, categories (user governance excluded).
    - Dedicated widgets: Pending Review queue, Listings Requiring Attention, Recent Listings.
  - **Onboarding Member View (`src/components/dashboard/OnboardingMemberDashboardView.tsx`)**:
    - 4 onboarding KPIs: Draft Listings, Pending Review, Published Listings, Listings Requiring Completion.
    - Quick Actions for onboarding, drafting, import, and category reference (moderation queue excluded).
    - Dedicated widgets: Incomplete Draft Listings, Recently Submitted, My Recent Listings.
  - **Reusable Widget System (`src/components/dashboard/widgets/`)**:
    - `KpiCard.tsx`, `QuickActionsWidget.tsx`, `PendingReviewWidget.tsx`, `NeedsAttentionWidget.tsx`, `RecentListingsWidget.tsx`, `CategoryOverviewWidget.tsx`.
    - Monospace `BZL-XXXXXX` badges for Listing IDs.
    - Strict data privacy: no internal UUIDs or contact emails exposed.
    - Mobile-responsive layouts tested across 375px, 390px, 430px viewports with zero horizontal overflow.
  - **Efficient Data Access Layer (`src/lib/dashboard-data.ts`)**:
    - Parallel exact head queries for KPI counts (0 byte body payload).
    - PostgREST relational single-query fetching for listings with services, service areas, and media (no N+1 loops).
    - Category listing distribution metrics powered by `listCategories()`.
- **Staging Deployment & Verification**:
  - Pulled `main` on Hostinger staging VPS (`213.210.37.204`) at `/opt/buzl-listing/app` (HEAD: `522cfe9`).
  - Built image `buzl-listing-app` via `docker compose -p buzl-listing -f docker-compose.yml -f docker-compose.app.yml build app`.
  - Recreated container `buzl-listing-app-1` cleanly without touching unrelated containers.
  - Staging Health endpoint `https://listing.rclk.in/api/health` confirmed HTTP 200 `{"status":"ok"}`.
  - Staging Demo Credentials endpoint `https://listing.rclk.in/api/internal/demo-credentials` confirmed HTTP 200.
  - Staging Indexing Guards confirmed (`X-Robots-Tag: noindex, nofollow, noarchive`, `robots.txt: Disallow: /`, empty sitemap).
- **Verification Results**:
  - `npm run lint`: PASS (0 errors)
  - `npm run build`: PASS (all 33 routes compiled cleanly with Turbopack)
  - `git diff --check`: PASS
  - `npx supabase test db`: PASS (7 suites, 63 tests pass)
  - `node scripts/browser-smoke-test-dashboard-p1.mjs` (Local & Live Staging): PASS (5 suites, 17 assertions pass, 100%)
  - Regression Suites (Local & Live Staging):
    - `node scripts/browser-smoke-test-category-management.mjs`: PASS (13/13 suites pass, 100%)
    - `node scripts/browser-smoke-test-internal-navigation.mjs`: PASS (12/12 suites pass, 100%)
    - `node scripts/browser-smoke-test-admin-users.mjs`: PASS (9/9 suites pass, 100%)
    - `node scripts/browser-smoke-test-business-owner-ux.mjs`: PASS (5/5 suites pass, 100%)
    - `node scripts/browser-smoke-test-listing-id.mjs`: PASS (6/6 suites pass, 100%)
- **Database Migrations**: NONE (0 schema changes required).
