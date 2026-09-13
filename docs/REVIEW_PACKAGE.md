# Buzl Listing — Staging Review Package & Handoff Guide

## 1. Project Information

- **Project:** Buzl Listing
- **Phase:** Rapid Prototype MVP — Staging Deployment & Review Package
- **Baseline Commit:** `46c454a` (`feat(public): complete Day 2 public directory, search, discovery, and SEO readiness`)
- **Staging Readiness Commit:** Current working tree (staging search engine safety, environment configuration, staging seed automation)
- **Primary Technology Stack:** Next.js 16 (App Router), TypeScript, Supabase (PostgreSQL 15, PostGIS, Auth, RLS), Tailwind CSS

---

## 2. Staging Environment & URL Details

- **Application Environment:** Staging (`NEXT_PUBLIC_IS_STAGING=true`)
- **Target Staging Host:** Configurable (Vercel / Netlify / Cloudflare Pages / Containerized Node.js)
- **Local Verification Host:** `http://localhost:3000` (Dev Server) / `http://localhost:3005` (Compiled Production Runtime)
- **Search Engine Staging Safety:**
  - **Meta Robots:** `<meta name="robots" content="noindex, nofollow, nocache" />`
  - **Robots.txt:** `User-Agent: * \n Disallow: /`
  - **HTTP Response Header:** `X-Robots-Tag: noindex, nofollow, noarchive` (enforced via Next.js middleware)
  - **Production Invariance:** When `NEXT_PUBLIC_IS_STAGING` is false or unset, standard production SEO rules (`index: true` for published listings, canonical links, XML sitemap, crawler allow rules) are strictly preserved.

---

## 3. Test Personas & Credentials

> [!NOTE]
> Test credentials are provided separately through a secure staging handoff. This document contains no passwords or secret values.

| Persona | Email | System Role (`app_metadata.role`) | Identifier (`member_id`) | Description & Scope |
|---|---|---|---|---|
| **Admin** | `admin@buzl.test` | `admin` | `BUZL-M-0001` | Full administrative control: inspect listings, publish, suspend, assign verification status, view all records. |
| **Buzl Member** | `member@buzl.test` | `buzl_member` | `BUZL-M-1024` | Internal onboarding specialist: access 8-section Buzl Profile JSON importer, review source records, map categories, create drafts. Denied direct publication. |
| **Business Owner** | `owner@buzl.test` | `business_owner` | `None` | Business management: 6-step listing creation, update owned listings, public preview, submit for review. Denied internal importer. |
| **Public / Anonymous** | Anonymous visitor | `None` | `None` | Public directory browsing: search, category/location discovery, canonical business pages, Schema.org LocalBusiness JSON-LD. Denied draft/suspended records. |

---

## 4. Core Review Flows

### Flow A: Business Owner
1. Navigate to `/login` and select **Demo Owner** (`owner@buzl.test`).
2. Land on `/dashboard` with overview metrics.
3. Access **My Businesses** (`/dashboard/businesses`) to view owned listings.
4. Click **Create New Business** (`/dashboard/businesses/new`) to access the 6-step creation form:
   - Step 1: Business Identity (canonical name, description, year established)
   - Step 2: Contact / NAP (primary/alternate/WhatsApp phone, separate business email, show email toggle, website)
   - Step 3: Category & Services (curated active category + owner service chips)
   - Step 4: Location (Storefront with map pin, Service-Area with named localities, or Hybrid)
   - Step 5: Hours & Social (7-day operating schedule, social handles)
   - Step 6: Public-Safe Preview, Duplicate Warning & Submission for Review
5. Observe that business is created as `draft` and transitioned to `pending` upon submission.

### Flow B: Buzl Member (JSON Profile Importer)
1. Navigate to `/login` and select **Demo Member** (`member@buzl.test`).
2. Redirects directly to `/admin/businesses/import` with header displaying **Buzl Member: BUZL-M-1024**.
3. Click **Load Laptech Sample Profile** to ingest legacy profile payload.
4. Review the 8 dedicated audit sections:
   - Section 1: Source Identity & Provenance (recordId, bussId, locId, placeId, legacy status)
   - Section 2: Import Actor Attribution (Attributed to Member BUZL-M-1024)
   - Section 3: Business Information (Laptech, phone, contact email, website)
   - Section 4: Classification & Category Match (Flags "CATEGORY REVIEW REQUIRED" because source category "Electronics repair shop" requires mapping to active category)
   - Section 5: Location & Delivery Mode (Service Area detected; street address and coordinates strictly held internal-only)
   - Section 6: Services (26 services extracted with chips)
   - Section 7: Warnings & Duplicate Detection (Real-time duplicate signals)
   - Section 8: Privacy Controls (Street address locked to hidden)
5. Select category **Retail Store** and click **Create Business Draft**.
6. Success modal confirms draft created, attributed to `BUZL-M-1024`, with zero auto-publication.

### Flow C: Admin Moderation
1. Navigate to `/login` and select **Demo Admin** (`admin@buzl.test`).
2. Routes to `/admin/businesses` directory table.
3. Inspect pending and draft businesses with full filter controls.
4. Select a pending listing and click **Publish** — status immediately transitions to `published`.
5. Select an active listing and click **Suspend** — status immediately transitions to `suspended` and becomes hidden from public directory.
6. Toggle **Verified** status badge.

### Flow D: Public Directory Visitor
1. Visit `/` to see the public directory homepage with search hero, curated categories, top cities, and "Recently Published Businesses".
2. Enter search queries at `/search?q=...` (full-text search across business name, services, and locations).
3. Browse category pages: `/category/it-software`, `/category/retail-store`.
4. Browse location pages: `/location/chennai`, `/location/new-delhi`, `/location/bengaluru`.
5. Browse curated combination page: `/location/chennai/retail-store` (approved combination, indexable).
6. View public canonical business page: `/business/apex-digital-solutions` and `/business/laptech`.
7. Verify service-area privacy: `laptech` displays "Serving Chennai" with service area badges, but zero street address and zero map coordinates.
8. Verify 404 isolation: attempting to visit a draft (`/business/metro-auto-care`) or suspended (`/business/legacy-flagged-enterprise`) listing returns HTTP 404 without leaking internal state.

---

## 5. Feature Status Matrix

### Verified Features
- [x] **Location Modes:** Storefront (address + pin), Service-Area (localities, address suppressed), Hybrid (both).
- [x] **Buzl Member Support:** First-class `buzl_member` role, immutable `member_id` assignment (`BUZL-M-XXXX`), provenance audit tracking (`source_record_id`, `source_buss_id`, `imported_by_member_id`).
- [x] **Buzl Profile Importer:** 8 review sections, Indian address parser, category matcher with alias support, duplicate warning signal, non-blocking flow.
- [x] **Moderation Lifecycle:** Separate publication status (`draft`, `pending`, `published`, `suspended`) and verification status (`unverified`, `verified`).
- [x] **Public Directory & Search:** PostgreSQL FTS + `pg_trgm` search across canonical names, services, and locations.
- [x] **Discovery Taxonomies:** Hierarchical category routes (`/category/[slug]`), location discovery (`/location/[slug]`), and curated combination routes (`/location/[slug]/[categorySlug]`).
- [x] **Curated Combination Gate (Constraint 2):** Editorial approval table `public.approved_combination_indexes` controls indexing; approved combinations get `index: true`, unapproved get `index: false`.
- [x] **Factual Content (Constraint 1):** Categories and locations render stored factual names and live counts; zero invented marketing copy.
- [x] **Trusted Timezone Operating Hours (Constraint 3):** Live "Open Now" / "Closed Now" claims require trusted timezone (`IN` -> `Asia/Kolkata`); unmapped timezones show hours without claims.
- [x] **Hardened RPCs & Zero Privacy Leaks (Constraint 4):** All public RPCs are `SECURITY DEFINER` with explicit search paths, privilege revocations, bounded pagination, and 100% suppression of coordinates, member IDs, and internal moderation metadata.
- [x] **Recently Published Businesses (Constraint 5):** Homepage queries recently published businesses; zero artificial "Featured" or paid rankings.
- [x] **Technical SEO:** Canonical tags, Open Graph, BreadcrumbList JSON-LD, LocalBusiness Schema.org JSON-LD, dynamic sitemap (`/sitemap.xml`), and robots crawl controls (`/robots.txt`).
- [x] **Staging Safety:** Environment-controlled global `noindex`, `robots.txt` disallowing `/`, and `X-Robots-Tag: noindex, nofollow, noarchive` response header.
- [x] **Responsive UI:** Fully responsive across mobile (375px), tablet (768px), and desktop (1280px+).

### Known Deferred Features
- Public self-registration (sign-up disabled for MVP; accounts managed by Buzl).
- Listing claiming workflows.
- Advanced corporate verification documents/upload.
- Consumer reviews and star ratings.
- Consumer payments, checkout, and bookings.
- Quote marketplace and lead distribution.
- Paid ranking or featured listings.
- Geospatial radius search ("near me" within X km).
- Secondary categories and free-form tags.
- Bulk batch JSON import.
- Automated external source synchronization.
- Advanced analytics dashboard.
- Production hosting selection and DNS configuration.

### Known Non-Blocking Hardening Items
- Provenance audit columns (`source_record_id`, `imported_by_member_id`) may be made strictly immutable via trigger after insertion.
- Rate limiting on public search RPC against scraping spikes.
- Edge caching / CDN header optimization for static sitemap and public landing pages.

---

## 6. Reviewer Checklist

Use this checklist during staging verification:

- [ ] **Owner Workflow:** Login as `owner@buzl.test` -> View dashboard -> Create listing -> Public preview -> Submit listing.
- [ ] **Buzl Member Import:** Login as `member@buzl.test` -> Navigate to importer -> Load Laptech sample -> Verify 8 review sections -> Confirm category review alert -> Confirm address privacy -> Create draft -> Verify Member ID attribution.
- [ ] **Admin Moderation:** Login as `admin@buzl.test` -> View all listings -> Publish a pending listing -> Suspend an active listing -> Toggle verified badge.
- [ ] **Storefront Listing:** Verify `apex-digital-solutions` displays street address and locality.
- [ ] **Service-Area Privacy:** Verify `quickfix-doorstep-tech` and `laptech` show service area coverage, with zero street address and zero map coordinates in HTML, JSON-LD, or network requests.
- [ ] **Hybrid Listing:** Verify `apex-chennai-hub` displays both address and service areas.
- [ ] **Search:** Verify `/search?q=repair` returns relevant matching businesses.
- [ ] **Category Discovery:** Verify `/category/retail-store` renders factual business cards.
- [ ] **Location Discovery:** Verify `/location/chennai` renders businesses located or serving Chennai.
- [ ] **Public Business Page:** Verify `/business/apex-digital-solutions` renders breadcrumbs, contact buttons, operating hours, and Schema.org JSON-LD.
- [ ] **Mobile Experience:** Verify responsive navigation and zero horizontal overflow at 375px viewport.
- [ ] **SEO Output:** Verify valid canonical URLs, Open Graph tags, and Schema.org structured data.
- [ ] **Sitemap:** Verify `/sitemap.xml` lists published listings, active categories, active locations, and approved combinations.
- [ ] **Authorization Boundaries:** Verify unauthenticated users cannot access `/dashboard` or `/admin/*`; verify business owner cannot access `/admin/*`.

---

## 7. Screenshots Inventory

Verification screenshots are stored in `tests/screenshots/`:

| Screenshot File | Interface / Flow | Description |
|---|---|---|
| `day2_home_desktop.png` | Public Homepage (Desktop) | Hero search, active category pills, top locations, Recently Published Businesses section. |
| `day2_home_mobile.png` | Public Homepage (Mobile 375px) | Responsive hero layout and vertical stacking. |
| `day2_search.png` | Public Directory Search | Search results for keyword with category badges and privacy badges. |
| `day2_business_detail.png` | Public Business Canonical Page | Canonical listing for Laptech: breadcrumbs, action buttons, services, hours, LocalBusiness schema. |
| `day2_category.png` | Category Discovery Page | Factual directory listing for Retail Store category. |
| `day2_location.png` | Location Discovery Page | Factual directory listing for Chennai location. |
| `day2_combination.png` | Curated Combination Page | Chennai + Retail Store approved indexable combination page. |
| `02_owner_dashboard.png` | Business Owner Dashboard | Authenticated owner overview with metrics and quick actions. |
| `04_owner_preview.png` | 6-Step Creation Form Preview | Step 6 public-safe preview card with zero coordinate leakage. |
| `07_member_importer.png` | Buzl Member Importer | Empty importer state with file upload and demo sample loader. |
| `08_member_laptech_reviewed.png` | Importer 8-Section Review | Loaded Laptech profile with Category Review Required and privacy lock. |
| `09_member_import_success.png` | Importer Success Modal | Import confirmation displaying Business ID, draft status, and Member ID `BUZL-M-1024`. |
| `10_admin_businesses.png` | Admin Listing Directory | Table view of all listings across all states with moderation buttons. |
| `11_admin_published.png` | Admin Publication Action | Listing transitioned to published state with green pill badge. |
| `12_admin_suspended.png` | Admin Suspension Action | Listing transitioned to suspended state with orange pill badge. |
| `13_mobile_drawer_open.png` | Mobile Responsive Drawer | Slide-out navigation drawer on 375px viewport. |

---

## 8. Deployment & Rollback Documentation

### Staging Provider
- **Approved Target Providers:** Vercel (recommended for Next.js 16 App Router), Netlify, Cloudflare Pages, or Docker Container on VM.
- **Node.js Runtime:** Node.js 20.x or 22.x LTS (compatible with Node.js 24).

### Required Environment Variables
Configure the following in the staging hosting provider dashboard:

```env
# Supabase Staging Project
NEXT_PUBLIC_SUPABASE_URL=https://your-staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-staging-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-staging-service-role-key

# Public Application URL
NEXT_PUBLIC_SITE_URL=https://staging-listing.yourdomain.com

# Staging Protection (Enforces global noindex and robots disallow)
NEXT_PUBLIC_IS_STAGING=true
APP_ENV=staging
```

### Database Migration Process
Apply migrations in strict numerical order using the Supabase CLI or direct PostgreSQL connection:
1. `supabase/migrations/20260912140000_day1_foundation.sql` (PostGIS, tables, RLS, functions, category seeds)
2. `supabase/migrations/20260912150000_day1_5_member_and_import.sql` (Buzl Member role, member_id, provenance columns)
3. `supabase/migrations/20260912160000_day2_public_directory.sql` (Public RPCs, trigram search, approved combination table)

### Staging Data Seeding Process

The staging seeder requires **all** of the following environment variables. Missing or mismatched values will abort before any data is modified:

```bash
BUZL_ENV=staging \
ALLOW_STAGING_SEED=true \
BUZL_MUTATION_ENV=staging \
ALLOW_STAGING_MUTATIONS=true \
STAGING_MUTATION_TARGET_HOST=your-staging-project.supabase.co \
NEXT_PUBLIC_SUPABASE_URL=https://your-staging-project.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=your-staging-service-role-key \
STAGING_SUPABASE_PROJECT_REF=your-staging-project \
STAGING_ADMIN_EMAIL=admin@buzl.test \
STAGING_ADMIN_PASSWORD=<secure-staging-password> \
STAGING_MEMBER_EMAIL=member@buzl.test \
STAGING_MEMBER_PASSWORD=<secure-staging-password> \
STAGING_OWNER_EMAIL=owner@buzl.test \
STAGING_OWNER_PASSWORD=<secure-staging-password> \
node scripts/seed-staging.mjs
```

**Safety gates (all must pass or seeder aborts):**
1. `BUZL_ENV=staging` — explicit staging intent
2. `ALLOW_STAGING_SEED=true` — explicit operator confirmation
3. `STAGING_SUPABASE_PROJECT_REF` — expected project ref must be set
4. Project ref extracted from `NEXT_PUBLIC_SUPABASE_URL` must exactly match `STAGING_SUPABASE_PROJECT_REF`
5. `SUPABASE_SERVICE_ROLE_KEY` — privileged credential required
6. All persona email/password variables — no hardcoded fallbacks
7. `APP_ENV` must not be `production`; guarded mutation scripts reject production
8. `STAGING_MUTATION_TARGET_HOST` must exactly match the supplied target host

### Supabase Auth URL Configuration
In the Supabase Staging Dashboard (**Authentication -> URL Configuration**):
- **Site URL:** `https://staging-listing.yourdomain.com`
- **Redirect URLs:** `https://staging-listing.yourdomain.com/**`

### Deployment Command
```bash
# Build verification
npm run lint
npm run build

# Staging deployment command (after provider authorization)
npx vercel --yes
```

### Rollback Method
1. **Application Code:** Redeploy the prior successful staging deployment or commit `46c454a` through the approved hosting workflow.
2. **Database:** All Day 2 migrations are backward-compatible and additive; schema rollback is not required for application rollbacks to Day 1.5 or Day 2 baseline.

---

## 9. Staging Readiness & Deployment Blocker Audit

### Readiness Verification Summary
- [x] Codebase compilation passes (`npm run build` completed in 740ms with 0 errors).
- [x] Codebase linting passes (`npm run lint` completed with 0 errors, 0 warnings).
- [x] Staging Search Engine Safety verified (robots.txt disallows `/`, X-Robots-Tag header is `noindex, nofollow, noarchive`, meta robots tag is `noindex, nofollow`).
- [x] Staging seeder script verified (`scripts/seed-staging.mjs` executes idempotently across all 3 personas and 6 demo businesses).
- [x] Automated test suites verified (58/58 Day 2 public checks, 41/41 public browser smoke checks, 5/5 persona suites).
- [x] Review package documentation complete with checklist, screenshot mapping, and deployment guides.

### Deployment Blockers (Remote Infrastructure Prerequisites)
To deploy this verified build to an external cloud URL, the following remote infrastructure credentials must be provided:
1. **Remote Staging Supabase Project:** A dedicated remote Supabase project ref/URL and API keys (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) are required. (Currently, only local Supabase is running on `http://127.0.0.1:54321`).
2. **Hosting Provider Authentication:** An active CLI token or access token for a remote hosting service (e.g., `VERCEL_TOKEN`, `NETLIFY_AUTH_TOKEN`, or remote Git repository access) is required. (Currently, no cloud hosting tokens or git remotes exist on this machine).

Remote staging has NOT yet been deployed. It remains blocked until the dedicated Supabase project and hosting authorization are configured.
