# Changelog

All notable changes to Buzl Listing are documented here.

This project uses semantic versioning. Version `0.1.0` is the first complete local MVP baseline; it is not a production deployment.

## [Unreleased]

### Google Places Location Integration — 2026-09-17

- **Feature Branch**: `feature/google-places-location` based on `main @ c8f67b8`.
- **Google Places Search**: Replaced manual latitude/longitude typing in Step 6 (Location) of the business create/edit UX with an accessible, debounced Google Places autocomplete and details lookup.
- **Provider Abstraction Layer**:
  - Defined provider contracts (`PlacesProvider`, `PlaceSuggestion`, `NormalizedPlaceDetails`).
  - Created `GooglePlacesProvider` with strict server-side HTTP client, 6s timeout, and API key protection.
  - Implemented `MockPlacesProvider` with deterministic Indian (Chennai, Bengaluru, Delhi, Coimbatore, Munnar) and international (London) locations for testing.
  - Built factory `getPlacesProvider()` with strict production safeguards (mock strictly forbidden in production; fails safely to `NOT_CONFIGURED` without mock in staging/production).
- **Secure API Proxy Routes**:
  - `GET /api/places/autocomplete`: Authenticated session check (`getSessionUser()`), active account verification, bounded query (2..100 chars), `Cache-Control: private, no-store`.
  - `GET /api/places/details`: Authenticated session check, active account verification, bounded placeId (max 255 chars, strict regex), `Cache-Control: private, no-store`.
- **Database Migration & Schema**:
  - Applied migration `20260917200000_google_places_location.sql` adding `place_id text` with check constraint (max 255 chars) and partial index `businesses_place_id_idx` to `public.businesses`.
  - Granted `update (place_id)` to `authenticated`.
  - Updated `create_business_for_current_user` RPC with `p_place_id text default null`.
- **Canonical Identity & Privacy Invariants**:
  - Selecting a Google Place never overwrites `canonical_name`.
  - Service-area listings maintain 100% privacy (street address and coordinates suppressed).
  - Legacy listings without `place_id` remain valid, editable, and publishable.
- **Verification & Testing**:
  - 100% passing pgTAP suite (`google_places_location_runtime.sql`, 5 files, 38 tests, 0 failures).
  - 100% passing automated flow test (`scripts/verify-google-places-flow.mjs`).
  - 100% passing Playwright browser smoke test (`scripts/browser-smoke-test-places.mjs`).
  - Independent security review passed (PASS_WITH_NOTES, 0 critical / 0 high findings).
  - Applied defense-in-depth hardening: added `sessionToken` bounds and format validation in API proxy routes, added coordinate boundary validation in `updateBusiness`, and enhanced production environment detection in `getPlacesProvider()`.
  - Production build (`npm run build`) and ESLint (`npm run lint`) clean with 0 errors.

### Staging handoff checkpoint — 2026-09-14

- Canonical `main`, `origin/main`, and deployed staging are aligned at `15539b9` (`fix(deploy): provide server admin key to staging app`).
- Verified Docker packaging, deterministic local auth fixtures, staging/production separation, RBAC and account-status enforcement, Admin User Management, public Business Owner signup, Listing Manager moderation/publish controls, public regression coverage, and staging noindex protections.
- The remaining verification is intentionally limited to the real-browser staging Owner flow: draft → submit → pending, including owner publish denial, pending visibility for Listing Manager/Admin, and anonymous pending invisibility.
- Completed the real-browser staging moderation verification. The isolated active Listing Manager test persona can access the pending queue and publish the verification listing; the Onboarding Member and Business Owner remain unable to publish, and Admin access remains available.

### Business Profile Expansion Staging Deployment — 2026-09-17

- **Feature Branch Merged**: `feature/business-profile-expansion` merged cleanly into `main` (`b656802`).
- **Database Migration Applied**: Migration `20260917190000_business_profile_expansion.sql` applied to isolated staging Supabase (`buzl-listing-db-1`).
  - Added `service_description` column and max 20 limit trigger on `business_services`.
  - Created `public.business_products` table with RLS and max 20 limit trigger.
  - Added partial unique index for singleton logo and cover in `business_media`.
  - Configured `business-media` storage bucket with manager-only write and public CDN read policies.
  - Added `google_business_profile_url` column to `businesses`.
  - Updated `get_published_business_by_slug` to safely project products, gallery, and GBP URL.
- **Staging App Rebuilt & Deployed**: Rebuilt and deployed Next.js container `buzl-listing-app-1` on Hostinger staging VPS (`213.210.37.204`) serving `https://listing.rclk.in`.
- **Infrastructure Safety**: Unrelated Supabase stack (`supabase-db`, `supabase-kong`, `buzl-backend-prod`) completely untouched with uninterrupted 12-day uptime.
- **Staging Verification**: 37/37 automated Playwright browser smoke tests passing on live staging:
  - Owner services (name + description, max 20 limit)
  - Owner products (name + description, max 20 limit)
  - Logo, Cover, and Gallery upload to Supabase storage bucket
  - Google Business Profile URL persistence and "View on Google" rendering
  - Public listing rendering with zero coordinate or private address leaks for service-area listings
  - Security isolation: Owner denied admin routes; Member denied user management; Anonymous redirected to login.
- **Staging Protection Guards**: Verified `/api/health` 200 OK, `APP_ENV=staging`, `X-Robots-Tag: noindex, nofollow, noarchive`, `robots.txt` Disallow: /, and empty `sitemap.xml`.

### Boss Review Scope Update — 2026-09-17

Documentation-only. No code, migration, or deployment changes.

- **Gallery** approved for upcoming implementation (previously deferred as OD-05). Image limit requires product decision.
- **Products** (max 20) approved as new business profile feature: name, description, image. Optional price/URL require product decision.
- **Services** expanded: name + description, max 20 per business (previously name-only, OD-02 revised).
- **Google Places search** approved to replace manual latitude/longitude entry in UI. API details pending provider configuration.
- **Email OTP** approved as authentication method. Provider/config pending provider configuration.
- **WhatsApp OTP** approved as authentication method. Provider/config pending approved messaging provider configuration.
- **Google Business Profile URL** approved as new public-facing field.
- **Google OAuth** paused — requires product confirmation (Boss review prioritized OTP methods).
- **Automatic website generation** recorded as future product direction only.
- Formal decision revisions recorded: DEC-024 through DEC-032.

## [0.1.0] - 2026-09-12

### Added

- Next.js App Router application with TypeScript, Tailwind CSS, and Buzl design tokens.
- Supabase-backed business-directory schema, three versioned migrations, PostGIS readiness, PostgreSQL full-text search, and `pg_trgm` indexes.
- Row-level security, role-aware database helpers, and narrowly granted RPCs for public, owner, Buzl Member, and administrator workflows.
- Business Owner authentication, dashboard, business CRUD, multi-section form, validation, duplicate warnings, public-safe preview, and pending-submission flow.
- Listing modes for storefront, service-area, and hybrid businesses, including hours, services, media references, social links, and slug history.
- Buzl Member identity (`member_id`) and an internal JSON import workflow with schema validation, legacy-data adapter, category review, provenance, duplicate checks, and privacy controls.
- Administrator moderation interface for publication, suspension, and verification status.
- Public homepage, canonical business pages, search, category discovery, location discovery, approved category/location combination pages, redirects, sitemap, robots, Open Graph metadata, BreadcrumbList, and LocalBusiness JSON-LD.
- Browser smoke checks for owner, Buzl Member, administrator, public, and mobile flows, plus local workflow and database verification scripts.

### Security and privacy

- Default-deny database boundary: public and authenticated base-table permissions are revoked; data access occurs through RLS and explicit RPC grants.
- Public directory data is restricted to published businesses and public-safe projections.
- Service-area addresses and private coordinates are excluded from public pages, JSON-LD, metadata, search, discovery, and public RPC responses.
- Auth email, member ID, source identifiers, and normalized matching fields remain internal.
- Publication transitions, verification changes, category deactivation, and related-record reassignment are protected in the database.
- Staging safeguards: noindex/nofollow HTML metadata, `X-Robots-Tag: noindex, nofollow, noarchive`, disallow-all `robots.txt`, and an empty sitemap.
- Staging seed tooling requires explicit staging intent, operator confirmation, an exact project-ref match, environment-provided credentials, and idempotent records.

### Documentation

- Locked the Phase 1 product decisions, Phase 2.1 Business Field Matrix, Phase 2.2 User Journeys, and Rapid MVP Build Contract.
- Added the staging review package, environment-variable reference, deployment prerequisites, and rollback guidance.
- Added this developer README and changelog.

### Known limitations

- Staging is deployed and remains protected from indexing; production release infrastructure is not configured.
- Google login, WhatsApp login, claims, reviews, payments, bookings, radius search, and advanced analytics are deferred.
- A map/geocoder provider remains intentionally undecided and provider-neutral.

[0.1.0]: https://github.com/mahe-pkm/Buzl_listings/releases/tag/mvp-review-baseline
