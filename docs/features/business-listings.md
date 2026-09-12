# Feature — Business Listings

## Owner capabilities

- create draft business
- edit business
- manage contact details
- manage address
- manage category
- manage tags
- manage services
- manage business hours
- manage website/social URLs
- manage logo/cover
- set map coordinates
- preview public profile

## Listing states

- draft
- pending
- published
- rejected
- suspended
- archived

## Verification states

- unverified
- pending
- verified
- failed

Verification state is independent from publication state.

## Listing boundary

One business record represents one physical establishment or one service-area listing. It can have one of these modes:

- `storefront`
- `service_area`
- `hybrid`

Multi-branch organization management is deferred. A service-area business may keep its street address internal while showing service areas publicly.

## Citation fields

NAP accuracy is mandatory:

- exact business name
- structured postal address
- primary phone

Store canonical, display-safe NAP separately from normalized phone/domain/address values used for matching. Owner- or Buzl-provided information is authoritative; do not use scraped third-party data as the source of truth.

## Public page

Should expose only publishable fields and use a stable canonical URL.

Canonical concept: `/business/{slug}`. Category and location must not be structural parts of the listing URL. Retain and redirect historical slugs after approved changes.

## Validation

- valid phone/email/URL formats
- required NAP fields
- safe slug generation
- category validity
- ownership checks
- publication and verification transition authorization
- duplicate candidate detection using strong identifiers and contextual/fuzzy signals
