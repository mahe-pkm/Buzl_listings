# Feature — Business Listings

**Status:** Phase 1 behavior model locked; Phase 2 field matrix pending.

## Listing unit

One public listing represents one:

```text
storefront
service_area
hybrid
```

business establishment/service-area listing.

## Owner/manager capabilities

MVP direction:

- create draft
- edit business identity
- manage NAP/contact data
- manage category
- manage services
- manage location/service area
- manage map coordinates
- manage business hours
- manage logo/cover
- manage web/social links
- preview
- publish/submit based on policy

## Publication lifecycle

```text
draft
pending
published
rejected
suspended
archived
```

## Verification lifecycle

```text
unverified
pending
verified
failed
```

Do not merge publication and verification into one status.

## Citation-safe NAP

Canonical controlled fields:

- business name
- primary phone
- structured address

Matching/search-normalized values may exist separately.

## Address visibility

For service-area/hybrid businesses, exact street address may be stored internally while hidden publicly.

## Canonical public route

Concept:

```text
/business/{business-slug}
```

Category/location changes do not change the canonical route structure.

Old published slugs should redirect after a legitimate slug change.

## Provenance

Authoritative business data is entered/approved by:

- Buzl
- owner/authorized manager
- future trusted integrations

Do not use scraped third-party data as the master record.

## Phase 2 must lock

- exact required/optional fields
- ownership/membership model
- publish policy for Buzl clients
- publish policy for external users
- slug generation/collision rules
- media rules
- claim-business boundary
