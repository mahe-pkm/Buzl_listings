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
- **Remote staging provisioning/deployment is not yet complete.**

## 2. Upcoming approved priorities

These are the currently approved next work areas. Their stated status is a planning classification, not implementation authorization beyond explicit task scope.

### 2.1 User management and expanded RBAC

**Status:** Planned

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

Local deployment preparation is complete enough to proceed. Remote infrastructure provisioning is **Not started** and depends on operator infrastructure setup and credentials.

### 2.4 Production hardening

**Status:** Planned

- Rate limiting and abuse protection where needed.
- Immutable or stronger audit provenance.
- Caching strategy, observability, structured logging, and error monitoring.
- Database and storage backups, restore verification, deployment rollback process, and security review before production.

These controls are not yet claimed as production-complete.

### 2.5 Map / geocoder provider selection

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

### 3.4 Listing enrichment

| Item | Status |
| --- | --- |
| Gallery / expanded media | Deferred |
| Secondary categories | Deferred |
| Tags | Deferred |

### 3.5 Discovery / analytics

| Item | Status |
| --- | --- |
| Radius search | Deferred |
| Advanced analytics | Deferred |
| Advanced geospatial discovery | Deferred |

## Roadmap guardrails

- Locked v0.1.0 product and security decisions remain authoritative.
- This roadmap does not override the Business Field Matrix, User Journeys, or MVP Build Contract.
- Optional ideas are not implementation authorization; scope changes require an explicit product decision.
- Privacy and security controls must not be weakened for roadmap features.
- Public-facing fields must continue to use public-safe projections, and service-area privacy remains mandatory.
- Authentication-provider changes must not bypass trusted role or permission enforcement.

## Recommended near-term implementation order

1. User management and expanded RBAC.
2. Google login evaluation/implementation.
3. WhatsApp login evaluation/implementation.
4. Remote staging provisioning and deployment.
5. Production hardening.
6. Map/geocoder provider decision.

Staging may move earlier operationally if the required infrastructure becomes available.
