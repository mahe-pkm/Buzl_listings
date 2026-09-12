# Buzl Listing — Rapid MVP Build Contract

**Status:** READY / LOCKED

## 1. Purpose and delivery target

This contract consolidates the MVP decisions needed to build a fast internal Buzl Listing prototype. It replaces separate detailed Phase 2.3–2.10 specifications for this prototype only; those documents are deferred, not individually completed. The target flow is email/password login → dashboard → create/edit business → preview/publish → public listing/discovery → admin publish/suspend → deploy.

The prototype uses Next.js App Router, TypeScript, Supabase (Auth, PostgreSQL, Storage), basic RLS, a PostGIS-ready location model, and the tracked Buzl design system. It must not add production-only complexity before it is needed.

## 2. Locked prototype scope

Include:

- Email/password authentication; `admin` and `business_owner` roles; manually/admin-created prototype accounts.
- Business CRUD with exactly one primary category, owner-defined services, hours, public-safe NAP/contact data, optional logo/cover, and social links.
- Storefront, service-area, and hybrid modes; preview; publication and independent verification state; basic duplicate warning.
- Public business page, basic PostgreSQL-backed search, category/location discovery, canonical URLs, JSON-LD, sitemap, robots, responsive layout, and admin publish/suspend.

Do not build: public signup, OTP/advanced verification, claims, multiple-manager UI, secondary categories, free-form tags, gallery, radius, advanced geo search/moderation/duplicate scoring, reviews, payments, bookings, quotes, paid ranking, complex notifications/analytics/CMS/role hierarchy.

## 3. Data-model contract

All types below are practical conceptual types; migrations are created only during implementation.

| Entity | Purpose and key fields | Relationships / lifecycle | Access and visibility |
|---|---|---|---|
| `profiles` | Auth-linked profile: `id uuid`, role (`admin` or `business_owner`), display name, timestamps. | One profile can manage businesses. | Private; role is trusted server/database state only. |
| `businesses` | Canonical identity/contact/lifecycle: `id uuid`, name, unique slug, description, year, phones + normalized phone, WhatsApp, business email + public flag, website + normalized domain, social links, location mode, structured address, country/code, postal code, map point, address visibility, publication/verification status, source, audit timestamps. | One primary category; related services, areas, hours, media, managers, slug history. | Public query exposes only published, public-safe projection. Owners edit assigned records; lifecycle control is admin-only. |
| `business_managers` | Assignment of profile to business with owner role. | Supports future multiple managers without UI. | Owner sees/manages assigned business; admin manages assignments. |
| `categories` | Curated category: `id`, name, slug, parent, active flag, sort order. | A business points to one active primary category. | Public readable when active; admin-managed. |
| `business_services` | Owner-defined service names, with optional ordering. | Many services per business; no controlled taxonomy or service description. | Owner/admin manage; public for published business. |
| `business_service_areas` | Named service-area location text plus normalized locality/city/state/country context. | One or more required for service-area/hybrid. | Owner/admin manage; public for published business. No radius. |
| `business_hours` | Day, one or more regular intervals, closed/24-hour flags. | Optional enrichment; special/holiday hours are excluded. | Owner/admin manage; public for published business. |
| `business_media` | Logo and cover storage references, MIME type, byte size, timestamps. | At most one active logo and one active cover for prototype. | Owner/admin upload/manage; public only for published business. |
| `slug_history` | Previous slug and timestamp. | Permanent redirect source after approved slug change. | Internal redirect lookup only. |

### Business location rules

- `storefront`: requires public structured address, locality/city as appropriate, state, country, PIN/postal code where applicable, and public map location.
- `service_area`: requires city, state, country, and at least one named service area; requires neither street address (public or private) nor radius.
- `hybrid`: requires storefront requirements plus at least one named service area.
- Store geographic data in a PostGIS-ready point representation. Present map location as one user-facing concept; latitude/longitude are not separately editable concepts.
- Private coordinates must never be included in public HTML, JSON-LD, public APIs, maps, metadata, search, or discovery output.

## 4. Authentication, authorization, and RLS baseline

- Supabase Auth with email/password is the only prototype authentication method. No public signup route is exposed.
- Account email is private and is never copied into business contact email. Business contact email is optional, hidden by default, and public only by explicit owner choice.
- Public users read only published businesses and only public fields/related public records.
- Owners read/manage only businesses assigned through `business_managers`; they cannot self-assign, elevate roles, or directly set admin-only lifecycle fields.
- Admins manage all prototype records, publication, verification, category administration, and assignments.
- Implement understandable, table-level RLS policies plus server-side authorization/validation where privileged actions occur. Never expose private coordinates, internal metadata, moderation-only values, or auth identity.

## 5. Publication, verification, and duplicate behavior

Publication states: `draft`, `pending`, `published`, `rejected`, `suspended`, `archived`. Only `published` is public, discoverable, indexable, and included in the sitemap.

Verification states: `unverified`, `pending`, `verified`, `failed`. They are independent of publication; trusted Buzl admin/client listings may publish while unverified. The prototype may simplify owner UX but admin publish/suspend must work.

Duplicate handling is warning/flag only. Check strong signals (normalized phone, normalized website domain, legitimate external ID) and contextual signals (normalized name, postal code, address, proximity where present). Never auto-merge records or implement advanced scoring.

## 6. Validation and media baseline

Validate required name, displayable phone, website/email when supplied, active category, safe generated slug, reasonable text lengths, postal/PIN format, mode-specific location requirements, named service areas for service-area/hybrid, and public storefront address/map requirements. Normalize matching fields from canonical input; do not expose them publicly.

Use Supabase Storage for logo and cover. Accept JPEG, PNG, WebP, and AVIF images; limit each upload to 5 MB; validate MIME/type server-side; sanitize public text/output. No gallery.

## 7. Route and public-information contract

Authenticated routes:

```text
/login
/dashboard
/dashboard/businesses
/dashboard/businesses/new
/dashboard/businesses/{id}
/dashboard/businesses/{id}/edit
/admin
/admin/businesses
```

Public routes:

```text
/
/business/{slug}
/categories/{slug}
/locations/{slug}
/search
```

- Generate business slugs from canonical name. Owners do not manually edit slugs in normal UI. Approved name changes may update a slug; historical slug redirects permanently to the current canonical URL.
- The public page presents breadcrumbs where applicable, business identity/category, public NAP/contact actions, approved location or service areas, services, hours, optional media, description, and social links. It never presents private/internal fields.
- Search supports business name, primary category, service, and locality/city using PostgreSQL capabilities. Do not add Algolia, Elasticsearch, or OpenSearch.
- Category/location pages show eligible published businesses only. A category+location route may be added only if simple; arbitrary query/filter combinations are not indexable.

## 8. SEO contract

- Canonical business URL: `/business/{business-slug}`.
- Generate title, meta description when real data supports it, canonical tag, basic Open Graph, LocalBusiness JSON-LD, and BreadcrumbList where applicable from canonical stored data only.
- Never invent business claims or expose private address/coordinates in schema.
- Sitemap contains published canonical business URLs only; robots excludes non-public application/dashboard paths and does not promote arbitrary filters.

## 9. UI and onboarding contract

Reuse the Buzl design-system documentation without redesigning the brand. Use a **single multi-section form with progress navigation** for fastest robust prototype delivery; it follows the locked seven conceptual steps:

1. Business Identity
2. Contact / NAP
3. Primary Category + Services
4. Location
5. Optional Details
6. Preview
7. Submit / Publish

Optional enrichment never prevents a minimum publishable listing. Preview shows only the public-safe listing representation.

## 10. Maps and location behavior

Create a provider-neutral location adapter boundary. Do not spend prototype time on a provider evaluation and do not couple canonical data to provider payloads. The prototype may collect/validate a map point through a replaceable adapter or practical manual/admin-assisted capture. Public map display is allowed only for public location data; service-area coverage uses named areas. Provider selection remains replaceable future work.

## 11. Two-day implementation sequence

### Day 1 — authenticated listing flow

1. Scaffold Next.js/TypeScript foundation and Buzl tokens.
2. Configure Supabase integration, Auth, migrations, base RLS, and category seed.
3. Build login, dashboard, assignment-aware business CRUD, and validation.
4. Implement location modes, services, hours, logo/cover, preview, duplicate warning, and publish flow.

**End-of-day goal:** an authenticated admin/owner can create, edit, and publish a valid business listing.

### Day 2 — public directory and deploy

1. Build public canonical listing, slug redirects, search, category pages, and location pages.
2. Add SEO metadata, JSON-LD, sitemap, robots, and admin publish/suspend.
3. Run responsive/security/public-private data QA, production build/tests, and deploy.

**End-of-day goal:** a functional deployed Buzl Listing prototype.

## 12. Prototype QA / definition of done

The prototype is done when email/password auth, admin/owner permissions, CRUD, all three location modes, publishability validation, public canonical pages for published listings, non-public handling for other states, published-only search/discovery, category/location pages, LocalBusiness schema, sitemap, responsive behavior, production build, and deployability are verified.

Required checks include RLS/authorization paths, no auth email/private coordinate leakage, validation of each location mode, slug redirect after approved name change, published-only public access, media constraints, and a clean production build.

## 13. Deferred handoff to the optimization team

After the prototype, address security hardening, load testing, performance optimization, advanced moderation/verification, public signup, claims, advanced RLS review, accessibility audit, SEO expansion, advanced maps/geospatial search, duplicate scoring, analytics, observability, backup/restore verification, rate limiting, abuse prevention, and full browser/device QA. Also revisit notifications, audit/history depth, service taxonomy, holiday hours, gallery, secondary categories, tags, radius, and multi-manager UX.

## 14. Explicit non-goals

This contract authorizes prototype implementation after its own Git checkpoint only. It does not claim that Phase 2.3–2.10 were separately completed, does not authorize production hardening, and does not change Phase 1/2.1 locked decisions.
