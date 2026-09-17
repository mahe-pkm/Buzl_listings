# Buzl Listing — Product Specification

**Status:** Phase 1 product direction locked. Phase 2 will finalize field-level MVP specifications.

## 1. Product purpose

Buzl Listing is a citation-first public business directory.

Its initial purpose is to create accurate, stable, public business profiles for:

- Buzl Digital Solutions clients
- Buzl members

Later, external businesses can register and manage listings under stronger moderation/verification controls.

## 2. Primary product job

Create an indexable business profile containing trustworthy:

- business identity
- NAP
- category
- services
- location/service area
- hours
- contact actions
- map/location context

Citation accuracy is more important than adding marketplace features.

## 3. Initial user types

### Buzl admin

Can manage directory data and later moderation/verification workflows.

### Buzl client/member

Can create/manage business listings.

### External business user

Future/public onboarding user with moderation/verification requirements.

### Public visitor

Can discover and view published businesses without login.

## 4. Listing model

One public listing represents one:

- storefront business location
- service-area business
- hybrid business

Location mode:

```text
storefront
service_area
hybrid
```

A multi-branch brand may later have multiple public listings grouped under a brand/organization.

## 5. Listing lifecycle

Publication:

```text
draft
pending
published
rejected
suspended
archived
```

Verification is separate:

```text
unverified
pending
verified
failed
```

## 6. MVP onboarding direction

Keep initial onboarding short.

```text
Account
  ↓
Business identity + NAP
  ↓
Category + services
  ↓
Location / service area + map
  ↓
Preview
  ↓
Publish / submit
```

Optional enrichment can happen after the core listing exists.

Examples:

- logo
- cover image
- additional services
- social links
- extra media

The exact required/optional field matrix is Phase 2 work.

## 7. MVP scope

Include:

- Supabase authentication
- business onboarding
- business management
- citation-safe NAP
- storefront/service-area/hybrid support
- hierarchical categories
- services
- tags if approved in Phase 2
- business hours
- address/location
- map coordinates
- public listing page
- PostgreSQL-based search
- category/location discovery
- SEO metadata
- LocalBusiness schema
- sitemap/robots
- admin foundation
- publication/verification states

## 8. Not MVP

Do not add yet:

- consumer reviews
- paid ads marketplace
- quote marketplace
- booking engine
- chat
- native mobile app
- complex recommendation AI
- external dedicated search infrastructure
- complex enterprise multi-branch management

## 9. Business data provenance

Authoritative data comes from:

- Buzl
- the business owner/authorized manager
- later trusted integrations/imports

Do not build the product around scraped third-party business records.

## 10. Categories vs services

Category answers:

> What kind of business is this?

Service answers:

> What does this business provide?

Example:

```text
Category:
Digital Marketing Agency

Services:
Local SEO
Google Ads
Meta Ads
Website Development
```

## 11. Design

The application is part of the Buzl product family.

Use:

```text
docs/design/
```

Dashboard/admin surfaces can reuse the existing compact Buzl SaaS patterns.

Public business pages must use the same design DNA with a more readable public-facing information hierarchy.

## 12. Phase 2 product questions

Still to lock:

- exact required business fields
- exact optional fields
- tag governance
- external signup launch behavior
- verification method(s)
- claim-business flow boundary
- public listing layout
- category/location page thresholds

---

## 13. Boss Review Scope Update (2026-09-17)

The following additions were approved following a product review with Balaji.

### Approved target business profile structure

```text
Business Profile
├── Business Information (name, description, year established)
├── Primary Category
├── Contact Information (phone, WhatsApp, email, website)
├── Google Business Profile URL
├── Location (via Google Places search)
├── Service Areas
├── Business Hours
├── Services (max 20)
│   ├── name
│   └── description
├── Products (max 20)
│   ├── name
│   ├── description
│   ├── image
│   ├── price (requires product decision)
│   └── product/external URL (requires product decision)
├── Logo
├── Cover
├── Gallery (limit requires product decision)
├── Social Links
├── Preview
└── Submit for Review
```

### Location UX

The database continues to store latitude, longitude, place_id, and address components. Normal users no longer manually type latitude/longitude.

New intended flow:

```text
Search business/address
  → Google Places suggestions
  → select place
  → populate address fields
  → store Place ID
  → store coordinates internally
```

Provider/API details: pending provider configuration.

Existing service-area privacy rules remain unchanged. Private address/coordinates must not be exposed publicly for service-area businesses.

### Media architecture

| Purpose | Storage |
|---|---|
| Binary media files | Supabase Storage |
| Media metadata and references | PostgreSQL |

Currently approved media types:

- Logo
- Cover
- Gallery
- Product images

Binary media must not be stored in PostgreSQL. Gallery image limit is not yet specified by Balaji — marked as: **Requires product decision**.

### Authentication roadmap update

Current approved authentication additions:

| Method | Status |
|---|---|
| Email OTP | Approved — provider/config pending provider configuration |
| WhatsApp OTP | Approved — provider/config pending approved messaging provider configuration |
| Google OAuth | Paused — requires product confirmation (Boss review prioritized OTP methods) |

Authentication method ≠ authorization authority. New public users are `business_owner` only. Admin and Buzl Member roles remain internally assigned.

### Google Business Profile URL

- Collected from the business owner
- Stored separately from `place_id`
- Displayed publicly as a link/action (e.g., "View on Google")
- No deeper GBP API integration at this time

### Future direction: automatic website generation

Not current implementation scope.

Potential future flow:

```text
Buzl Listing profile
  → business information
  → services
  → products
  → gallery
  → logo/cover
  → location
  → GBP
  → contact details
  → automatically generated website
  → preview
  → Buzl-hosted option
  → CTA: "Want this website on your own domain?"
  → contact Buzl for hosting/custom domain/customization
```
