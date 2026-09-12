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
- service storage model
- tag governance
- MVP auth UX
- external signup launch behavior
- verification method(s)
- claim-business flow boundary
- map provider
- public listing layout
- category/location page thresholds
