# Buzl Listing Roadmap

Version 0.1.0 is the currently prepared and verified MVP baseline. This roadmap is not a commitment to every future feature: it separates current baseline capability, currently planned priorities, and optional ideas. Implementation order may change only through explicit product decisions. The locked v0.1.0 architecture and specifications remain authoritative unless they are formally revised.

## 1. Prepared / verified in v0.1.0

*Baseline capabilities already prepared or verified. These are not future roadmap commitments.*

### Secure application foundation

- Next.js App Router application with TypeScript and the tracked Buzl design system.
- Supabase, PostgreSQL, and PostGIS-ready foundation managed through versioned migrations.
- Row-level security, server-side authorization, trusted role authority, and privacy-safe public projections.
- Separate publication and verification state machines; only published listings are public and indexable.

### Existing roles

- **Admin** — administers listings, publication, suspension, and verification.
- **Buzl Member** — performs internal onboarding/import work under trusted Buzl authority.
- **Business Owner** — manages assigned business listings and submits them for review.

### Business management

- Authenticated dashboard and business list.
- Create and edit workflow with category selection, owner-defined services, business hours, validation, duplicate warnings, and public-safe preview.
- Storefront, service-area, and hybrid listing modes.
- Owner submission and administrator publish/suspend controls.

### Buzl Member onboarding

- Separate Buzl Member ID (`member_id`) concept; it is not an authentication credential.
- Internal Buzl Profile JSON import with legacy profile mapping.
- Duplicate detection, category review requirements, and import provenance.
- Enforced service-area privacy: street addresses and private coordinates do not enter public projections.

### Public directory

- Published-only public business pages and public-safe reads.
- Search, category discovery, location discovery, and controlled category/location discovery.
- Canonical business URLs, redirects for historical slugs, metadata, Open Graph output, JSON-LD, sitemap, and robots/index controls.

### Quality and security verification

- Local RLS/runtime checks, privacy review, release-security hardening, browser smoke checks, lint, and production-build verification.
- Staging safety controls are implemented: noindex metadata/header directives, disallow-all staging robots policy, and empty staging sitemap.
- Isolated remote staging deployment is active for internal review; the public
  staging surface remains noindex.

## 2. Upcoming approved priorities

These are the currently approved next work areas. Their stated status is a planning classification, not implementation authorization beyond explicit task scope.

### 2.1 User management and expanded RBAC

**Status:** Prepared / verified

- Admin user list and user detail views.
- Create/invite user, activation, deactivation/suspension, password reset/invite flow, and practical session revocation.
- Support the Admin, Buzl Member, and Business Owner identities while keeping `member_id` separate from authentication.
- Expand Buzl Member permissions through a capability model and, where useful, permission presets.
- Prevent privilege escalation and preserve trusted Buzl-controlled role authority.

This work must extend the existing secure Supabase Auth and RLS architecture rather than replace it.

### 2.2 Google and WhatsApp login evaluation / implementation

**Status:** Planned

**Google:** evaluate and configure Supabase Google OAuth, integrate it with the existing account model, avoid duplicate identities/accounts, and preserve Buzl-controlled role and permission authority.

**WhatsApp:** evaluate a supported Supabase/Twilio or otherwise approved WhatsApp OTP path, including production feasibility, India/provider requirements, and account-linking behavior.

Authentication provider identity does **not** determine Buzl authorization. Role, `member_id`, account state, and permissions remain trusted Buzl-controlled data.

### 2.3 Remote staging provisioning and deployment

**Status:** Planned

- Dedicated and isolated Buzl Listing deployment on a Hostinger VPS.
- Isolated Supabase stack; an existing unrelated Supabase stack remains untouched.
- Planned application domain: `https://listing.rclk.in`.
- Planned Supabase API/Auth endpoint: `https://api-listing.rclk.in`.
- DNS, HTTPS, migrations, guarded staging seed, noindex enforcement, live browser smoke testing, and staging review package.

The isolated staging topology, migrations, guarded seed, HTTPS routing, and
noindex controls have been verified. Production infrastructure remains a
separate future release decision.

### 2.4 Listing Logo & Cover Media

**Status:** Planned

- Business logo upload and business cover-image upload.
- Supabase Storage for binary files and PostgreSQL media metadata.
- Upload validation, MIME/type validation, file-size limits, safe storage paths, replacement/delete behavior, role/ownership permissions, alt text, practical image optimization, and public-listing rendering.

This priority covers logo and cover only. Gallery functionality is not included.

### 2.5 Tracking & Measurement Foundation

**Status:** Planned

Buzl Listing needs a consistent measurement foundation before production traffic begins. The purpose is to measure public-directory discovery, business-profile engagement, contact/lead actions, owner onboarding, Buzl Member onboarding/import activity, the submission/publication funnel, marketing attribution, and UX/session behavior.

#### Planned tracking stack

| Platform | Role |
| --- | --- |
| Google Tag Manager (GTM) | Central tag orchestration and delivery layer. |
| Google Analytics 4 (GA4) | Primary web and product analytics for traffic, navigation, listing engagement, funnels, and conversion events. |
| Meta Pixel | Meta advertising and browser-attribution measurement. |
| Microsoft Clarity | Qualitative UX insight through heatmaps, session recordings, and usability patterns. |

GTM is not a database or the analytics source of truth. Analytics platforms do not replace Buzl application/database truth. The Buzl database and trusted server-side business events remain authoritative for users, businesses, publication state, verification state, imported listings, business ownership, and lifecycle transitions. Meta Pixel is not authoritative for Buzl business state or stored conversions, and Clarity is not the authoritative conversion source.

#### Standardized event contract

Implementation should use one centralized Buzl analytics/event layer rather than random component-level vendor calls.

```text
Application event
        ↓
Buzl analytics/event layer
        ↓
dataLayer
        ↓
GTM
        ↓
GA4 / Meta Pixel / other approved tags
```

Business components should not independently hardcode multiple vendor SDK calls where avoidable.

#### Planned normalized events

**Public directory:** `business_view`, `search`, `search_result_click`, `category_view`, `location_view`, `call_click`, `whatsapp_click`, `website_click`, `email_click`, and `share_click`.

**Business management:** `login`, `business_create`, `business_edit`, `business_preview`, `business_submit`, `business_publish`, and `business_suspend`.

**Buzl Member import:** `json_import_start`, `json_import_validation_failed`, `json_import_review`, `json_import_complete`, `duplicate_warning_detected`, and `category_review_required`.

No analytics payload should directly include sensitive personal or business data. In particular, do not send auth email, hidden business email, phone number, private address, private coordinates, `member_id`, `source_buss_id`, `source_loc_id`, `source_place_id`, normalized phone, normalized domain, or internal moderation notes to third-party analytics providers unless explicitly approved later.

#### Funnel measurement

The primary public-directory funnel is:

```text
Search / Discovery
        ↓
Business Listing View
        ↓
Engagement
        ↓
Contact Action
```

Contact actions are call, WhatsApp, website, and email actions. This is a primary GA4 funnel.

The business-onboarding funnel is:

```text
Login
  ↓
Create / Import Business
  ↓
Profile Completion
  ↓
Preview
  ↓
Submit
  ↓
Admin Publish
```

It should help Buzl identify incomplete or abandoned listings without exposing private event payload data.

#### Environment separation, verification, and privacy

Tracking configuration must distinguish local, staging, and production. Staging should use dedicated debug configuration where practical: a separate GA4 property/data stream or explicitly filtered staging traffic, Meta test events where applicable, disabled or clearly separated Clarity, and GTM Preview/Debug validation. Only production-domain traffic contributes to production reporting.

Before production launch, validate the staging environment at `https://listing.rclk.in` with dataLayer inspection, GTM Preview, GA4 DebugView, Meta Pixel Helper/test events, and approved Clarity initialization. Confirm that no duplicate events fire.

The implementation must prevent duplicate `page_view` and conversion events, duplicated SPA-navigation events, and repeated button events caused by hydration or rerenders. Next.js App Router behavior must be considered.

**Consent status:** Planned. Production implementation must evaluate consent requirements for GA4, Meta Pixel, Microsoft Clarity, and advertising/marketing cookies before enabling marketing tracking in jurisdictions where required. A consent platform is not part of this roadmap task.

**Meta Conversions API (CAPI) status:** Deferred. It requires an explicit product decision after browser-side event architecture is validated; it may later be evaluated for attribution quality, browser-tracking loss, and lead/conversion reconciliation.

**Custom analytics dashboard status:** Deferred. The first implementation relies on GA4 reports, GTM debugging, Meta reporting, and Clarity rather than a custom Buzl analytics dashboard.

### 2.6 Production hardening

**Status:** Planned

- Rate limiting and abuse protection where needed.
- Immutable or stronger audit provenance.
- Caching strategy, observability, structured logging, and error monitoring.
- Database and storage backups, restore verification, deployment rollback process, and security review before production.

These controls are not yet claimed as production-complete.

### 2.7 Map / geocoder provider selection

**Status:** Requires product decision

The current architecture intentionally remains provider-neutral. A decision is needed for map display, geocoding, reverse geocoding, address suggestions, usage costs, API limits, India coverage, privacy, and licensing. Providers may be evaluated later; this roadmap does not select one.

## 3. Possible future add-ons

**These items are not approved v0.1.0 or immediate implementation scope. They are not commitments and each requires explicit product approval before implementation.**

### 3.1 Listing ownership and trust

| Item | Status |
| --- | --- |
| Listing claims | Requires product decision |
| Public signup | Requires product decision |
| Business verification workflows | Requires product decision |
| Multiple business managers | Deferred |

### 3.2 Reputation and engagement

| Item | Status |
| --- | --- |
| Reviews | Requires product decision |
| Advanced notifications | Deferred |
| Advanced moderation | Deferred |

### 3.3 Commercial / lead-generation features

| Item | Status |
| --- | --- |
| Payments | Requires product decision |
| Bookings | Requires product decision |
| Quote leads / quote marketplace | Requires product decision |

### 3.4 Gallery & advanced media

**Status:** Deferred

- General business gallery and multiple gallery images.
- Service-specific images and product-specific images.
- Image ordering, advanced captions/metadata, video, bulk media operations, and media moderation.

These future items do not alter the Planned logo-and-cover scope.

### 3.5 Listing enrichment

| Item | Status |
| --- | --- |
| Secondary categories | Deferred |
| Tags | Deferred |

### 3.6 Discovery / analytics

| Item | Status |
| --- | --- |
| Radius search | Deferred |
| Advanced analytics | Deferred |
| Custom analytics dashboard | Deferred |
| Advanced geospatial discovery | Deferred |

## Roadmap guardrails

- Locked v0.1.0 product and security decisions remain authoritative.
- This roadmap does not override the Business Field Matrix, User Journeys, or MVP Build Contract.
- Optional ideas are not implementation authorization; scope changes require an explicit product decision.
- Privacy and security controls must not be weakened for roadmap features.
- Public-facing fields must continue to use public-safe projections, and service-area privacy remains mandatory.
- Authentication-provider changes must not bypass trusted role or permission enforcement.

### Data architecture guardrail

- PostgreSQL via Supabase is the canonical database.
- PostGIS handles geospatial data and PostgreSQL JSONB handles flexible source payloads where needed.
- Supabase Storage holds binary media; PostgreSQL holds media metadata and references.
- MongoDB is not part of the current architecture. Any additional database technology requires an explicit architecture/product decision and evidence that PostgreSQL/JSONB is insufficient.

## Recommended near-term implementation order

1. User management and expanded RBAC.
2. Google login evaluation/implementation.
3. WhatsApp login evaluation/implementation.
4. Remote staging provisioning and deployment.
5. Listing Logo & Cover Media.
6. Tracking & Measurement Foundation: GTM, GA4, Meta Pixel, Microsoft Clarity, dataLayer/event contract, and conversion funnels.
7. Production hardening.
8. Map/geocoder provider decision.

Tracking implementation should occur after a working remote staging environment exists so events can be verified against real browser navigation and HTTPS URLs before production. Staging may move earlier operationally if the required infrastructure becomes available.
