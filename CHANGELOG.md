# Changelog

All notable changes to Buzl Listing are documented here.

This project uses semantic versioning. Version `0.1.0` is the first complete local MVP baseline; it is not a production deployment.

## [Unreleased]

### Auth V2 Phase 3 Business Contact Email verification — local review 2026-09-20

- Added protected Business Contact Email verification requests for active business managers with normalized-email validation, cryptographically random opaque tokens, SHA-256-only persistence, challenge replacement, resend throttling, and 30-minute expiry.
- Added server-only SMTP delivery without selecting a vendor; credentials stay in server environment variables and failed sends remove the unusable challenge.
- Added the `/verify-business-email` confirmation route with transactional single-use consumption, replay/expiry/email-change denial, generic failure responses, and an authenticated resend path.
- Added explicit Business Email verification UI to owner editing/readiness and internal moderation views without conflating it with Listing Verification. Resolved UX ambiguity by replacing `(Optional)` with `Business Contact Email (Required before submission)`, clarifying that draft saving is allowed without verification while submission requires verified contact email, and rendering all 4 status states (`Required before submission`, `Verification required`, `Verification email sent`, `Verified`).
- Ensured verification links are environment-aware (`http://localhost:3000` fallback in local dev, `https://listing.rclk.in` in staging) with opaque token query parameter only and no private identifier exposure.
- Kept draft saves available while disabling owner review submission until the contact email is verified; the PostgreSQL submission gate remains authoritative.
- Added a clearly named, confirmation-gated Admin action to mark a Business Contact Email verified. Buzl Members receive no new authority.
- Added 14 focused database assertions (111 total passing), a mail/token/URL contract check, mobile checks at 375/390/430, invalid-link browser verification, lint/build, and diff validation.
- Local implementation only; staging and production remain unchanged. Real inbox delivery is the next local E2E gate after SMTP configuration.

### Auth V2 Phase 2 WhatsApp-first authentication — local checkpoint 2026-09-20

- Made WhatsApp the default public login/signup method while preserving Email Code and Password as working secondary methods.
- Added one Supabase-controlled phone flow for both new and existing Business Owners, including E.164 normalization, masked OTP destination, six-digit verification, safe errors, change-number support, and resend cooldown.
- Added trusted post-auth profile resolution and explicit onboarding routing through `profiles.onboarding_completed_at`.
- Added a protected `/onboarding` experience that reuses the existing business editor and completes onboarding only through `complete_user_onboarding()` after the first valid business draft is saved.
- Preserved role safety and private-credential boundaries: public clients cannot choose privileged metadata, internal routes remain guarded, and Auth phone/email are not copied to business contacts.
- Added contract tests and no-send browser smoke coverage at 375px, 390px, and 430px. Lint, production build, all 97 pgTAP tests, and diff checks pass.
- No live OTP, staging deployment, or production change was performed. The existing local phone-only artifact remains untouched pending explicit cleanup approval and a controlled real E2E.
- CAPTCHA is still required before public staging release. Business-email delivery and optional Auth credential settings remain deferred to Phase 3.

### Auth V2 Phase 1 database foundation — review ready 2026-09-20

- Added the migration foundation for explicit onboarding completion and mandatory business-contact-email verification before review submission.
- Added a private, RLS-protected verification-challenge table using unique SHA-256 token hashes, expiry/single-use constraints, and a service-role-only transactional consumption function.
- Added admin-only manual contact-email verification and protected both onboarding and verification timestamps from direct client updates.
- Preserved legacy published listings without falsely backfilling verification: structural integrity remains enforced for existing published rows while new pending/published transitions require verified contact email.
- Added a focused 34-assertion pgTAP suite and updated affected existing fixtures.
- The migration was applied to the existing local Supabase database without reset. All 8 pgTAP files / 97 tests, lint, production build, mutation guards, and diff checks pass.
- Audited the preserved local data: 12 published and 1 pending listing have no trusted business-email verification evidence, so no verification timestamp was backfilled. Existing published rows remain operational; future transitions use the stricter gate.
- Confirmed the earlier phone-only local artifact has an unconfirmed Auth user and profile but no business relationship. It remains undeleted for review before V2 E2E testing.

### Authentication Architecture V2 — approved 2026-09-20

- Locked WhatsApp OTP as the default public Business Owner signup and login method, with Supabase Auth remaining the OTP, identity, verification, and session authority and Meta remaining delivery-only through the signed Send SMS Hook.
- Locked least-privilege public provisioning: an unknown verified phone may create only an active `business_owner`; admins, Buzl Members, and the Listing Manager permission preset remain invitation/admin-controlled.
- Preserved separation between private Auth phone/email credentials and public business contact fields, and between account lifecycle, listing publication, and listing verification.
- Designed mandatory business-contact-email verification before review submission, same-UID optional Auth email/password, explicit onboarding-state routing, anti-abuse controls, and phased implementation requirements.
- Confirmed one user to many businesses is already supported and removed the need for a parallel phone-link registry for normal Business Owners.
- Preserved the existing WhatsApp staging delivery checkpoint; this entry records architecture only and includes no runtime, schema, deployment, staging, or production change.
- Full decision: `docs/AUTH_ARCHITECTURE_V2.md`.
- Independent review approved the identity, public-signup, role-provisioning, privilege-escalation, RLS, and migration design. Phase 1 database work must preserve existing listings without falsely backfilling business-email verification.

### Admin & Member Operational Dashboard Phase 1 (ADMIN-AND-MEMBER-DASHBOARD-P1) — 2026-09-18

- **Feature Branch**: `feature/admin-member-dashboard-p1` (Merged to `main` at `522cfe9`).
- **Feature Commit**: `6d0b565`, **Review Commit**: `95d1229`, **Merge Commit**: `522cfe9`, **Main HEAD**: `522cfe9`, **Staging HEAD**: `522cfe9`.
- **Status**: COMPLETE & Verified Live on Staging (`https://listing.rclk.in`).
- **Scope**: Implemented role-aware operational dashboard experience on `/dashboard` for Platform Admin, Listing Manager, and Onboarding Member, while preserving the exact Business Owner dashboard experience. 100% existing schema, zero new database migrations, zero charting/analytics dependencies.
- **Role-Aware Operational Views (`/dashboard`, `src/app/dashboard/page.tsx`)**:
  - **Platform Admin (`AdminDashboardView.tsx`)**:
    - 6 primary operational KPI cards: Total Listings, Pending Review, Published Listings, Draft Listings, Verified Listings, and Unverified Listings (with secondary Suspended indicator).
    - Quick Actions grid (6 real routes): All Listings (`/admin/businesses`), Moderation Queue (`/review/businesses`), Categories (`/admin/categories`), Users (`/admin/users`), Import Buzl Profile (`/admin/businesses/import`), Add Business (`/dashboard/businesses/new`).
    - Pending Review Widget: Bounded table showing business name, monospace Listing ID (`BZL-XXXXXX`), category, location, and submitted/updated date with "View Moderation Queue →" CTA.
    - Needs Attention Widget: Data-quality inspector detecting missing address/coordinates on storefront/hybrid listings, missing service areas on service-area/hybrid listings, missing logos, missing Google Business Profile URLs, and unverified status.
    - Recent Platform Listings: Recent system-wide businesses with publication & verification badges and "Manage →" links.
    - Top Categories Overview: Category usage overview by listing count leveraging existing taxonomy metrics.
  - **Listing Manager (`ListingManagerDashboardView.tsx`)**:
    - 4 operational KPIs: Pending Review, Published, Suspended, Unverified.
    - Quick Actions: Moderation Queue, Listings, Add Business, Import Buzl Profile, Categories.
    - Users and system governance controls are strictly hidden.
    - Widgets: Pending Review, Listings Requiring Attention, Recent Listings.
  - **Onboarding Member (`OnboardingMemberDashboardView.tsx`)**:
    - 4 onboarding KPIs: Draft Listings, Pending Review, Published Listings, Listings Requiring Completion.
    - Quick Actions: Add Business, Import Buzl Profile, My Listings, Categories.
    - Moderation Queue and direct publication/suspension controls are strictly hidden.
    - Widgets: Incomplete Draft Listings, Recently Submitted, My Recent Listings.
  - **Business Owner (`OwnerDashboardView.tsx`)**:
    - Preserved exact existing Business Owner UX with owner's managed listings, Total Businesses, Published, Pending Review, and Drafts cards.
    - Zero exposure to platform statistics, moderation queue, user management, or internal operations.
- **Server Data Access & Performance (`src/lib/dashboard-data.ts`)**:
  - Exact head count queries running in parallel with 0 payload overhead.
  - Single joined relational queries for media, services, and service areas via PostgREST relationships avoiding N+1 loops.
  - Strict privacy protections: zero UUIDs or sensitive credentials exposed in visible dashboard widgets.
- **Automated Verification**:
  - Dedicated smoke test `scripts/browser-smoke-test-dashboard-p1.mjs` verifying Admin KPIs, Quick Actions, Pending Reviews, Needs Attention, Recent Listings, Category Overview, Listing Manager moderation/governance isolation, Onboarding Member draft focus, Owner isolation, Listing ID rendering, and mobile responsive viewports (375px, 390px, 430px) passes 100%.
  - 100% pass across all regression suites: Category Management, Internal Navigation, Admin User Management, Business Owner UX, Listing ID system, and 63 pgTAP tests.
- **Database Migrations**: None (0 schema changes).


### Internal Dashboard Phase B: Category Management — 2026-09-18

- **Feature Branch**: `feature/category-management`.
- **Status**: Implemented & Verified locally; ready for staging deployment and review.
- **Scope**: Internal Category Management UI & server actions for Platform Admins (taxonomy management) and Buzl Members (read-only reference), URL normalization fix, security credential hardening, pgTAP tests, and Playwright smoke tests. Zero DB migrations.
- **Category Taxonomy Management UI (`CategoryManagementView.tsx`, `/admin/categories`)**:
  - Top summary cards: Total Categories, Active Categories, Inactive Categories, Top-Level Categories, and Categories In Use.
  - Live search input matching category name, slug, or parent name.
  - Filters for Status (`All`, `Active Only`, `Inactive Only`) and Hierarchy (`All Levels`, `Top-Level Only`, `Subcategories Only`).
  - Desktop table view with subcategory tree indentation indicators, monospace slug tags, hierarchy badges, sort order, listings usage counters (`X pub / Y tot`), active/inactive status badges, and action controls.
  - Mobile stacked card view for viewports `< md` with zero horizontal scroll overflow.
  - Role-adaptive interface: Platform Admins have full management controls (`Add Category`, `Edit`, `Deactivate`/`Activate`); Listing Managers and Onboarding Members have a read-only reference view with "Read-Only Reference" badge and "View only" row labels. Business Owners and unauthenticated users are strictly denied.
- **Accessible Modals & Guard Rails**:
  - Accessible Create & Edit Category modal with auto-slug generation from name, parent selector (filtering out self and descendants to prevent circular hierarchies), sort order, and active toggle.
  - Deactivation safety dialog: blocks deactivation if any published listings reference the category with clear guidance, and safely allows deactivation if only 0 published listings exist.
- **Server Actions & Database Integrity (`category-actions.ts`)**:
  - `listCategories()`: aggregated listing counts, hierarchy parent mapping, summary metrics calculation.
  - `createCategory()`: server-side name length (1–100), slug regex, duplicate slug uniqueness check, parent category active verification, path revalidation.
  - `updateCategory()`: name/slug validation, self-parent and circular descendant traversal detection, published listing deactivation guard with user-friendly error catching PostgreSQL trigger exception.
  - `toggleCategoryActive()`: toggles category state with identical published listing safety guard.
- **URL Normalization Fix (`BusinessForm.tsx`, `business-actions.ts`)**:
  - Auto-normalizes inputs for `website_url`, `google_business_profile_url`, and social URLs (`facebook_url`, `instagram_url`, `linkedin_url`, `youtube_url`) by prepending `https://` on blur and form transition.
  - Converted inputs from `type="url"` to `type="text"` to eliminate browser native validation blocks on plain domains (e.g. `google.com`).
  - Server-side normalization in `business-actions.ts` before database writes.
- **Security & Staging Credential Hygiene**:
  - Rotated staging test credentials on VPS database container using bcrypt.
  - Restricted `/api/internal/demo-credentials` to development only (returns HTTP 404 on staging and production).
  - Stripped fallback plaintext password literals across all test scripts.
- **Automated Verification**:
  - `supabase/tests/category_management_runtime.sql`: 5 pgTAP tests verifying RLS policies, slug uniqueness, and `categories_prevent_published_deactivation` trigger pass 100%.
  - `scripts/browser-smoke-test-category-management.mjs`: 13 comprehensive Playwright suites covering Admin management, Listing Manager read-only, Onboarding Member read-only, Business Owner denial, search/filter, category creation, duplicate slug rejection, editing, deactivation safety guard, unreferenced deactivation/reactivation, and mobile viewports (375px, 390px, 430px) pass 100%.
- **Database Migrations**: None (0 schema changes).

### Internal Dashboard Phase A: Navigation & Moderation Queue Discoverability — 2026-09-18

- **Feature Branch**: `feature/internal-dashboard-navigation` merged into `main` (`3a4c7a2`).
- **Scope**: Expose Moderation Queue in role-aware navigation with pending-review count badge, add protected `/review` layout shell, fix Listing Manager review/edit discoverability bug, and preserve all RBAC security invariants.
- **Role-Aware Navigation & Discoverability (`Sidebar.tsx`)**:
  - Moderation Queue (`/review/businesses`) exposed to Platform Admins and Listing Managers with live pending-review count badge.
  - Tailored views per role:
    - *Platform Admin*: Overview, All Listings (Admin), Moderation Queue, Import Buzl Profile, Users, Add User.
    - *Listing Manager*: Overview, Listings, Add Business, Moderation Queue, Import Buzl Profile (Users hidden).
    - *Onboarding Member*: Overview, My Listings, Add Business, Import Buzl Profile (Moderation Queue and Users hidden).
    - *Business Owner*: Overview, My Businesses, Add Business (Internal sections hidden).
- **Pending Review Count Badge & Data Access (`business-actions.ts`, `Sidebar.tsx`)**:
  - Implemented `getPendingReviewCount()` querying `publication_status = 'pending'` using `{ count: 'exact', head: true }`.
  - Zero row payloads; authorized internal callers only (`isAdmin` or `listing.publish`); safe error logging without credential leaks.
  - Formatted badge: hidden on `0`, exact count for `1–99`, `99+` for `100+`, rendered in compact Buzl amber pill badge styling.
- **Protected Review Layout (`src/app/review/layout.tsx`)**:
  - Layout shell rendering the standard sidebar navigation.
  - Enforces server-side authentication redirecting unauthenticated users to `/login?redirect=/review/businesses`.
  - Enforces server-side moderation authorization redirecting unauthorized users (Onboarding Members, Business Owners) to `/dashboard`.
- **Edit Permission Bug Fix (`BusinessTableView.tsx`, `AdminBusinessRowActions.tsx`)**:
  - Decoupled `canEdit` from deletion permissions in `BusinessTableView.tsx`.
  - Explicitly passed `edit: user.permissions.includes('listing.edit')` from authenticated context.
  - Listing Managers can now view listings and edit listing details directly from the moderation queue.
- **Targeted Cache Revalidation (`business-actions.ts`)**:
  - Added targeted revalidation for `/review/businesses` on `transitionPublication`, `setVerification`, `deleteBusiness`, `createBusiness`, `updateBusiness`, and `createDraftFromImport`.
- **Staging Deployment & Verification**:
  - Merged `feature/internal-dashboard-navigation` into `main` (`3a4c7a2`).
  - Staging container `buzl-listing-app-1` rebuilt and recreated on Hostinger staging VPS (`213.210.37.204`). Unrelated Supabase and production containers left untouched (12-day uptime intact).
  - Health check `https://listing.rclk.in/api/health` returned HTTP 200 `{"status":"ok"}`.
  - Live staging verification across all 4 personas (Admin, Listing Manager, Onboarding Member, Business Owner) passed 100%.
  - Staging indexing protections verified (`X-Robots-Tag: noindex, nofollow, noarchive`, `robots.txt: Disallow: /`, empty `sitemap.xml`).
- **Automated Verification (`scripts/browser-smoke-test-internal-navigation.mjs`)**:
  - 12 comprehensive test suites validating Admin navigation, Listing Manager navigation, Onboarding Member navigation, Business Owner navigation, Direct URL RBAC denial, Listing Manager capabilities, explicit edit authorization, badge formatting, count freshness after record creation/deletion, and mobile responsiveness across 375px, 390px, and 430px viewports (100% pass locally and against staging).
- **Database Migrations**: None (0 schema changes).

### Platform Admin User Management UX — 2026-09-18

- **Feature Branch**: `feature/admin-user-management-ux` merged into `main` (`8fc99dd`).
- **Staging Deployment**: Deployed and verified on `https://listing.rclk.in` (Container `buzl-listing-app-1`).
- **Navigation & Discoverability**:
  - Added first-class `Users` (`/admin/users`) and `Add User` (`/admin/users/new`) entries in `Sidebar.tsx` for Platform Admins.
  - Refined route-matching to ensure accurate active state highlighting.
- **User List & Search/Filter Interface (`UserListClient.tsx`)**:
  - 5 summary metrics cards: Total Users, Business Owners, Buzl Members, Platform Admins, and Suspended Accounts.
  - Live search input matching user name, email, or Buzl Member ID with instant clear button.
  - Role filter pills (`All`, `Business Owners`, `Buzl Members`, `Admins`) and account status dropdown (`All`, `Active`, `Invited`, `Inactive`, `Suspended`).
  - Desktop table with user avatar initials, role badges, Buzl Member ID monospace tags, human-readable presets, pulse status indicators, last sign-in timestamps, and action links.
  - Fully responsive mobile stacked cards view for `< md` screens with zero horizontal overflow across 375px, 390px, and 430px viewports.
  - Clean empty state with "Clear all filters" button when no results match criteria.
- **Dynamic Role-Aware Invite Form (`InviteUserForm.tsx`)**:
  - Breadcrumb navigation (`← Back to Users`).
  - Interactive platform role selection cards (`Business Owner`, `Buzl Member`, `Platform Admin`).
  - Conditional rendering:
    - *Buzl Member*: reveals Buzl Member ID input and human-readable Permission Preset options (`Onboarding Member`, `Listing Manager`, None) with descriptive explanations.
    - *Platform Admin*: reveals administrative privilege security warning.
    - *Business Owner*: hides internal IDs/presets and presents user-friendly owner portal copy.
- **User Management & Detail Screen (`ManageUserForm.tsx`, `getUserBusinesses`)**:
  - Organized sections: Profile Overview Header, Profile & Role Settings, Authentication & Identity Details, Associated Businesses, and Danger Zone.
  - **Admin Self-Protection**: Prevents administrators from demoting or deactivating their own active account, with an explanatory alert banner and locked dropdowns.
  - **Last Active Admin Protection**: Server action enforcement ensures platform never drops to 0 active administrators.
  - Associated Businesses card: Queries `business_managers` table to display all businesses managed by the user with role tag, city/state, and publication status badge.
  - Authentication details card: Exposes read-only auth user UUID, authentication email, phone, and provider tags.
  - Destructive actions: Password reset dispatch and session revocation with modal confirmation dialogs.
- **Automated Verification & Browser Smoke Tests**:
  - Test suite `scripts/browser-smoke-test-admin-users.mjs` executed against staging (`https://listing.rclk.in`): 9/9 suites pass (100%).
  - `npm run lint`: PASS (0 errors)
  - `npm run build`: PASS (32 routes)
  - `npx supabase test db`: PASS (5 suites, 38 tests)
  - Indexing defense verified: `X-Robots-Tag: noindex, nofollow, noarchive`, `robots.txt` Disallow: /, empty `sitemap.xml`.
  - Zero database migrations required; zero disruption to adjacent containers.

### WhatsApp UI Staging Preview — 2026-09-18

- **Feature Branch**: `feature/whatsapp-ui-preview` merged to `main`.
- **Stakeholder UI Preview**:
  - Exposing WhatsApp OTP authentication interface on `/login` and `/signup` on staging.
  - Added dedicated WhatsApp tab between "Email Code (OTP)" (default) and "Password".
  - Clear availability notice banner: "WhatsApp verification is coming soon — WhatsApp OTP delivery is being activated. For now, use Email Code (OTP) or Password to continue." with direct "Use Email Code →" switch link.
  - Country code dropdown with common calling codes (+91 India default) and phone input field.
  - Client-side phone formatting and validation; triggers activation information message without displaying fake OTP token screens while live provider delivery is pending.
  - Fully mobile-responsive across 375px, 390px, and 430px viewports (0 horizontal overflow).
- **Automated Verification**:
  - `npm run lint`: PASS (0 errors)
  - `npm run build`: PASS (32 routes compiled)
  - `npx supabase test db`: PASS (5 suites, 38 tests)
  - `node scripts/verify-email-otp-flow.mjs`: PASS (49/49 checks)
  - `scripts/browser-smoke-test-business-owner-ux.mjs`: PASS (100% across desktop and mobile viewports)

### Business Owner UX Review — 2026-09-18

- **Feature Branch**: `feature/business-owner-ux-review` merged to `main @ ed82816`.
- **Authentication & Onboarding UX**:
  - Fully responsive mobile layout for 375px/390px/430px viewports (0 horizontal overflow; `scrollWidth = clientWidth`).
  - Padded cards with `p-6 sm:p-8`, `px-4 sm:px-6 lg:px-8`, and input containers for comfortable typing (293px+ width).
  - Clean responsive messaging across authentication tabs ("Email Code (OTP)", "Password").
- **Business Form & Onboarding Polish (`BusinessForm.tsx`)**:
  - **Step Bar**: Dual responsive layout (desktop 8-step indicator; mobile/tablet compact `Step X of 8: Label` with visual progress bar).
  - **Step 1 (Business Details)**: Renamed to `Step 1: Business Details`, input label `Business Name *`, helper text: `The registered name of your business as known to customers.`
  - **Step 2 (Contact Information)**: Prominent owner-editable `Google Business Profile Link (Optional)` with clear copy: `Paste the link to your business on Google. This will appear as "View on Google" on your public listing.`
  - **Step 3 (Services Offered)**: Updated to `What services does your business offer?`, counter `X / 20 Services`, and friendly empty state card when 0 services exist.
  - **Step 4 (Products & Offerings)**: Header changed to `Step 4: Products & Offerings (Optional)`, counter `X / 20 Products`, copy explaining products are optional showcase items, and friendly empty state card.
  - **Step 6 (Location Verification)**: Replaced technical jargon (`PostGIS Ready`, `Geospatial Coordinates`) with `✓ Location verified — Map location saved`.
  - **Step 8 (Preview & Submit)**: Renamed to `Step 8: Preview & Submit`. Added **Listing Readiness Summary** card displaying live status of required sections (Name, Phone, Category, Location) and optional items (Services, Logo, Google Business Profile).
  - **Submission Feedback**: Upgraded toast notification to `Your listing has been submitted for review.`
  - **Lifecycle Banners**:
    - *Pending Review*: Explains moderation review policy and informs owners that ongoing edits are included in review.
    - *Published Listing*: Informs owners the listing is live with direct `View Public Listing ↗` action.
- **Dashboard & Preview Enhancements**:
  - Renamed table header `Publication` / `Status` → `Listing Status` across `BusinessTableView` and dashboard home.
  - Added `View Listing ↗` action link for published businesses.
  - Replaced Topbar subtitle `Canonical Slug:` with `Listing URL:`.
  - Replaced preview badge `Public-Safe Output` with `Public Listing Preview`.
- **Zero Jargon Purge**:
  - Removed developer terminology (`PostGIS`, `place_id`, `RPC`, `Supabase`, `Meta Cloud API`, `Auth Hook`, `GoTrue`, `canonical_name`, `provider adapter`) from all owner-facing views.
- **Verification & Staging Deployment**:
  - Local verification: `npm run lint` (0 errors), `npm run build` (32 routes), `git diff --check` (0 errors), `npx supabase test db` (5 suites, 38 tests), `node scripts/verify-email-otp-flow.mjs` (49/49 checks).
  - Deployed to staging VPS (`https://listing.rclk.in`) on commit `ed82816`.
  - Staging browser smoke test (`scripts/browser-smoke-test-business-owner-ux.mjs`): 5/5 suites pass (100%) against staging.
  - Staging guards verified: `/api/health` (HTTP 200, `X-Robots-Tag: noindex, nofollow, noarchive`), `/robots.txt` (HTTP 200, Disallow /), `/sitemap.xml` (HTTP 200, empty urlset).

### Email OTP Authentication — 2026-09-17

- **Feature Branch**: `feature/email-otp-auth` based on `main @ e735192`.
- **Supabase Native Email OTP**:
  - Implemented passwordless 6-digit numeric verification via Supabase Auth GoTrue.
  - Created customized magic link template `supabase/templates/magic_link.html` displaying `{{ .Token }}` with 10-minute expiry.
  - Configured `[auth.email.template.magic_link]` in `supabase/config.toml` with `otp_length = 6` and `otp_expiry = 600`.
- **User Interface Enhancements**:
  - `src/app/login/page.tsx`: Dual-tab UI ("Email Code (OTP)" default and "Password" fallback), 6-digit input with numeric keypad optimization, 60s cooldown timer, 5-attempt brute-force limit with 5-minute lockout, open redirect defense (`getSafeRedirectUrl`), and role-based redirect routing.
  - `src/app/signup/page.tsx`: Unified "Email Code (OTP)" instant passwordless onboarding with automatic account provisioning alongside standard Password signup.
- **Identity & Authorization Security**:
  - Identity preservation: Existing Admin, Member, Listing Manager, and Owner accounts authenticate to their exact existing Supabase Auth UIDs with zero duplicate profile or user creation.
  - Role escalation prevention: New users are assigned least-privileged `business_owner` by database trigger; client input cannot assign elevated roles.
  - Account status enforcement: Inactive and suspended accounts are denied access by middleware, server session checks, and database RPCs even if possessing a valid GoTrue token.
  - Contact email privacy: Invariant `AUTH EMAIL != BUSINESS CONTACT EMAIL` strictly preserved.
- **Automated Verification**:
  - Comprehensive automated test suite (`scripts/verify-email-otp-flow.mjs`): 49/49 checks passed (100%).
  - Playwright browser smoke test (`scripts/browser-smoke-test-otp.mjs`): 100% pass across owner OTP login, logout, password login regression, and new user signup OTP.
  - Database test suites (`npx supabase test db`): 5 suites, 38 tests passed.
  - Independent security review (`Independent Security Reviewer`): Verdict **PASS_WITH_NOTES** (0 critical / 0 high vulnerabilities).
  - Next.js build (`npm run build`) and ESLint (`npm run lint`): Clean with 0 errors.

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
- **Staging Deployment & Verification**:
  - Merged `feature/google-places-location` into `main` (`511cecd`).
  - Applied migration `20260917200000_google_places_location.sql` to staging database `buzl-listing-db-1`.
  - Configured live Google Places API key server-side in staging environment with `GOOGLE_PLACES_MOCK=false`.
  - Rebuilt and recreated `buzl-listing-app-1` container on Hostinger VPS (`213.210.37.204`). Unrelated Supabase and production containers untouched (12-day uptime intact).
  - Staging smoke verification passed 33/33 checks (`scripts/staging-places-smoke.mjs`): authenticated proxy enforcement (401 on unauthenticated), staging indexing protections, live Google Places search (Chennai, Coimbatore, Munnar, Anna Nagar), address auto-fill, PostGIS coordinate storage, `place_id` DB persistence, canonical name preservation, and service-area privacy.

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
